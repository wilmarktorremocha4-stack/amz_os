import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { processWorkflowQueue } from "@/lib/workflow-engine";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${process.env.CRON_SECRET ?? ""}`;
  const valid =
    authHeader.length === expected.length &&
    timingSafeEqual(Buffer.from(authHeader), Buffer.from(expected));
  if (!valid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await processWorkflowQueue();
    return NextResponse.json({ ok: true, processedAt: new Date().toISOString() });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
