"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";
import { WorkflowStep, TriggerType, TriggerConfig } from "@/lib/workflow-types";

export async function createWorkflow(data: { name: string; description?: string; triggerType: TriggerType; triggerConfig: TriggerConfig }) {
  const user = await getCurrentUser();
  const workflow = await prisma.workflow.create({
    data: { userId: user.id, name: data.name, description: data.description ?? null, triggerType: data.triggerType, triggerConfig: data.triggerConfig as never, steps: [], nodes: [], edges: [] },
  });
  revalidatePath("/automations");
  return workflow;
}

export async function updateWorkflow(workflowId: string, data: { name?: string; description?: string; triggerType?: TriggerType; triggerConfig?: TriggerConfig; steps?: WorkflowStep[]; nodes?: unknown[]; edges?: unknown[]; status?: "draft" | "active" | "paused" }) {
  const user = await getCurrentUser();

  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.triggerType !== undefined) updateData.triggerType = data.triggerType;
  if (data.triggerConfig !== undefined) updateData.triggerConfig = data.triggerConfig;
  if (data.steps !== undefined) updateData.steps = data.steps;
  if (data.nodes !== undefined) updateData.nodes = data.nodes;
  if (data.edges !== undefined) updateData.edges = data.edges;
  if (data.status !== undefined) updateData.status = data.status;

  const workflow = await prisma.workflow.update({
    where: { id: workflowId, userId: user.id },
    data: updateData as never,
  });

  revalidatePath("/automations");
  revalidatePath(`/automations/${workflowId}`);
  return workflow;
}

export async function archiveWorkflow(_workflowId: string) {
  // archived column not yet in DB — no-op
}

export async function restoreWorkflow(_workflowId: string) {
  // archived column not yet in DB — no-op
}

export async function deleteWorkflowPermanently(workflowId: string) {
  const user = await getCurrentUser();
  await prisma.workflow.delete({ where: { id: workflowId, userId: user.id } });
  revalidatePath("/archive");
}

export async function toggleWorkflowStatus(workflowId: string) {
  const user = await getCurrentUser();
  const wf = await prisma.workflow.findUnique({ where: { id: workflowId, userId: user.id } });
  if (!wf) return;
  await prisma.workflow.update({ where: { id: workflowId }, data: { status: wf.status === "active" ? "paused" : "active" } });
  revalidatePath("/automations");
}

export async function manuallyEnroll(workflowId: string, supplierIds: string[]) {
  const user = await getCurrentUser();
  const wf = await prisma.workflow.findUnique({ where: { id: workflowId, userId: user.id } });
  if (!wf) return;
  for (const supplierId of supplierIds) {
    await prisma.workflowEnrollment.upsert({
      where: { workflowId_supplierId: { workflowId, supplierId } },
      create: { workflowId, supplierId, status: "active", currentStep: 0, nextRunAt: new Date() },
      update: { status: "active", currentStep: 0, nextRunAt: new Date() },
    });
  }
  revalidatePath(`/automations/${workflowId}`);
}

export async function getWorkflowExecutionLogs(_workflowId: string) {
  return [] as never[];
}

export async function getWorkflowEnrollments(workflowId: string) {
  const user = await getCurrentUser();
  await prisma.workflow.findFirstOrThrow({ where: { id: workflowId, userId: user.id } });
  return prisma.workflowEnrollment.findMany({
    where: { workflowId },
    include: { supplier: { select: { id: true, companyName: true, email: true, stage: true } } },
    orderBy: { startedAt: "desc" },
    take: 200,
  });
}

export async function removeEnrollment(enrollmentId: string) {
  const user = await getCurrentUser();
  const enrollment = await prisma.workflowEnrollment.findFirst({ where: { id: enrollmentId }, include: { workflow: true } });
  if (!enrollment || enrollment.workflow.userId !== user.id) return;
  await prisma.workflowEnrollment.delete({ where: { id: enrollmentId } });
  revalidatePath(`/automations/${enrollment.workflowId}`);
}

export async function getWorkflowNotes(_workflowId: string) {
  return [] as never[];
}

export async function addWorkflowNote(_workflowId: string, _content: string) {
  return null;
}

export async function getWorkflowVersions(_workflowId: string) {
  return [] as never[];
}

export async function restoreWorkflowVersion(_versionId: string) {
  return;
}

export async function testWorkflowStep(workflowId: string, supplierId: string) {
  const user = await getCurrentUser();
  const wf = await prisma.workflow.findFirst({ where: { id: workflowId, userId: user.id } });
  if (!wf) return { error: "Workflow not found" };
  const enrollment = await prisma.workflowEnrollment.upsert({
    where: { workflowId_supplierId: { workflowId, supplierId } },
    create: { workflowId, supplierId, status: "active", currentStep: 0, nextRunAt: new Date() },
    update: { status: "active", currentStep: 0, nextRunAt: new Date() },
  });
  revalidatePath(`/automations/${workflowId}`);
  return { enrollmentId: enrollment.id };
}

export async function listWorkflowsForPicker(excludeWorkflowId?: string) {
  const user = await getCurrentUser();
  return prisma.workflow.findMany({
    where: { userId: user.id, ...(excludeWorkflowId ? { id: { not: excludeWorkflowId } } : {}) },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export async function createDefaultWorkflow() {
  "use server";
  const user = await getCurrentUser();
  const workflow = await prisma.workflow.create({
    data: {
      userId: user.id,
      name: `New Workflow : ${Date.now()}`,
      triggerType: "",
      triggerConfig: {},
      steps: [],
      nodes: [],
      edges: [],
      status: "draft",
    },
  });
  redirect(`/automations/${workflow.id}`);
}

