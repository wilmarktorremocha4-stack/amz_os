import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";

const DIFY_BASE = (process.env.DIFY_API_URL ?? "https://api.dify.ai/v1").replace(/\/$/, "");
const getDifyKey = () => process.env.DIFY_API_KEY ?? process.env.UDIFY_APP_KEY ?? "";

export async function POST(req: NextRequest) {
  let user: Awaited<ReturnType<typeof getCurrentUser>>;
  try { user = await getCurrentUser(); } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const DIFY_KEY = getDifyKey();
  if (!DIFY_KEY) return NextResponse.json({ error: "No API key" }, { status: 500 });

  const incoming = await req.formData();
  const file = incoming.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const form = new FormData();
  form.append("file", file);
  form.append("user", user.id);

  const res = await fetch(`${DIFY_BASE}/files/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${DIFY_KEY}` },
    body: form,
  });

  if (!res.ok) return NextResponse.json({ error: "Upload failed" }, { status: res.status });
  const data = await res.json();

  await prisma.userFile.create({
    data: {
      userId: user.id,
      name: file.name,
      fileType: file.type.startsWith("image/") ? "image" : "document",
      size: file.size,
      mimeType: file.type,
      difyFileId: data.id ?? null,
    },
  }).catch(() => {});

  return NextResponse.json(data);
}
