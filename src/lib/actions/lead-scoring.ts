"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";
import OpenAI from "openai";

interface ScoreResult {
  score: number;
  signals: {
    label: string;
    impact: "positive" | "negative" | "neutral";
    detail: string;
  }[];
  summary: string;
  recommendation: string;
}

export async function scoreContact(supplierId: string): Promise<ScoreResult | { error: string }> {
  const user = await getCurrentUser();
  const supplier = await prisma.supplier.findUnique({
    where: { id: supplierId, userId: user.id },
    include: { brands: true, opportunities: { include: { pipeline: true, stage: true } }, enrichment: true },
  });
  if (!supplier) return { error: "Contact not found." };

  if (!process.env.OPENAI_API_KEY) {
    // Heuristic fallback score
    let score = 40;
    const signals: ScoreResult["signals"] = [];
    if (supplier.email) { score += 10; signals.push({ label: "Has email", impact: "positive", detail: "Email contact available" }); }
    if (supplier.website) { score += 5; signals.push({ label: "Has website", impact: "positive", detail: "Brand has online presence" }); }
    if (supplier.brands.length > 0) { score += 15; signals.push({ label: "Brands linked", impact: "positive", detail: `${supplier.brands.length} brand(s) researched` }); }
    if (supplier.opportunities.length > 0) { score += 10; signals.push({ label: "In pipeline", impact: "positive", detail: `${supplier.opportunities.length} active opportunity` }); }
    if (supplier.stage === "APPROVED") { score += 20; signals.push({ label: "Approved", impact: "positive", detail: "Contact marked as approved partner" }); }
    if (supplier.stage === "REJECTED") { score -= 30; signals.push({ label: "Rejected", impact: "negative", detail: "Previously rejected" }); }
    score = Math.min(100, Math.max(0, score));

    await upsertScore(supplierId, score, signals);
    revalidatePath(`/crm/${supplierId}`);
    return { score, signals, summary: "Heuristic score (no OpenAI key)", recommendation: score >= 70 ? "High priority — reach out soon." : score >= 40 ? "Medium priority — worth pursuing." : "Low priority — deprioritize for now." };
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const context = {
    company: supplier.companyName,
    contact: supplier.contactName,
    email: supplier.email,
    website: supplier.website,
    stage: supplier.stage,
    brandsResearched: supplier.brands.length,
    opportunities: supplier.opportunities.map((o) => ({ pipeline: o.pipeline.name, stage: o.stage.name })),
    enrichment: supplier.enrichment ? {
      hasLinkedIn: !!supplier.enrichment.linkedinUrl,
      hasInstagram: !!supplier.enrichment.instagramUrl,
      discoveredEmail: supplier.enrichment.discoveredEmail,
    } : null,
  };

  try {
    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are an Amazon wholesale sourcing expert. Score this supplier lead 0-100 for partnership potential.
Return JSON: { score: number, signals: [{label: string, impact: "positive"|"negative"|"neutral", detail: string}], summary: string, recommendation: string }
Factors: email availability, social presence, stage progression, brand count, website quality, opportunity pipeline.`,
        },
        { role: "user", content: JSON.stringify(context) },
      ],
      max_tokens: 400,
    });

    const parsed: ScoreResult = JSON.parse(res.choices[0]?.message.content ?? "{}");
    await upsertScore(supplierId, parsed.score, parsed.signals);
    revalidatePath(`/crm/${supplierId}`);
    return parsed;
  } catch (err) {
    return { error: err instanceof Error ? err.message : "AI scoring failed." };
  }
}

async function upsertScore(supplierId: string, score: number, signals: unknown) {
  await prisma.leadScore.upsert({
    where: { supplierId },
    create: { supplierId, score, signals: signals as never, scoredAt: new Date() },
    update: { score, signals: signals as never, scoredAt: new Date() },
  });
}

export async function bulkScoreContacts(supplierIds: string[]) {
  const results: Record<string, number> = {};
  for (const id of supplierIds) {
    const r = await scoreContact(id);
    if (!("error" in r)) results[id] = r.score;
  }
  return results;
}
