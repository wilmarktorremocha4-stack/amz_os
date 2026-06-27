import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/currentUser";
import { checkUsageLimit } from "@/lib/usage-limit";

export async function GET() {
  let user: Awaited<ReturnType<typeof getCurrentUser>>;
  try { user = await getCurrentUser(); } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = await checkUsageLimit(user.id);
  return NextResponse.json({
    used: status.used,
    limit: status.limit,
    remaining: status.remaining,
    resetAt: status.windowEnd?.toISOString() ?? null,
    resetInMs: status.resetInMs,
    percentUsed: status.percentUsed,
    allowed: status.allowed,
  });
}

export async function POST() {
  return NextResponse.json({ ok: true });
}
