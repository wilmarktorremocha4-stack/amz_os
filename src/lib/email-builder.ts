export type EmailBlock =
  | { id: string; type: "heading"; text: string; level: 1 | 2 | 3; align: "left" | "center" | "right" }
  | { id: string; type: "text"; content: string; align: "left" | "center" | "right" }
  | { id: string; type: "button"; label: string; url: string; bgColor: string; align: "left" | "center" | "right" }
  | { id: string; type: "image"; src: string; alt: string; align: "left" | "center" | "right" }
  | { id: string; type: "divider" }
  | { id: string; type: "spacer"; px: number };

export type EmailDoc = { blocks: EmailBlock[] };

export const DEFAULT_DOC: EmailDoc = {
  blocks: [
    { id: "h1", type: "heading", text: "Hello {{firstName}}!", level: 1, align: "left" },
    { id: "t1", type: "text", content: "I hope this message finds you well.\n\nI'd love to discuss a wholesale partnership with your brand.", align: "left" },
    { id: "b1", type: "button", label: "Reply to this email", url: "mailto:", bgColor: "#2563eb", align: "left" },
    { id: "s1", type: "spacer", px: 16 },
    { id: "d1", type: "divider" },
    { id: "t2", type: "text", content: "Best regards,\n{{senderName}}", align: "left" },
  ],
};

function sub(s: string, vars: Record<string, string>): string {
  return s.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`);
}

export function renderEmailHtml(doc: EmailDoc, vars: Record<string, string> = {}): string {
  const rows = doc.blocks.map((block) => {
    switch (block.type) {
      case "heading": {
        const sizes = { 1: "28px", 2: "22px", 3: "18px" };
        return `<tr><td align="${block.align}" style="padding:12px 32px 4px"><span style="margin:0;font-size:${sizes[block.level]};font-weight:700;color:#0f172a;line-height:1.2">${sub(block.text, vars)}</span></td></tr>`;
      }
      case "text":
        return `<tr><td align="${block.align}" style="padding:6px 32px;font-size:15px;line-height:1.7;color:#334155;white-space:pre-line">${sub(block.content, vars)}</td></tr>`;
      case "button":
        return `<tr><td align="${block.align}" style="padding:16px 32px"><a href="${sub(block.url, vars)}" style="display:inline-block;padding:12px 28px;background:${block.bgColor};color:#fff;font-weight:600;font-size:14px;border-radius:8px;text-decoration:none;letter-spacing:0.01em">${sub(block.label, vars)}</a></td></tr>`;
      case "image":
        return `<tr><td align="${block.align}" style="padding:12px 32px"><img src="${sub(block.src, vars)}" alt="${sub(block.alt, vars)}" style="max-width:100%;height:auto;border-radius:8px"></td></tr>`;
      case "divider":
        return `<tr><td style="padding:8px 32px"><hr style="border:none;border-top:1px solid #e2e8f0;margin:0"></td></tr>`;
      case "spacer":
        return `<tr><td style="height:${block.px}px;line-height:${block.px}px;font-size:${block.px}px">&nbsp;</td></tr>`;
    }
  }).join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Email</title></head>
<body style="margin:0;padding:0;background:#f0f4fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f0f4fa">
<tr><td align="center" style="padding:32px 16px">
<table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08)">
<tr><td style="height:8px;background:#2563eb"></td></tr>
<tr><td style="padding:24px 32px 8px"><span style="font-size:13px;font-weight:700;letter-spacing:0.08em;color:#94a3b8;text-transform:uppercase">AMZ OS</span></td></tr>
${rows}
<tr><td style="padding:24px 32px;text-align:center;font-size:12px;color:#94a3b8;border-top:1px solid #f1f5f9">
You received this because you're in our supplier pipeline. · <a href="{{unsubscribeUrl}}" style="color:#94a3b8;text-decoration:underline">Unsubscribe</a>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

export function injectTracking(html: string, token: string, baseUrl: string): string {
  const pixel = `<img src="${baseUrl}/api/track/open/${token}" width="1" height="1" alt="" style="display:none">`;
  const withPixel = html.replace("</body>", `${pixel}</body>`);
  return withPixel.replace(/href="(https?:\/\/[^"]*?)"/g, (match, url) => {
    if (url.includes("/api/track/") || url.includes("unsubscribe")) return match;
    return `href="${baseUrl}/api/track/click/${token}?url=${encodeURIComponent(url)}"`;
  });
}

export function newId(): string {
  return Math.random().toString(36).slice(2, 10);
}
