"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";

export async function createTask(formData: FormData) {
  const user = await getCurrentUser();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;

  await prisma.task.create({ data: { userId: user.id, title } });
  revalidatePath("/progress");
}

export async function toggleTask(taskId: string, completed: boolean) {
  const user = await getCurrentUser();
  await prisma.task.update({
    where: { id: taskId, userId: user.id },
    data: { completed },
  });

  if (completed) {
    await prisma.activityLog.create({
      data: { userId: user.id, type: "TASK_COMPLETED", metadata: { taskId } },
    });
  }

  revalidatePath("/progress");
}

export async function deleteTask(taskId: string) {
  const user = await getCurrentUser();
  await prisma.task.delete({ where: { id: taskId, userId: user.id } });
  revalidatePath("/progress");
}

export async function logRevenue(formData: FormData) {
  const user = await getCurrentUser();
  const amount = parseFloat(String(formData.get("amount") ?? ""));
  if (Number.isNaN(amount)) return;

  await prisma.revenueEntry.create({
    data: {
      userId: user.id,
      amount,
      note: String(formData.get("note") ?? "").trim() || null,
    },
  });

  await prisma.activityLog.create({
    data: { userId: user.id, type: "REVENUE_MILESTONE", metadata: { amount } },
  });

  revalidatePath("/progress");
}

export async function logCommunityEngagement(formData: FormData) {
  const user = await getCurrentUser();
  const note = String(formData.get("note") ?? "").trim();

  await prisma.activityLog.create({
    data: { userId: user.id, type: "COMMUNITY_ENGAGEMENT", metadata: note ? { note } : undefined },
  });

  revalidatePath("/progress");
}

export async function updateSkoolProgress(formData: FormData) {
  const user = await getCurrentUser();
  const pct = Math.max(0, Math.min(100, parseInt(String(formData.get("pct") ?? "0"), 10) || 0));

  await prisma.user.update({
    where: { id: user.id },
    data: { skoolCourseProgressPct: pct },
  });

  revalidatePath("/progress");
}
