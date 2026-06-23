import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";

const WINDOW_MS = 5 * 60 * 60 * 1000;
export const TOKEN_LIMIT = 100_000;

function windowStart() {
  return new Date(Date.now() - WINDOW_MS);
}

export async function GET() {
  let user: Awaited<ReturnType<typeof getCurrentUser>>;
  try { user = await getCurrentUser(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }

  try {
    const agg = await prisma.aiUsageLog.aggregate({
      where: { userId: user.id, createdAt: { gte: windowStart() } },
      _sum: { tokens: true },
    });
    const used = agg._sum.tokens ?? 0;
    const oldest = await prisma.aiUsageLog.findFirst({
      where: { userId: user.id, createdAt: { gte: windowStart() } },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    });
    const resetAt = oldest ? new Date(oldest.createdAt.getTime() + WINDOW_MS).toISOString() : null;
    return NextResponse.json({ used, limit: TOKEN_LIMIT, resetAt });
  } catch {
    return NextResponse.json({ used: 0, limit: TOKEN_LIMIT, resetAt: null });
  }
}

export async function POST(req: NextRequest) {
  let user: Awaited<ReturnType<typeof getCurrentUser>>;
  try { user = await getCurrentUser(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }

  try {
    const body = await req.json().catch(() => ({})) as { tokens?: number };
    const tokens = Math.max(1, Math.round(body.tokens ?? 1));

    const agg = await prisma.aiUsageLog.aggregate({
      where: { userId: user.id, createdAt: { gte: windowStart() } },
      _sum: { tokens: true },
    });
    const used = agg._sum.tokens ?? 0;

    if (used >= TOKEN_LIMIT) {
      return NextResponse.json({ error: "Limit reached", used, limit: TOKEN_LIMIT }, { status: 429 });
    }

    await prisma.aiUsageLog.create({ data: { userId: user.id, tokens } });
    const newUsed = used + tokens;

    const oldest = await prisma.aiUsageLog.findFirst({
      where: { userId: user.id, createdAt: { gte: windowStart() } },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    });
    const resetAt = oldest
      ? new Date(oldest.createdAt.getTime() + WINDOW_MS).toISOString()
      : new Date(Date.now() + WINDOW_MS).toISOString();

    return NextResponse.json({ used: newUsed, limit: TOKEN_LIMIT, resetAt });
  } catch {
    return NextResponse.json({ used: 0, limit: TOKEN_LIMIT, resetAt: null });
  }
}
