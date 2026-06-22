import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/currentUser";

const DIFY_BASE = process.env.DIFY_API_URL ?? "https://api.dify.ai/v1";

function getDifyKey() {
  return (
    process.env.DIFY_API_KEY ??
    process.env.NEXT_PUBLIC_UDIFY_APP_KEY ??
    process.env.NEXT_PUBLIC_APP_KEY ??
    process.env.UDIFY_APP_KEY ??
    ""
  );
}

export async function POST(req: NextRequest) {
  let user: Awaited<ReturnType<typeof getCurrentUser>>;
  try { user = await getCurrentUser(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }

  const DIFY_KEY = getDifyKey();
  if (!DIFY_KEY) return NextResponse.json({ error: "No API key" }, { status: 500 });

  const incoming = await req.formData();
  const file = incoming.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const form = new FormData();
  form.append("file", file);
  form.append("user", user.id);

  const res = await fetch(`${DIFY_BASE}/files/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${DIFY_KEY}` },
    body: form,
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: `Upload failed: ${err}` }, { status: res.status });
  }

  return NextResponse.json(await res.json());
}
