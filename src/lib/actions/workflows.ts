"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";
import { WorkflowStep, TriggerType, TriggerConfig } from "@/lib/workflow-types";
import { processOneEnrollment } from "@/lib/workflow-engine";

export async function createWorkflow(data: { name: string; description?: string; triggerType: TriggerType; triggerConfig: TriggerConfig }) {
  const user = await getCurrentUser();
  const workflow = await prisma.workflow.create({
    data: { userId: user.id, name: data.name, description: data.description ?? null, triggerType: data.triggerType, triggerConfig: data.triggerConfig as never, steps: [], nodes: [], edges: [] },
  });
  revalidatePath("/automations");
  return workflow;
}

export async function updateWorkflow(workflowId: string, data: { name?: string; description?: string; triggerType?: TriggerType; triggerConfig?: TriggerConfig; steps?: WorkflowStep[]; nodes?: unknown[]; edges?: unknown[]; status?: "draft" | "active" | "paused"; builderMode?: string }) {
  const user = await getCurrentUser();

  if (data.steps) {
    const current = await prisma.workflow.findUnique({ where: { id: workflowId }, select: { steps: true, nodes: true, edges: true } });
    if (current) {
      await prisma.workflowVersion.create({
        data: { workflowId, steps: current.steps as never, nodes: current.nodes as never, edges: current.edges as never, savedBy: (user.firstName ? `${user.firstName} ${user.lastName ?? ""}`.trim() : user.email) ?? "Team member" },
      });
      const old = await prisma.workflowVersion.findMany({ where: { workflowId }, orderBy: { createdAt: "desc" }, skip: 20, select: { id: true } });
      if (old.length) await prisma.workflowVersion.deleteMany({ where: { id: { in: old.map((v) => v.id) } } });
    }
  }

  const workflow = await prisma.workflow.update({
    where: { id: workflowId, userId: user.id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.triggerType !== undefined && { triggerType: data.triggerType }),
      ...(data.triggerConfig !== undefined && { triggerConfig: data.triggerConfig as never }),
      ...(data.steps !== undefined && { steps: data.steps as never }),
      ...(data.nodes !== undefined && { nodes: data.nodes as never }),
      ...(data.edges !== undefined && { edges: data.edges as never }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.builderMode !== undefined && { builderMode: data.builderMode }),
    },
  });
  // Create a version snapshot when steps are updated, keep only last 20
  if (data.steps !== undefined) {
    await prisma.workflowVersion.create({
      data: {
        workflowId,
        steps: data.steps as never,
        nodes: (data.nodes ?? workflow.nodes) as never,
        edges: (data.edges ?? workflow.edges) as never,
        savedBy: user.name ?? user.email,
      },
    });
    const versions = await prisma.workflowVersion.findMany({ where: { workflowId }, orderBy: { createdAt: "desc" }, select: { id: true } });
    if (versions.length > 20) {
      const toDelete = versions.slice(20).map((v) => v.id);
      await prisma.workflowVersion.deleteMany({ where: { id: { in: toDelete } } });
    }
  }
  revalidatePath("/automations");
  revalidatePath(`/automations/${workflowId}`);
  return workflow;
}

export async function archiveWorkflow(workflowId: string) {
  const user = await getCurrentUser();
  await prisma.workflow.update({ where: { id: workflowId, userId: user.id }, data: { archived: true } });
  revalidatePath("/automations");
  revalidatePath("/archive");
}

export async function restoreWorkflow(workflowId: string) {
  const user = await getCurrentUser();
  await prisma.workflow.update({ where: { id: workflowId, userId: user.id }, data: { archived: false } });
  revalidatePath("/automations");
  revalidatePath("/archive");
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

export async function getWorkflowExecutionLogs(workflowId: string) {
  const user = await getCurrentUser();
  await prisma.workflow.findFirstOrThrow({ where: { id: workflowId, userId: user.id } });
  return prisma.workflowExecutionLog.findMany({ where: { workflowId }, orderBy: { createdAt: "desc" }, take: 200 });
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

export async function getWorkflowNotes(workflowId: string) {
  const user = await getCurrentUser();
  await prisma.workflow.findFirstOrThrow({ where: { id: workflowId, userId: user.id } });
  return prisma.workflowNote.findMany({ where: { workflowId }, orderBy: { createdAt: "desc" } });
}

export async function addWorkflowNote(workflowId: string, content: string) {
  const user = await getCurrentUser();
  await prisma.workflow.findFirstOrThrow({ where: { id: workflowId, userId: user.id } });
  const note = await prisma.workflowNote.create({
    data: { workflowId, content, authorId: user.id, authorName: user.name ?? user.email },
  });
  revalidatePath(`/automations/${workflowId}`);
  return note;
}

export async function getWorkflowVersions(workflowId: string) {
  const user = await getCurrentUser();
  await prisma.workflow.findFirstOrThrow({ where: { id: workflowId, userId: user.id } });
  return prisma.workflowVersion.findMany({ where: { workflowId }, orderBy: { createdAt: "desc" }, take: 20 });
}

export async function restoreWorkflowVersion(versionId: string) {
  const user = await getCurrentUser();
  const version = await prisma.workflowVersion.findFirst({ where: { id: versionId }, include: { workflow: true } });
  if (!version || version.workflow.userId !== user.id) return;
  await prisma.workflow.update({
    where: { id: version.workflowId },
    data: { steps: version.steps as never, nodes: version.nodes as never, edges: version.edges as never },
  });
  revalidatePath(`/automations/${version.workflowId}`);
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
    where: { userId: user.id, archived: false, ...(excludeWorkflowId ? { id: { not: excludeWorkflowId } } : {}) },
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

export async function getWorkflowExecutionLogs(workflowId: string) {
  const user = await getCurrentUser();
  const wf = await prisma.workflow.findUnique({ where: { id: workflowId, userId: user.id } });
  if (!wf) return [];
  return prisma.workflowExecutionLog.findMany({ where: { workflowId }, orderBy: { createdAt: "desc" }, take: 200 });
}

export async function getWorkflowEnrollments(workflowId: string) {
  const user = await getCurrentUser();
  const wf = await prisma.workflow.findUnique({ where: { id: workflowId, userId: user.id } });
  if (!wf) return [];
  return prisma.workflowEnrollment.findMany({
    where: { workflowId },
    include: { supplier: { select: { id: true, companyName: true, email: true } } },
    orderBy: { startedAt: "desc" },
  });
}

export async function removeEnrollment(enrollmentId: string) {
  const user = await getCurrentUser();
  const enrollment = await prisma.workflowEnrollment.findUnique({ where: { id: enrollmentId }, include: { workflow: true } });
  if (!enrollment || enrollment.workflow.userId !== user.id) return;
  await prisma.workflowEnrollment.update({ where: { id: enrollmentId }, data: { status: "removed", nextRunAt: null } });
}

export async function getWorkflowNotes(workflowId: string) {
  const user = await getCurrentUser();
  const wf = await prisma.workflow.findUnique({ where: { id: workflowId, userId: user.id } });
  if (!wf) return [];
  return prisma.workflowNote.findMany({ where: { workflowId }, orderBy: { createdAt: "desc" } });
}

export async function addWorkflowNote(workflowId: string, content: string) {
  const user = await getCurrentUser();
  return prisma.workflowNote.create({
    data: { workflowId, content, authorId: user.id, authorName: (user.firstName ? `${user.firstName} ${user.lastName ?? ""}`.trim() : user.email) ?? "Team member" },
  });
}

export async function getWorkflowVersions(workflowId: string) {
  const user = await getCurrentUser();
  const wf = await prisma.workflow.findUnique({ where: { id: workflowId, userId: user.id } });
  if (!wf) return [];
  return prisma.workflowVersion.findMany({ where: { workflowId }, orderBy: { createdAt: "desc" }, take: 20 });
}

export async function restoreWorkflowVersion(versionId: string) {
  const user = await getCurrentUser();
  const version = await prisma.workflowVersion.findUnique({ where: { id: versionId }, include: { workflow: true } });
  if (!version || version.workflow.userId !== user.id) return;
  await prisma.workflow.update({
    where: { id: version.workflowId },
    data: { steps: version.steps as never, nodes: version.nodes as never, edges: version.edges as never },
  });
  revalidatePath(`/automations/${version.workflowId}`);
}

export async function listWorkflowsForPicker(excludeId: string) {
  const user = await getCurrentUser();
  return prisma.workflow.findMany({
    where: { userId: user.id, archived: false, id: { not: excludeId } },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export async function testWorkflowStep(workflowId: string, supplierId: string) {
  const user = await getCurrentUser();
  const workflow = await prisma.workflow.findUnique({ where: { id: workflowId, userId: user.id } });
  if (!workflow) throw new Error("Workflow not found");
  const testEnrollment = await prisma.workflowEnrollment.create({
    data: { workflowId, supplierId, status: "active", currentStep: 0, nextRunAt: new Date() },
  });
  await processOneEnrollment(testEnrollment.id);
  return prisma.workflowExecutionLog.findMany({
    where: { enrollmentId: testEnrollment.id },
    orderBy: { createdAt: "asc" },
  });
}
