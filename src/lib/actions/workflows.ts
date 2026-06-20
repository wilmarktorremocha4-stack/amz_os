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
    },
  });
  revalidatePath("/automations");
  revalidatePath(`/automations/${workflowId}`);
  return workflow;
}

export async function deleteWorkflow(workflowId: string) {
  const user = await getCurrentUser();
  await prisma.workflow.delete({ where: { id: workflowId, userId: user.id } });
  revalidatePath("/automations");
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
