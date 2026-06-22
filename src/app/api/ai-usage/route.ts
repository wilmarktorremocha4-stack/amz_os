import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";

const WINDOW_MS = 5 * 60 * 60 * 1000; // 5-hour rolling window
const DAILY_MSG_LIMIT = 50;

function windowStart() {
  return new Date(Date.now() - WINDOW_MS);
}

export async function GET() {
  let user: Awaited<ReturnType<typeof getCurrentUser>>;
  try { user = await getCurrentUser(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }

  const count = await prisma.aiUsageLog.count({
    where: { userId: user.id, createdAt: { gte: windowStart() } },
  });

  const nextResetAt = await prisma.aiUsageLog.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    select: { createdAt: true },
  });

  const resetAt = nextResetAt
    ? new Date(nextResetAt.createdAt.getTime() + WINDOW_MS).toISOString()
    : new Date(Date.now() + WINDOW_MS).toISOString();

  return NextResponse.json({ count, limit: DAILY_MSG_LIMIT, resetAt });
}

export async function POST(req: NextRequest) {
  void req;
  let user: Awaited<ReturnType<typeof getCurrentUser>>;
  try { user = await getCurrentUser(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }

  const count = await prisma.aiUsageLog.count({
    where: { userId: user.id, createdAt: { gte: windowStart() } },
  });

  if (count >= DAILY_MSG_LIMIT) {
    return NextResponse.json({ error: "Limit reached", count, limit: DAILY_MSG_LIMIT }, { status: 429 });
  }

  await prisma.aiUsageLog.create({ data: { userId: user.id } });
  const newCount = count + 1;

  const oldest = await prisma.aiUsageLog.findFirst({
    where: { userId: user.id, createdAt: { gte: windowStart() } },
    orderBy: { createdAt: "asc" },
    select: { createdAt: true },
  });
  const resetAt = oldest
    ? new Date(oldest.createdAt.getTime() + WINDOW_MS).toISOString()
    : new Date(Date.now() + WINDOW_MS).toISOString();

  return NextResponse.json({ count: newCount, limit: DAILY_MSG_LIMIT, resetAt });
}
