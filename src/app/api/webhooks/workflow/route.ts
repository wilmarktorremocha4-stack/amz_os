import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { fireTrigger } from "@/lib/workflow-engine";
import { TRIGGER_TYPES } from "@/lib/workflow-types";

export async function POST(request: Request) {
  // Require a shared secret — set WEBHOOK_SECRET in Vercel env vars
  const secret = process.env.WEBHOOK_SECRET ?? "";
  const incoming = request.headers.get("x-webhook-secret") ?? "";
  if (
    !secret ||
    incoming.length !== secret.length ||
    !timingSafeEqual(Buffer.from(incoming), Buffer.from(secret))
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { userId, supplierId, data } = body;
  if (!userId || !supplierId) {
    return NextResponse.json({ error: "userId and supplierId required" }, { status: 400 });
  }

  await fireTrigger(userId, TRIGGER_TYPES.INBOUND_WEBHOOK, supplierId, data ?? {});
  return NextResponse.json({ ok: true });
}
