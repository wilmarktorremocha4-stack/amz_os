import { NextResponse } from "next/server";
import { fireTrigger } from "@/lib/workflow-engine";
import { TRIGGER_TYPES } from "@/lib/workflow-types";

export async function POST(request: Request) {
  const body = await request.json();
  const { userId, supplierId, data } = body;
  if (!userId || !supplierId) return NextResponse.json({ error: "userId and supplierId required" }, { status: 400 });
  await fireTrigger(userId, TRIGGER_TYPES.INBOUND_WEBHOOK, supplierId, data ?? {});
  return NextResponse.json({ ok: true });
}
