export type ElementAlign = "left" | "center" | "right";

export type EmailElement =
  | { id: string; type: "heading"; text: string; level: 1 | 2 | 3; align: ElementAlign; color: string }
  | { id: string; type: "text"; content: string; align: ElementAlign; fontSize: number; color: string }
  | { id: string; type: "button"; label: string; url: string; bgColor: string; textColor: string; align: ElementAlign; borderRadius: number }
  | { id: string; type: "image"; src: string; alt: string; align: ElementAlign; width: string; linkUrl?: string }
  | { id: string; type: "divider"; color: string; thickness: number }
  | { id: string; type: "spacer"; px: number }
  | { id: string; type: "social"; platforms: { name: string; url: string }[]; align: ElementAlign }
  | { id: string; type: "video"; thumbnailUrl: string; videoUrl: string; align: ElementAlign }
  | { id: string; type: "html"; code: string };

export interface EmailColumn {
  id: string;
  widthPercent: number;
  elements: EmailElement[];
  padding: { top: number; right: number; bottom: number; left: number };
  backgroundColor: string;
  verticalAlign: "top" | "middle" | "bottom";
}

export type RowLayout = "1" | "2" | "3" | "1:2" | "2:1" | "1:3" | "3:1" | "4";

export interface EmailRow {
  id: string;
  layout: RowLayout;
  columns: EmailColumn[];
  padding: { top: number; right: number; bottom: number; left: number };
}

export interface EmailSection {
  id: string;
  rows: EmailRow[];
  backgroundColor: string;
  padding: { top: number; right: number; bottom: number; left: number };
  borderColor: string;
  borderThickness: { top: number; right: number; bottom: number; left: number };
  borderRadius: number;
  fullWidth: boolean;
}

export interface EmailDoc {
  sections: EmailSection[];
  globalBackgroundColor: string;
  contentWidth: number;
}

// Legacy aliases — keep old imports from hard-crashing during migration
export type EmailBlock = EmailElement;

export const ROW_LAYOUTS: Record<RowLayout, number[]> = {
  "1": [100], "2": [50, 50], "3": [33.33, 33.33, 33.34],
  "1:2": [33.33, 66.67], "2:1": [66.67, 33.33],
  "1:3": [25, 75], "3:1": [75, 25], "4": [25, 25, 25, 25],
};

export const ROW_LAYOUT_LABELS: Record<RowLayout, string> = {
  "1": "1 Column", "2": "2 Columns", "3": "3 Columns",
  "1:2": "1/3 : 2/3", "2:1": "2/3 : 1/3",
  "1:3": "1/4 : 3/4", "3:1": "3/4 : 1/4", "4": "4 Columns",
};

let _idCounter = 0;
export function genId(prefix: string): string {
  _idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${_idCounter}`;
}
export function newId(): string { return genId("el"); }

export function createColumn(widthPercent: number): EmailColumn {
  return {
    id: genId("col"), widthPercent, elements: [],
    padding: { top: 12, right: 12, bottom: 12, left: 12 },
    backgroundColor: "", verticalAlign: "top",
  };
}

export function createRow(layout: RowLayout): EmailRow {
  return {
    id: genId("row"), layout,
    columns: ROW_LAYOUTS[layout].map(w => createColumn(w)),
    padding: { top: 0, right: 0, bottom: 0, left: 0 },
  };
}

export function createSection(): EmailSection {
  return {
    id: genId("sec"),
    rows: [createRow("1")],
    backgroundColor: "#FFFFFF",
    padding: { top: 0, right: 0, bottom: 0, left: 0 },
    borderColor: "#FFFFFF",
    borderThickness: { top: 0, right: 0, bottom: 0, left: 0 },
    borderRadius: 0,
    fullWidth: false,
  };
}

export function createElement(type: EmailElement["type"]): EmailElement {
  const id = genId("el");
  switch (type) {
    case "heading": return { id, type, text: "Heading text", level: 2, align: "left", color: "#0F172A" };
    case "text": return { id, type, content: "Add your text here. Use {{firstName}} to personalize.", align: "left", fontSize: 15, color: "#334155" };
    case "button": return { id, type, label: "Click here", url: "https://", bgColor: "#0E90C8", textColor: "#FFFFFF", align: "left", borderRadius: 8 };
    case "image": return { id, type, src: "", alt: "", align: "center", width: "100%" };
    case "divider": return { id, type, color: "#E2E8F0", thickness: 1 };
    case "spacer": return { id, type, px: 24 };
    case "social": return { id, type, platforms: [{ name: "instagram", url: "https://instagram.com" }], align: "center" };
    case "video": return { id, type, thumbnailUrl: "", videoUrl: "", align: "center" };
    case "html": return { id, type, code: "<!-- custom html -->" };
  }
}

export const DEFAULT_DOC: EmailDoc = {
  globalBackgroundColor: "#F0F4FA",
  contentWidth: 600,
  sections: [
    {
      id: genId("sec"),
      backgroundColor: "#FFFFFF",
      padding: { top: 24, right: 32, bottom: 8, left: 32 },
      borderColor: "#FFFFFF",
      borderThickness: { top: 0, right: 0, bottom: 0, left: 0 },
      borderRadius: 12,
      fullWidth: false,
      rows: [
        {
          id: genId("row"), layout: "1",
          padding: { top: 0, right: 0, bottom: 0, left: 0 },
          columns: [{
            id: genId("col"), widthPercent: 100,
            padding: { top: 0, right: 0, bottom: 0, left: 0 },
            backgroundColor: "", verticalAlign: "top",
            elements: [
              { id: genId("el"), type: "heading", text: "Hi {{firstName}},", level: 1, align: "left", color: "#0F172A" },
              { id: genId("el"), type: "text", content: "I'd love to discuss a wholesale partnership with {{companyName}}.", align: "left", fontSize: 15, color: "#334155" },
              { id: genId("el"), type: "button", label: "Reply to this email", url: "mailto:{{senderEmail}}", bgColor: "#0E90C8", textColor: "#FFFFFF", align: "left", borderRadius: 8 },
            ],
          }],
        },
      ],
    },
  ],
};

function sub(s: string, vars: Record<string, string>): string {
  return s.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`);
}

function renderElement(el: EmailElement, vars: Record<string, string>): string {
  switch (el.type) {
    case "heading": {
      const sizes: Record<number, string> = { 1: "28px", 2: "22px", 3: "18px" };
      return `<div style="text-align:${el.align};padding:6px 0;font-size:${sizes[el.level]};font-weight:700;color:${el.color};line-height:1.25">${sub(el.text, vars)}</div>`;
    }
    case "text":
      return `<div style="text-align:${el.align};padding:6px 0;font-size:${el.fontSize}px;line-height:1.7;color:${el.color};white-space:pre-line">${sub(el.content, vars)}</div>`;
    case "button":
      return `<div style="text-align:${el.align};padding:10px 0"><a href="${sub(el.url, vars)}" style="display:inline-block;padding:12px 28px;background:${el.bgColor};color:${el.textColor};font-weight:600;font-size:14px;border-radius:${el.borderRadius}px;text-decoration:none">${sub(el.label, vars)}</a></div>`;
    case "image":
      return `<div style="text-align:${el.align};padding:6px 0">${el.linkUrl ? `<a href="${sub(el.linkUrl, vars)}">` : ""}<img src="${sub(el.src, vars)}" alt="${sub(el.alt, vars)}" style="max-width:${el.width};height:auto;border-radius:8px">${el.linkUrl ? "</a>" : ""}</div>`;
    case "divider":
      return `<hr style="border:none;border-top:${el.thickness}px solid ${el.color};margin:8px 0">`;
    case "spacer":
      return `<div style="height:${el.px}px;line-height:${el.px}px;font-size:1px">&nbsp;</div>`;
    case "social":
      return `<div style="text-align:${el.align};padding:8px 0">${el.platforms.map(p => `<a href="${p.url}" style="margin:0 6px;color:#64748B;text-decoration:none;font-size:13px">${p.name}</a>`).join("")}</div>`;
    case "video":
      return `<div style="text-align:${el.align};padding:6px 0"><a href="${sub(el.videoUrl, vars)}"><img src="${sub(el.thumbnailUrl, vars)}" alt="Video" style="max-width:100%;border-radius:8px"></a></div>`;
    case "html":
      return el.code;
  }
}

function renderColumn(col: EmailColumn, vars: Record<string, string>): string {
  const inner = col.elements.map(el => renderElement(el, vars)).join("\n");
  return `<td valign="${col.verticalAlign}" width="${col.widthPercent}%" style="padding:${col.padding.top}px ${col.padding.right}px ${col.padding.bottom}px ${col.padding.left}px;background:${col.backgroundColor || "transparent"}">${inner}</td>`;
}

export function renderEmailHtml(doc: EmailDoc, vars: Record<string, string> = {}): string {
  // Gracefully handle legacy flat { blocks: [] } shape stored in old DB rows
  const legacyDoc = doc as unknown as { blocks?: unknown[] };
  if (!doc.sections && legacyDoc.blocks) {
    return `<p style="font-family:sans-serif;padding:16px;color:#64748b">(Legacy template — please re-open and save in the new builder to update.)</p>`;
  }

  const sectionsHtml = (doc.sections ?? []).map(section => {
    const rowsHtml = section.rows.map(row => {
      const colsHtml = row.columns.map(col => renderColumn(col, vars)).join("\n");
      return `<tr><td style="padding:${row.padding.top}px ${row.padding.right}px ${row.padding.bottom}px ${row.padding.left}px"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>${colsHtml}</tr></table></td></tr>`;
    }).join("\n");
    const borderStyle = `border-style:solid;border-color:${section.borderColor};border-width:${section.borderThickness.top}px ${section.borderThickness.right}px ${section.borderThickness.bottom}px ${section.borderThickness.left}px;`;
    return `<tr><td align="center" style="background:${section.fullWidth ? section.backgroundColor : "transparent"}">
<table width="${doc.contentWidth}" cellpadding="0" cellspacing="0" border="0" style="max-width:${doc.contentWidth}px;width:100%;background:${section.backgroundColor};border-radius:${section.borderRadius}px;${borderStyle}padding:${section.padding.top}px ${section.padding.right}px ${section.padding.bottom}px ${section.padding.left}px">
${rowsHtml}
</table></td></tr>`;
  }).join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Email</title></head>
<body style="margin:0;padding:0;background:${doc.globalBackgroundColor ?? "#f0f4fa"};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${doc.globalBackgroundColor ?? "#f0f4fa"}">
${sectionsHtml}
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
