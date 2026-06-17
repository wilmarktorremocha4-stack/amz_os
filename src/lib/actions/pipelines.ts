"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";

// ---------- Pipelines ----------

export async function createPipeline(formData: FormData) {
  const user = await getCurrentUser();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const stagesRaw = String(formData.get("stages") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const stageNames = stagesRaw.length
    ? stagesRaw
    : ["New Lead", "Contacted", "Proposal Sent", "Closed Won"];

  await prisma.pipeline.create({
    data: {
      userId: user.id,
      name,
      stages: {
        create: stageNames.map((stageName, i) => ({ name: stageName, order: i })),
      },
    },
  });

  revalidatePath("/crm");
  redirect("/crm?tab=pipelines");
}

export async function deletePipeline(pipelineId: string) {
  const user = await getCurrentUser();
  await prisma.pipeline.delete({ where: { id: pipelineId, userId: user.id } });
  revalidatePath("/crm");
}

export async function addPipelineStage(formData: FormData) {
  const user = await getCurrentUser();
  const pipelineId = String(formData.get("pipelineId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!pipelineId || !name) return;

  const pipeline = await prisma.pipeline.findUnique({
    where: { id: pipelineId, userId: user.id },
    include: { stages: true },
  });
  if (!pipeline) return;

  await prisma.pipelineStage.create({
    data: { pipelineId, name, order: pipeline.stages.length },
  });
  revalidatePath("/crm");
}

export async function deletePipelineStage(stageId: string) {
  const user = await getCurrentUser();
  const stage = await prisma.pipelineStage.findUnique({
    where: { id: stageId },
    include: { pipeline: true },
  });
  if (!stage || stage.pipeline.userId !== user.id) return;
  await prisma.pipelineStage.delete({ where: { id: stageId } });
  revalidatePath("/crm");
}

// ---------- Opportunities ----------

export async function createOpportunity(formData: FormData) {
  const user = await getCurrentUser();
  const name = String(formData.get("name") ?? "").trim();
  const pipelineId = String(formData.get("pipelineId") ?? "");
  const stageId = String(formData.get("stageId") ?? "");
  const supplierId = String(formData.get("supplierId") ?? "") || null;
  const valueStr = String(formData.get("value") ?? "");
  const value = valueStr ? parseFloat(valueStr) : null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!name || !pipelineId || !stageId) return;

  await prisma.opportunity.create({
    data: { userId: user.id, name, pipelineId, stageId, supplierId, value, notes },
  });
  revalidatePath("/crm");
}

export async function moveOpportunityStage(opportunityId: string, stageId: string) {
  const user = await getCurrentUser();
  await prisma.opportunity.update({
    where: { id: opportunityId, userId: user.id },
    data: { stageId },
  });
  revalidatePath("/crm");
}

export async function updateOpportunityStatus(opportunityId: string, status: string) {
  const user = await getCurrentUser();
  await prisma.opportunity.update({
    where: { id: opportunityId, userId: user.id },
    data: { status },
  });
  revalidatePath("/crm");
}

export async function deleteOpportunity(opportunityId: string) {
  const user = await getCurrentUser();
  await prisma.opportunity.delete({ where: { id: opportunityId, userId: user.id } });
  revalidatePath("/crm");
}
