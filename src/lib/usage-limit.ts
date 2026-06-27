import { prisma } from "@/lib/prisma";

const MESSAGES_PER_WINDOW = 50;
const WINDOW_HOURS = 24;
const WINDOW_MS = WINDOW_HOURS * 60 * 60 * 1000;

export interface UsageStatus {
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
  windowStart: Date | null;
  windowEnd: Date | null;
  resetInMs: number;
  percentUsed: number;
}

export async function checkUsageLimit(userId: string): Promise<UsageStatus> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - WINDOW_MS);

  const used = await prisma.usageLog.count({
    where: { userId, createdAt: { gte: windowStart } },
  });

  const oldest = await prisma.usageLog.findFirst({
    where: { userId, createdAt: { gte: windowStart } },
    orderBy: { createdAt: "asc" },
    select: { createdAt: true },
  });

  const wEnd = oldest ? new Date(oldest.createdAt.getTime() + WINDOW_MS) : null;
  const resetInMs = wEnd ? Math.max(0, wEnd.getTime() - now.getTime()) : 0;
  const remaining = Math.max(0, MESSAGES_PER_WINDOW - used);
  const percentUsed = Math.min(100, Math.round((used / MESSAGES_PER_WINDOW) * 100));

  return {
    allowed: remaining > 0,
    used,
    limit: MESSAGES_PER_WINDOW,
    remaining,
    windowStart: oldest?.createdAt ?? null,
    windowEnd: wEnd,
    resetInMs,
    percentUsed,
  };
}

export async function logUsage(data: { userId: string; messageId?: string }): Promise<void> {
  await prisma.usageLog.create({
    data: { userId: data.userId, messageId: data.messageId ?? null },
  });
}
