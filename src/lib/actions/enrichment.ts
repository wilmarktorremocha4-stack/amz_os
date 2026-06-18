"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";
import OpenAI from "openai";

export async function enrichContact(supplierId: string) {
  const user = await getCurrentUser();
  const supplier = await prisma.supplier.findUnique({
    where: { id: supplierId, userId: user.id },
  });
  if (!supplier) return { error: "Contact not found" };

  const website = supplier.website;
  if (!website) return { error: "No website set — add a website URL first." };

  const url = website.startsWith("http") ? website : `https://${website}`;

  let websiteText = "";
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; AMZ-OS-Bot/1.0)" },
      signal: AbortSignal.timeout(10000),
    });
    websiteText = await res.text();
  } catch {
    return { error: "Could not fetch website. Check the URL." };
  }

  // Extract emails with regex
  const emailMatches = websiteText.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g) ?? [];
  const filteredEmails = [...new Set(emailMatches)].filter(
    (e) => !e.includes("example") && !e.includes("test@") && !e.includes(".png") && !e.includes(".jpg")
  );

  // Extract social links
  const linkedin = websiteText.match(/https?:\/\/(www\.)?linkedin\.com\/company\/[a-zA-Z0-9\-_/]+/)?.[0];
  const instagram = websiteText.match(/https?:\/\/(www\.)?instagram\.com\/[a-zA-Z0-9_.]+/)?.[0];
  const facebook = websiteText.match(/https?:\/\/(www\.)?facebook\.com\/[a-zA-Z0-9_.]+/)?.[0];
  const twitter = websiteText.match(/https?:\/\/(www\.)?(?:twitter|x)\.com\/[a-zA-Z0-9_]+/)?.[0];

  // Find contact page
  const contactLinks = websiteText.match(/href="([^"]*(?:contact|about|reach)[^"]*)"/gi) ?? [];
  const contactHref = contactLinks[0]?.match(/href="([^"]*)"/)?.[1];
  let contactPageUrl: string | undefined;
  if (contactHref) {
    try { contactPageUrl = new URL(contactHref, url).href; } catch { /* ignore */ }
  }

  // Use AI to pick the best contact email if multiple found
  let discoveredEmail = filteredEmails[0] ?? null;
  if (filteredEmails.length > 1 && process.env.OPENAI_API_KEY) {
    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const r = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Pick the most likely business contact / wholesale inquiry email from this list. Return only the email address, nothing else." },
          { role: "user", content: filteredEmails.join(", ") },
        ],
        max_tokens: 50,
      });
      discoveredEmail = r.choices[0]?.message.content?.trim() ?? filteredEmails[0];
    } catch { /* fall back to first */ }
  }

  await prisma.contactEnrichment.upsert({
    where: { supplierId },
    create: {
      supplierId,
      websiteUrl: url,
      contactPageUrl,
      linkedinUrl: linkedin,
      instagramUrl: instagram,
      facebookUrl: facebook,
      twitterUrl: twitter,
      discoveredEmail,
      source: "ai",
    },
    update: {
      websiteUrl: url,
      contactPageUrl,
      linkedinUrl: linkedin,
      instagramUrl: instagram,
      facebookUrl: facebook,
      twitterUrl: twitter,
      discoveredEmail,
      source: "ai",
      enrichedAt: new Date(),
    },
  });

  // If email discovered and contact has none, update supplier
  if (discoveredEmail && !supplier.email) {
    await prisma.supplier.update({
      where: { id: supplierId },
      data: { email: discoveredEmail },
    });
  }

  const { revalidatePath } = await import("next/cache");
  revalidatePath(`/crm/${supplierId}`);
  revalidatePath("/crm");
  revalidatePath("/contacts/enrich");

  return {
    email: discoveredEmail,
    linkedin,
    instagram,
    facebook,
    twitter,
    contactPage: contactPageUrl,
    allEmails: filteredEmails,
  };
}

export async function bulkEnrich(supplierIds: string[]) {
  const results: Record<string, { success: boolean; email?: string | null }> = {};
  for (const id of supplierIds) {
    const r = await enrichContact(id);
    results[id] = "error" in r ? { success: false } : { success: true, email: r.email };
  }
  return results;
}
