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

export async function GET(req: NextRequest) {
  try { await getCurrentUser(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }

  const { searchParams } = new URL(req.url);
  const path = searchParams.get("path") ?? "";
  if (!path) return NextResponse.json({ error: "Missing path" }, { status: 400 });

  const key = getDifyKey();
  if (!key) return NextResponse.json({ error: "No API key" }, { status: 503 });

  // Extract UUID from path like "tools/15d09afd-ee41-48b3-862e-99bd8963d140.docx"
  const uuidMatch = path.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
  const fileId = uuidMatch?.[1];
  if (!fileId) return NextResponse.json({ error: "Invalid file path" }, { status: 400 });

  // Try Dify file preview endpoint
  const url = `${DIFY_BASE}/files/${fileId}/file-preview`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${key}` },
  });

  if (!res.ok) {
    return NextResponse.json({ error: `Dify file fetch failed: ${res.status}` }, { status: 502 });
  }

  const contentType = res.headers.get("content-type") ?? "application/octet-stream";
  const ext = path.split(".").pop() ?? "";
  const filename = `file.${ext}`;

  return new Response(res.body, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
