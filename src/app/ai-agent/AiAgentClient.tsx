"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Send, Search, MoreHorizontal, Pin, Pencil, Trash2, X,
  Plus, PanelLeftClose, PanelLeftOpen, Copy, Check,
  Paperclip, Settings, HardDrive, ImageIcon, Clock, Mic, RotateCcw, FileText,
  Archive, Download, FileSpreadsheet, BookOpen, Globe,
} from "lucide-react";

const AGENT_IMG = "https://assets.cdn.filesafe.space/2rx7sGBL7YKaiP0HwK56/media/6a399f8f7b00529580ab8d3d.png";

const TOKEN_LIMIT = 100_000; // per 5-hour window
const WINDOW_HOURS = 5;

const GREETINGS = [
  "Hello! Grab a coffee and let's start the conversation ☕",
  "Hey there! What's on your mind today?",
  "Good to see you! How can I help?",
  "Hi! I'm here whenever you're ready.",
  "Welcome back! What are we tackling today?",
  "Hey! Ask me anything — I'm all ears.",
  "What's up? Let's figure this out together.",
  "Hello! I'm ready whenever you are.",
  "Hey! Happy to help with whatever you need.",
  "Good to have you here. What can I do for you?",
];

const ALL_STARTERS = [
  { emoji: "🏷️", text: "Walk me through the Brand Partnership Blueprint" },
  { emoji: "📦", text: "How do I qualify a wholesale brand for Amazon?" },
  { emoji: "✉️", text: "Write me an outreach email to a new supplier" },
  { emoji: "📊", text: "What are the key steps in the Wholesale Masterclass?" },
  { emoji: "🔍", text: "How do I find winning wholesale brands?" },
  { emoji: "💰", text: "What ROI should I target for wholesale products?" },
  { emoji: "🤝", text: "How do I negotiate better terms with a supplier?" },
  { emoji: "📈", text: "What metrics matter most for my wholesale business?" },
  { emoji: "⚡", text: "What mistakes do new wholesale Amazon sellers make?" },
  { emoji: "🛒", text: "How do I set up my Amazon Seller account for wholesale?" },
  { emoji: "🎯", text: "How do I identify a brand's profitability potential?" },
  { emoji: "📬", text: "What follow-up strategy should I use after cold outreach?" },
];

function shufflePick<T>(arr: T[], n: number): T[] {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, n);
}

/* ─── localStorage helpers ─── */
function getPinnedIds(): string[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem("ai-pinned-ids") ?? "[]") as string[]; } catch { return []; }
}
function savePinnedIds(ids: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem("ai-pinned-ids", JSON.stringify(ids));
}
function applyPinned(convs: Conversation[]): Conversation[] {
  const ids = getPinnedIds();
  return convs.map(c => ({ ...c, pinned: ids.includes(c.id) }));
}

type ArchivedConv = { id: string; title: string; deletedAt: string };
function getArchived(): ArchivedConv[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem("ai-archived") ?? "[]") as ArchivedConv[]; } catch { return []; }
}
function saveArchived(items: ArchivedConv[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem("ai-archived", JSON.stringify(items));
}

type StoredFileRecord = { name: string; type: string; size: number; uploadedAt: string; convId?: string };
function getStoredFiles(): StoredFileRecord[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem("ai-stored-files") ?? "[]") as StoredFileRecord[]; } catch { return []; }
}
function addStoredFile(f: StoredFileRecord) {
  if (typeof window === "undefined") return;
  const existing = getStoredFiles();
  localStorage.setItem("ai-stored-files", JSON.stringify([f, ...existing].slice(0, 100)));
}

/* ─── Usage helpers (server-side, 5-hour rolling window, token-based) ─── */
type UsageState = { used: number; limit: number; resetAt: string | null };

async function fetchUsage(): Promise<UsageState> {
  try {
    const res = await fetch("/api/ai-usage");
    if (res.ok) return await res.json() as UsageState;
  } catch { /* ignore */ }
  return { used: 0, limit: TOKEN_LIMIT, resetAt: null };
}

async function logTokens(tokens: number): Promise<UsageState | null> {
  try {
    const res = await fetch("/api/ai-usage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tokens }),
    });
    if (res.ok || res.status === 429) return await res.json() as UsageState;
  } catch { /* ignore */ }
  return null;
}

function formatResetAt(resetAt: string | null): string {
  if (!resetAt) return "";
  return new Date(resetAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/* ─── Research routing ─── */
const URL_REGEX = /https?:\/\/[^\s<>"']+/gi;
const AMAZON_KEYWORDS = /\b(amazon|fba|wholesale|asin|bsr|buy.?box|seller.?central|sourcing|supplier|inventory|restocking|keepa|jungle.?scout|helium|product.?listing|storefront|brand.?gating|1p|3p|private.?label|arbitrage|resell|reprice|shipment|freight|prep.?center|reorder|roi.?calculator|margin.?calculator)\b/i;

function shouldUseResearch(text: string): { use: boolean; urls: string[] } {
  const urls = text.match(URL_REGEX) ?? [];
  if (urls.length > 0) return { use: true, urls };
  // If the query clearly isn't about Amazon/ecommerce, route to deep research
  const isAmazon = AMAZON_KEYWORDS.test(text);
  // Research mode for non-Amazon topics that suggest external research
  const researchSignals = /\b(research|analyze|analysis|competitor|brand|company|startup|market|industry|trend|review|website|site|product|compare|versus|vs\.?|strategy|marketing|campaign|social media|instagram|tiktok|twitter|youtube|influencer|reddit|news|article|report|study|data|stats|statistics|price|pricing|revenue|funding|vc|investor)\b/i.test(text);
  if (!isAmazon && researchSignals) return { use: true, urls: [] };
  return { use: false, urls: [] };
}

/* ─── CSS ─── */
const STYLE = `
/* ── Corona / eclipse glow (brand blue) ── */
.avatar-wrap {
  position: relative;
  display: inline-block;
  border-radius: 50%;
  line-height: 0;
}
.avatar-think {
  border-radius: 50%;
  animation: corona-pulse 2s ease-in-out infinite;
}
@keyframes corona-pulse {
  0%, 100% {
    box-shadow:
      0 0 0 2px rgba(59,130,246,0.85),
      0 0 10px 4px rgba(37,99,235,0.65),
      0 0 22px 8px rgba(96,165,250,0.35),
      0 0 38px 14px rgba(147,197,253,0.15);
  }
  50% {
    box-shadow:
      0 0 0 3px rgba(96,165,250,1.0),
      0 0 16px 7px rgba(59,130,246,0.8),
      0 0 32px 14px rgba(96,165,250,0.5),
      0 0 55px 22px rgba(147,197,253,0.25);
  }
}
.neon-btn {
  position: relative; background: transparent; border: none; outline: none; cursor: pointer;
}
.neon-btn::before {
  content: ""; position: absolute; inset: 0; border-radius: inherit; padding: 1.5px;
  background: linear-gradient(90deg, #1d4ed8, #2563eb, #60a5fa);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor; mask-composite: exclude;
  box-shadow: 0 0 8px rgba(37,99,235,0.45), 0 0 16px rgba(37,99,235,0.2);
}
@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin 0.8s linear infinite; }
`;

type AiMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
  fileUrls?: string[];
  fileBlobUrls?: string[];
};

type Conversation = { id: string; title: string; pinned: boolean; updatedAt: string; preview: string; };
type PendingFile = { file: File; status: "uploading" | "ready" | "error"; analysis?: string; blobUrl?: string; };

/* ─── Logo with corona glow ─── */
function AgentLogo({ size = 40, thinking = false }: { size?: number; thinking?: boolean }) {
  return (
    <div className={`avatar-wrap ${thinking ? "avatar-think" : ""}`} style={{ width: size, height: size, borderRadius: "50%" }}>
      <Image src={AGENT_IMG} alt="AMZ Navigator" width={size} height={size}
        style={{ width: size, height: size, objectFit: "contain", borderRadius: "50%" }} unoptimized />
    </div>
  );
}

/* ─── Section label ─── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-3 mt-3 mb-1">
      <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", background: "linear-gradient(90deg,#1d4ed8,#60a5fa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
        {children}
      </span>
    </div>
  );
}

function NeonNewBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="neon-btn mx-3 mt-1.5 mb-1 w-[calc(100%-24px)] rounded-xl py-2.5 flex items-center justify-center gap-2 hover:bg-blue-500/5 active:scale-[0.98] transition-all"
      style={{ background: "rgba(29,78,216,0.04)" }}>
      <Plus size={13} style={{ color: "#3b82f6" }} />
      <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.04em", background: "linear-gradient(90deg,#1d4ed8,#60a5fa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
        New Conversation
      </span>
    </button>
  );
}

/* ─── Markdown ─── */
function resolveDifyUrl(href: string): string {
  if (href.startsWith("sandbox:/")) {
    const path = href.replace("sandbox:/", "").replace(/^\/+/, "");
    return `/api/ai-dify-file?path=${encodeURIComponent(path)}`;
  }
  return href;
}

function MdLine({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g);
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith("**") && p.endsWith("**")) return <strong key={i}>{p.slice(2, -2)}</strong>;
        const m = p.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (m) {
          const href = resolveDifyUrl(m[2]);
          return <a key={i} href={href} target="_blank" rel="noopener noreferrer" download={href.startsWith("/api/ai-dify-file") ? "" : undefined}
            className="underline underline-offset-2 text-blue-500 opacity-90 hover:opacity-100">{m[1]}</a>;
        }
        return <span key={i}>{p}</span>;
      })}
    </>
  );
}

function MarkdownContent({ content }: { content: string }) {
  const lines = content.split("\n");
  const out: React.ReactNode[] = [];
  lines.forEach((line, i) => {
    if (!line.trim()) { out.push(<div key={i} className="h-2" />); return; }
    if (line.startsWith("### ")) { out.push(<h3 key={i} className="mt-3 mb-1 text-sm font-bold"><MdLine text={line.slice(4)} /></h3>); return; }
    if (line.startsWith("## ")) { out.push(<h2 key={i} className="mt-3 mb-1 text-base font-bold"><MdLine text={line.slice(3)} /></h2>); return; }
    if (line.startsWith("# ")) { out.push(<h1 key={i} className="mt-3 mb-1 text-lg font-bold"><MdLine text={line.slice(2)} /></h1>); return; }
    if (line.match(/^[-*] /)) {
      out.push(<div key={i} className="flex gap-2 items-start"><span className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-blue-400" /><span><MdLine text={line.slice(2)} /></span></div>);
      return;
    }
    if (line.match(/^\d+\. /)) {
      const num = line.match(/^(\d+)\. /)?.[1];
      out.push(<div key={i} className="flex gap-2 items-start"><span className="shrink-0 text-[11px] font-bold text-blue-400 mt-0.5 w-4">{num}.</span><span><MdLine text={line.replace(/^\d+\. /, "")} /></span></div>);
      return;
    }
    out.push(<p key={i}><MdLine text={line} /></p>);
  });
  return <div className="flex flex-col gap-1 text-sm leading-relaxed">{out}</div>;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="opacity-0 group-hover:opacity-100 transition mt-1 shrink-0 p-1.5 rounded-lg hover:bg-[var(--accent-soft)] text-[var(--muted)] hover:text-[var(--foreground)]">
      {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
    </button>
  );
}

/* ─── Export helpers ─── */
async function exportContent(content: string, format: "pdf" | "docx" | "xlsx", title: string) {
  if (format === "pdf") {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxW = pageW - margin * 2;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(title, margin, 20);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated by AMZ Navigator • ${new Date().toLocaleDateString()}`, margin, 28);

    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(0.5);
    doc.line(margin, 31, pageW - margin, 31);

    doc.setTextColor(30, 30, 30);
    doc.setFontSize(11);

    let y = 40;
    const lines = content.split("\n");
    for (const line of lines) {
      if (y > 270) { doc.addPage(); y = 20; }
      if (!line.trim()) { y += 4; continue; }
      const clean = line.replace(/^\*+\s*/, "").replace(/\*\*/g, "");
      if (line.startsWith("## ") || line.startsWith("# ")) {
        doc.setFont("helvetica", "bold"); doc.setFontSize(13);
        const wrapped = doc.splitTextToSize(clean.replace(/^#+\s*/, ""), maxW);
        doc.text(wrapped, margin, y); y += wrapped.length * 7 + 3;
        doc.setFont("helvetica", "normal"); doc.setFontSize(11);
      } else if (line.startsWith("### ")) {
        doc.setFont("helvetica", "bold"); doc.setFontSize(11);
        const wrapped = doc.splitTextToSize(clean.replace(/^#+\s*/, ""), maxW);
        doc.text(wrapped, margin, y); y += wrapped.length * 6 + 2;
        doc.setFont("helvetica", "normal");
      } else {
        const wrapped = doc.splitTextToSize(clean, maxW);
        doc.text(wrapped, margin, y); y += wrapped.length * 5.5 + 1;
      }
    }
    doc.save(`${title.replace(/\s+/g, "_")}.pdf`);
    return;
  }

  if (format === "docx") {
    const { Document, Paragraph, TextRun, HeadingLevel, Packer } = await import("docx");
    const children: InstanceType<typeof Paragraph>[] = [];
    children.push(new Paragraph({ text: title, heading: HeadingLevel.HEADING_1 }));
    children.push(new Paragraph({ children: [new TextRun({ text: `Generated by AMZ Navigator • ${new Date().toLocaleDateString()}`, color: "666666", size: 18 })] }));
    children.push(new Paragraph({ text: "" }));

    for (const line of content.split("\n")) {
      const clean = line.replace(/\*\*/g, "");
      if (!line.trim()) { children.push(new Paragraph({ text: "" })); continue; }
      if (line.startsWith("## ") || line.startsWith("# ")) {
        children.push(new Paragraph({ text: clean.replace(/^#+\s*/, ""), heading: HeadingLevel.HEADING_2 }));
      } else if (line.startsWith("### ")) {
        children.push(new Paragraph({ text: clean.replace(/^#+\s*/, ""), heading: HeadingLevel.HEADING_3 }));
      } else {
        children.push(new Paragraph({ children: [new TextRun({ text: clean })] }));
      }
    }
    const doc = new Document({ sections: [{ properties: {}, children }] });
    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${title.replace(/\s+/g, "_")}.docx`; a.click();
    URL.revokeObjectURL(url);
    return;
  }

  if (format === "xlsx") {
    const XLSX = await import("xlsx");
    const rows: string[][] = [[title], [`Generated by AMZ Navigator • ${new Date().toLocaleDateString()}`], []];
    for (const line of content.split("\n")) {
      rows.push([line.replace(/\*\*/g, "").replace(/^#+\s*/, "")]);
    }
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "AMZ Navigator");
    XLSX.writeFile(wb, `${title.replace(/\s+/g, "_")}.xlsx`);
    return;
  }
}

/* ─── Export modal ─── */
function ExportModal({ content, onClose }: { content: string; onClose: () => void }) {
  const [loading, setLoading] = useState<string | null>(null);
  const title = `AMZ Navigator Export ${new Date().toLocaleDateString()}`;

  const doExport = async (fmt: "pdf" | "docx" | "xlsx") => {
    setLoading(fmt);
    try { await exportContent(content, fmt, title); } catch (e) { alert(`Export failed: ${e instanceof Error ? e.message : e}`); }
    setLoading(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="w-80 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-[var(--foreground)]">Export conversation</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-[var(--accent-soft)] text-[var(--muted)]"><X size={13} /></button>
        </div>
        <p className="text-xs text-[var(--muted)] mb-4">Choose a format to download this conversation.</p>
        <div className="flex flex-col gap-2">
          {([["pdf","PDF Document","rounded-xl bg-red-500/10 border-red-400/20 text-red-600"],
             ["docx","Word Document (.docx)","rounded-xl bg-blue-500/10 border-blue-400/20 text-blue-600"],
             ["xlsx","Spreadsheet (.xlsx)","rounded-xl bg-green-500/10 border-green-400/20 text-green-600"]] as const).map(([fmt, label, cls]) => (
            <button key={fmt} onClick={() => doExport(fmt)} disabled={!!loading}
              className={`flex items-center gap-3 px-3 py-2.5 border text-xs font-semibold transition hover:opacity-80 disabled:opacity-50 ${cls}`}>
              {loading === fmt
                ? <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent spin" />
                : fmt === "pdf" ? <BookOpen size={14} /> : fmt === "docx" ? <FileText size={14} /> : <FileSpreadsheet size={14} />}
              {label}
              {loading === fmt && <span className="ml-auto text-[10px] opacity-60">Generating…</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Message bubble ─── */
function MessageBubble({ msg, isThinking, onExport }: { msg: AiMessage; isThinking?: boolean; onExport?: (content: string) => void }) {
  const isUser = msg.role === "user";
  return (
    <div className={`group flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"} items-start`}>
      {isUser
        ? <div className="shrink-0 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-400 text-white text-xs font-bold border border-blue-500/40">U</div>
        : <AgentLogo size={46} thinking={isThinking} />
      }
      <div className={`max-w-[78%] flex flex-col gap-1.5 ${isUser ? "items-end" : "items-start"}`}>
        {!isUser && <span className="text-[11px] font-semibold text-blue-400 px-1">AMZ Navigator</span>}
        {isUser && msg.fileUrls && msg.fileUrls.length > 0 && (
          <div className="flex flex-wrap gap-1.5 justify-end mb-0.5">
            {msg.fileUrls.map((name, i) => {
              const blobUrl = msg.fileBlobUrls?.[i];
              const chip = (
                <span className="flex items-center gap-1.5 rounded-xl bg-blue-500/15 border border-blue-400/30 px-2.5 py-1 text-[11px] text-blue-600 font-medium transition hover:bg-blue-500/25 cursor-pointer">
                  <FileText size={11} /> {name}
                </span>
              );
              return blobUrl
                ? <a key={i} href={blobUrl} target="_blank" rel="noopener noreferrer" download={name}>{chip}</a>
                : <span key={i}>{chip}</span>;
            })}
          </div>
        )}
        <div className={`rounded-2xl px-4 py-3 ${isUser
          ? "rounded-tr-sm bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/20"
          : "rounded-tl-sm border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] shadow-sm"}`}>
          {isUser
            ? <span className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</span>
            : <MarkdownContent content={msg.content || "…"} />}
        </div>
        {!isUser && msg.content && (
          <div className="flex gap-1">
            <CopyButton text={msg.content} />
            {onExport && (
              <button onClick={() => onExport(msg.content)}
                className="opacity-0 group-hover:opacity-100 transition mt-1 shrink-0 p-1.5 rounded-lg hover:bg-[var(--accent-soft)] text-[var(--muted)] hover:text-[var(--foreground)]"
                title="Export as file">
                <Download size={12} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Conversation item ─── */
function ConvItem({ conv, active, onSelect, onRename, onPin, onDelete }: {
  conv: Conversation; active: boolean;
  onSelect: () => void; onRename: (t: string) => void; onPin: () => void; onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState(conv.title);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function h(e: MouseEvent) { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false); }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div onClick={onSelect} className={`group relative flex items-center gap-2 rounded-xl px-3 py-2 cursor-pointer transition-colors ${active ? "bg-blue-500/10" : "hover:bg-[var(--accent-soft)]"}`}>
      <div className="flex-1 min-w-0">
        {renaming
          ? <input autoFocus value={draft} onChange={e => setDraft(e.target.value)}
              onBlur={() => { setRenaming(false); onRename(draft); }}
              onKeyDown={e => { if (e.key === "Enter") { setRenaming(false); onRename(draft); } if (e.key === "Escape") { setRenaming(false); setDraft(conv.title); } }}
              onClick={e => e.stopPropagation()}
              className="w-full bg-transparent text-sm outline-none border-b border-blue-500/50 text-[var(--foreground)]" />
          : <p className="text-[13px] font-semibold truncate leading-tight text-[var(--foreground)]">{conv.title}</p>
        }
      </div>
      {conv.pinned && <Pin size={9} className="shrink-0 text-blue-400 opacity-70" />}
      <div ref={menuRef} className="relative shrink-0" onClick={e => e.stopPropagation()}>
        <button onClick={() => setMenuOpen(o => !o)} className="opacity-0 group-hover:opacity-100 transition p-0.5 rounded hover:bg-[var(--border)]">
          <MoreHorizontal size={12} />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-6 z-50 w-36 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xl py-1 text-xs">
            <button onClick={() => { setRenaming(true); setMenuOpen(false); }} className="flex w-full items-center gap-2 px-3 py-2 hover:bg-[var(--accent-soft)]"><Pencil size={11} /> Rename</button>
            <button onClick={() => { onPin(); setMenuOpen(false); }} className="flex w-full items-center gap-2 px-3 py-2 hover:bg-[var(--accent-soft)]"><Pin size={11} /> {conv.pinned ? "Unpin" : "Pin"}</button>
            <div className="my-1 border-t border-[var(--border)]" />
            <button onClick={() => { onDelete(); setMenuOpen(false); }} className="flex w-full items-center gap-2 px-3 py-2 text-red-500 hover:bg-red-500/10"><Trash2 size={11} /> Delete</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Delete modal ─── */
function DeleteModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-80 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-2xl">
        <h3 className="text-sm font-semibold text-[var(--foreground)]">Delete conversation?</h3>
        <p className="mt-1.5 text-xs text-[var(--muted)]">This will move it to Archive. You can restore it from Settings → Archive.</p>
        <div className="mt-4 flex gap-2">
          <button onClick={onConfirm} className="flex-1 rounded-lg bg-red-500 py-2 text-xs font-semibold text-white hover:bg-red-600">Delete</button>
          <button onClick={onCancel} className="flex-1 rounded-lg border border-[var(--border)] py-2 text-xs text-[var(--muted)] hover:bg-[var(--accent-soft)]">Cancel</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Settings modal ─── */
function SettingsModal({ conversations, messages, archived, storedFiles, onRestore, onClose }: {
  conversations: Conversation[]; messages: AiMessage[];
  archived: ArchivedConv[]; storedFiles: StoredFileRecord[];
  onRestore: (id: string) => void; onClose: () => void;
}) {
  const [tab, setTab] = useState<"archive" | "storage">("archive");
  const [storageTab, setStorageTab] = useState<"files" | "images">("files");
  const imgFiles = storedFiles.filter(f => f.type.startsWith("image/"));
  const docFiles = storedFiles.filter(f => !f.type.startsWith("image/"));

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <h2 className="text-sm font-bold text-[var(--foreground)]">Settings</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--accent-soft)] text-[var(--muted)]"><X size={14} /></button>
        </div>
        <div className="flex border-b border-[var(--border)]">
          {(["archive", "storage"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`flex-1 py-2.5 text-xs font-medium flex items-center justify-center gap-1.5 transition capitalize ${tab === t ? "text-blue-500 border-b-2 border-blue-500" : "text-[var(--muted)] hover:text-[var(--foreground)]"}`}>
              {t === "archive" ? <Archive size={12} /> : <HardDrive size={12} />} {t}
            </button>
          ))}
        </div>
        <div className="p-4">
          {tab === "archive" && (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-[var(--muted)]">Deleted conversations are archived here. Feel free to restore any time.</p>
              {archived.length === 0
                ? <div className="rounded-xl border border-[var(--border)] p-4 text-center"><p className="text-xs text-[var(--muted)]">No archived conversations</p></div>
                : <div className="flex flex-col gap-1 max-h-60 overflow-y-auto">
                    {archived.map(a => (
                      <div key={a.id} className="flex items-center gap-2 rounded-xl border border-[var(--border)] px-3 py-2.5">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold truncate text-[var(--foreground)]">{a.title}</p>
                          <p className="text-[10px] text-[var(--muted)]">Deleted {new Date(a.deletedAt).toLocaleDateString()}</p>
                        </div>
                        <button onClick={() => onRestore(a.id)}
                          className="shrink-0 flex items-center gap-1 rounded-lg bg-blue-500/10 border border-blue-500/20 px-2.5 py-1.5 text-[11px] font-semibold text-blue-500 hover:bg-blue-500/20 transition">
                          <RotateCcw size={11} /> Restore
                        </button>
                      </div>
                    ))}
                  </div>
              }
            </div>
          )}
          {tab === "storage" && (
            <div className="flex flex-col gap-3">
              <div className="rounded-xl border border-[var(--border)] p-3 flex flex-col gap-2">
                <div className="flex justify-between text-xs"><span className="text-[var(--muted)]">Total conversations</span><span className="font-semibold">{conversations.length}</span></div>
                <div className="flex justify-between text-xs"><span className="text-[var(--muted)]">Messages in current chat</span><span className="font-semibold">{messages.length}</span></div>
                <div className="h-1.5 w-full rounded-full bg-[var(--border)] mt-1">
                  <div className="h-1.5 rounded-full bg-gradient-to-r from-blue-600 to-blue-400" style={{ width: `${Math.min(100, (conversations.length / 50) * 100)}%` }} />
                </div>
                <p className="text-[10px] text-[var(--muted)]">{conversations.length} / 50 conversations</p>
              </div>
              <div className="flex gap-1 rounded-xl border border-[var(--border)] p-1">
                {(["files", "images"] as const).map(t => (
                  <button key={t} onClick={() => setStorageTab(t)} className={`flex-1 rounded-lg py-1.5 text-xs font-medium flex items-center justify-center gap-1.5 transition ${storageTab === t ? "bg-blue-500/10 text-blue-500" : "text-[var(--muted)] hover:text-[var(--foreground)]"}`}>
                    {t === "files" ? <Paperclip size={11} /> : <ImageIcon size={11} />} {t === "files" ? `Files (${docFiles.length})` : `Images (${imgFiles.length})`}
                  </button>
                ))}
              </div>
              {(storageTab === "files" ? docFiles : imgFiles).length === 0
                ? <div className="rounded-xl border border-[var(--border)] p-4 text-center"><p className="text-xs text-[var(--muted)]">{storageTab === "files" ? "No files uploaded yet" : "No images uploaded yet"}</p></div>
                : <div className="flex flex-col gap-1 max-h-52 overflow-y-auto">
                    {(storageTab === "files" ? docFiles : imgFiles).map((f, i) => (
                      <div key={i} className="flex items-center gap-2 rounded-xl border border-[var(--border)] px-3 py-2">
                        <FileText size={12} className="shrink-0 text-[var(--muted)]" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate text-[var(--foreground)]">{f.name}</p>
                          <p className="text-[10px] text-[var(--muted)]">{(f.size / 1024).toFixed(1)} KB • {new Date(f.uploadedAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
              }
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Mini tooltip button ─── */
function MiniBtn({ onClick, tooltip, children, blue }: { onClick: () => void; tooltip: string; children: React.ReactNode; blue?: boolean }) {
  return (
    <div className="relative group">
      <button onClick={onClick} className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${blue ? "text-blue-500 hover:bg-blue-500/10" : "text-[var(--muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--foreground)]"}`}>
        {children}
      </button>
      <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2.5 z-50 hidden group-hover:block">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 shadow-xl whitespace-nowrap">
          <p className="text-xs font-medium text-[var(--foreground)]">{tooltip}</p>
        </div>
      </div>
    </div>
  );
}

function MiniRecentPanel({ conversations, activeConvId, onSelect }: { conversations: Conversation[]; activeConvId: string | null; onSelect: (id: string) => void }) {
  return (
    <div className="absolute left-full top-0 ml-2.5 z-50 w-60 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl overflow-hidden">
      <div className="px-3 py-2 border-b border-[var(--border)]"><p className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest">Recent Chats</p></div>
      <div className="max-h-72 overflow-y-auto py-1">
        {conversations.length === 0
          ? <p className="px-3 py-3 text-xs text-[var(--muted)] text-center">No conversations yet</p>
          : conversations.map(c => (
            <button key={c.id} onClick={() => onSelect(c.id)}
              className={`w-full text-left px-3 py-2 text-[13px] font-semibold truncate transition hover:bg-[var(--accent-soft)] ${activeConvId === c.id ? "text-blue-400" : "text-[var(--foreground)]"}`}>
              {c.title}
            </button>
          ))
        }
      </div>
    </div>
  );
}

/* ─── Usage ring ─── */
function UsageRing({ used, limit, resetAt }: { used: number; limit: number; resetAt: string | null }) {
  const [open, setOpen] = useState(false);
  const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
  const color = pct >= 90 ? "#ef4444" : pct >= 70 ? "#f59e0b" : "#3b82f6";
  const tz = typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "";
  const resetTime = formatResetAt(resetAt);
  const r = 9;
  const circ = 2 * Math.PI * r;
  const dash = circ * (1 - pct / 100);

  return (
    <div className="relative flex items-center gap-1.5">
      <span className="text-[10px] text-[var(--muted)] font-medium">Usage</span>
      <button
        onClick={() => setOpen(o => !o)}
        title="Token usage"
        className="flex items-center justify-center transition-all hover:opacity-80 shrink-0"
        style={{ width: 22, height: 22 }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="12" cy="12" r={r} fill="none" stroke="var(--border)" strokeWidth="2.5" />
          {pct > 0 && (
            <circle cx="12" cy="12" r={r} fill="none" stroke={color} strokeWidth="2.5"
              strokeDasharray={circ} strokeDashoffset={dash} strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 0.5s ease" }} />
          )}
        </svg>
      </button>
      {open && (
        <div
          className="absolute bottom-8 right-0 z-50 w-52 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl p-3"
          onMouseLeave={() => setOpen(false)}
        >
          <p className="text-[11px] font-bold text-[var(--foreground)] mb-0.5">{used.toLocaleString()} / {limit.toLocaleString()} tokens</p>
          <p className="text-[10px] text-[var(--muted)] mb-2">Rolling {WINDOW_HOURS}-hour window</p>
          <div className="h-1.5 w-full rounded-full bg-[var(--border)] overflow-hidden mb-2">
            <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
          </div>
          {resetTime && (
            <p className="text-[10px] text-[var(--muted)]">Resets at {resetTime}{tz ? ` · ${tz.split("/").pop()?.replace(/_/g, " ")}` : ""}</p>
          )}
          <p className="text-[10px] text-[var(--muted)] mt-0.5">{Math.round(pct)}% used</p>
        </div>
      )}
    </div>
  );
}

/* ─── Main ─── */
export default function AiAgentClient({ initialConversations }: { initialConversations: Conversation[] }) {
  const [conversations, setConversations] = useState<Conversation[]>(() => applyPinned(initialConversations));
  const [archived, setArchived] = useState<ArchivedConv[]>(() => getArchived());
  const [storedFiles, setStoredFiles] = useState<StoredFileRecord[]>(() => getStoredFiles());
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [difyConvId, setDifyConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [msgCache, setMsgCache] = useState<Record<string, AiMessage[]>>({});
  const [input, setInput] = useState("");
  const [isResponding, setIsResponding] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteModal, setDeleteModal] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [exportContent2, setExportContent] = useState<string | null>(null);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [greeting] = useState(() => GREETINGS[Math.floor(Math.random() * GREETINGS.length)]);
  const [starters, setStarters] = useState(() => shufflePick(ALL_STARTERS, 4));
  const [recentHover, setRecentHover] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isResearching, setIsResearching] = useState(false);
  const [usage, setUsage] = useState<UsageState>({ used: 0, limit: TOKEN_LIMIT, resetAt: null });
  const recentHoverRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recognitionRef = useRef<{ stop(): void } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchUsage().then(u => setUsage(u));
    fetch("/api/ai-conversations")
      .then(r => r.ok ? r.json() : [])
      .then((convs: Conversation[]) => setConversations(applyPinned(convs)))
      .catch(() => {});
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 140) + "px";
  };

  const loadConversation = async (convId: string) => {
    setActiveConvId(convId); setDifyConvId(convId);
    if (msgCache[convId]) { setMessages(msgCache[convId]); return; }
    const res = await fetch(`/api/ai-conversations/${convId}`);
    if (res.ok) {
      const data = await res.json();
      const msgs = (data.messages ?? []) as AiMessage[];
      setMessages(msgs);
      setMsgCache(prev => ({ ...prev, [convId]: msgs }));
    }
  };

  const startNew = useCallback(() => {
    setActiveConvId(null); setDifyConvId(null); setMessages([]);
    setInput(""); setPendingFiles([]); setError(null);
    setStarters(shufflePick(ALL_STARTERS, 4));
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }, []);

  const refreshConversations = async () => {
    const res = await fetch("/api/ai-conversations");
    if (res.ok) setConversations(applyPinned(await res.json()));
  };

  const handleFileChange = async (newFiles: File[]) => {
    const newPending: PendingFile[] = newFiles.map(f => ({ file: f, status: "uploading", blobUrl: URL.createObjectURL(f) }));
    setPendingFiles(prev => [...prev, ...newPending]);

    for (const f of newFiles) {
      const rec: StoredFileRecord = { name: f.name, type: f.type, size: f.size, uploadedAt: new Date().toISOString(), convId: activeConvId ?? undefined };
      addStoredFile(rec);
      setStoredFiles(getStoredFiles());

      const form = new FormData();
      form.append("file", f);
      try {
        const res = await fetch("/api/ai-file-analyze", { method: "POST", body: form });
        const data = res.ok ? await res.json() as { analysis?: string } : null;
        setPendingFiles(prev => prev.map(p =>
          p.file === f ? { ...p, status: data?.analysis ? "ready" : "error", analysis: data?.analysis ?? `Could not analyze ${f.name}` } : p
        ));
      } catch {
        setPendingFiles(prev => prev.map(p => p.file === f ? { ...p, status: "error" } : p));
      }
    }
  };

  const toggleMic = () => {
    if (typeof window === "undefined") return;
    type SR = { new(): { continuous: boolean; interimResults: boolean; lang: string; onresult: ((e: { results: { [i: number]: { [i: number]: { transcript: string } } } }) => void) | null; onend: (() => void) | null; onerror: (() => void) | null; start(): void; stop(): void; }; };
    const w = window as unknown as Record<string, unknown>;
    const SRClass = w["SpeechRecognition"] as SR | undefined || w["webkitSpeechRecognition"] as SR | undefined;
    if (!SRClass) { alert("Speech recognition not supported in this browser."); return; }
    if (isListening && recognitionRef.current) { recognitionRef.current.stop(); setIsListening(false); return; }
    const rec = new SRClass();
    recognitionRef.current = rec as unknown as { stop(): void };
    rec.continuous = false; rec.interimResults = true; rec.lang = "en-US";
    rec.onresult = (e) => { const t = Object.values(e.results).map(r => r[0].transcript).join(""); setInput(t); autoResize(); };
    rec.onend = () => setIsListening(false);
    rec.onerror = () => setIsListening(false);
    rec.start(); setIsListening(true);
  };

  const removeFile = (i: number) => {
    const f = pendingFiles[i];
    if (f?.blobUrl) URL.revokeObjectURL(f.blobUrl);
    setPendingFiles(prev => prev.filter((_, j) => j !== i));
  };

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || isResponding || usage.used >= usage.limit) return;
    if (pendingFiles.some(f => f.status === "uploading")) return;

    let queryWithContext = text;
    const readyFiles = pendingFiles.filter(f => f.analysis);
    if (readyFiles.length > 0) {
      const ctx = readyFiles.map(f => `[Attached file: ${f.file.name}]\n${f.analysis}`).join("\n\n");
      queryWithContext = `${ctx}\n\nUser: ${text}`;
    }

    const exportIntent = /\b(convert|export|download|save|generate).*(pdf|doc|word|excel|spreadsheet|xlsx|file|report)\b/i.test(text)
      || /\b(pdf|doc|word|excel|spreadsheet|xlsx)\b/i.test(text);

    const fileNames = pendingFiles.map(f => f.file.name);
    const fileBlobUrls = pendingFiles.map(f => f.blobUrl ?? "").filter(Boolean);
    const userMsg: AiMessage = {
      id: crypto.randomUUID(), role: "user", content: text, createdAt: Date.now(),
      fileUrls: fileNames.length > 0 ? fileNames : undefined,
      fileBlobUrls: fileBlobUrls.length > 0 ? fileBlobUrls : undefined,
    };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    // Clear pending files but don't revoke blob URLs (kept alive in message)
    setPendingFiles([]);
    setIsResponding(true); setError(null);
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    const assistantId = crypto.randomUUID();
    let fullContent = "";

    // Detect whether to use deep research (URL pasted or non-Amazon topic)
    const { use: useResearch } = shouldUseResearch(text);
    if (useResearch) setIsResearching(true);

    try {
      if (useResearch) {
        // ── Deep research via OpenAI web search ──
        const res = await fetch("/api/ai-research", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: text }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Research failed" }));
          throw new Error(err.error ?? `HTTP ${res.status}`);
        }
        setMessages(prev => [...prev, { id: assistantId, role: "assistant", content: "", createdAt: Date.now() }]);

        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split("\n"); buf = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const raw = line.slice(6).trim(); if (!raw) continue;
            try {
              const json = JSON.parse(raw);
              if (json.type === "chunk") {
                fullContent += json.chunk;
                setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: m.content + json.chunk } : m));
              }
              if (json.type === "error") throw new Error(json.message);
              if (json.type === "done") {
                const tokens: number = json.tokens ?? 0;
                if (tokens > 0) logTokens(tokens).then(u => { if (u) setUsage(u); }).catch(() => {});
              }
            } catch (err) {
              if (err instanceof Error && err.message !== "skip") throw err;
            }
          }
        }
      } else {
        // ── Standard Dify chat ──
        const res = await fetch("/api/ai-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: queryWithContext, difyConversationId: difyConvId }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Unknown error" }));
          throw new Error(err.error ?? `HTTP ${res.status}`);
        }
        setMessages(prev => [...prev, { id: assistantId, role: "assistant", content: "", createdAt: Date.now() }]);

        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split("\n"); buf = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const raw = line.slice(6).trim(); if (!raw) continue;
            try {
              const json = JSON.parse(raw);
              if (json.type === "dify_conv_id") { setDifyConvId(json.difyConvId); setActiveConvId(json.difyConvId); }
              if (json.type === "chunk") {
                fullContent += json.chunk;
                setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: m.content + json.chunk } : m));
              }
              if (json.type === "done") {
                await refreshConversations();
                const tokens: number = json.tokens ?? 0;
                if (tokens > 0) logTokens(tokens).then(u => { if (u) setUsage(u); }).catch(() => {});
              }
            } catch { /* skip */ }
          }
        }
      }

      if (exportIntent && fullContent.length > 200) {
        setTimeout(() => setExportContent(fullContent), 500);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setMessages(prev => prev.filter(m => m.id !== assistantId));
    } finally {
      setIsResponding(false);
      setIsResearching(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, isResponding, difyConvId, pendingFiles, usage.used, usage.limit, isResearching]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const handleRename = async (convId: string, title: string) => {
    await fetch(`/api/ai-conversations/${convId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title }) });
    setConversations(prev => prev.map(c => c.id === convId ? { ...c, title } : c));
  };

  const handlePin = (convId: string) => {
    const conv = conversations.find(c => c.id === convId); if (!conv) return;
    const ids = getPinnedIds();
    const newIds = conv.pinned ? ids.filter(id => id !== convId) : [...ids, convId];
    savePinnedIds(newIds);
    setConversations(prev => prev.map(c => c.id === convId ? { ...c, pinned: !c.pinned } : c));
  };

  const handleDelete = (convId: string) => {
    const conv = conversations.find(c => c.id === convId);
    if (conv) {
      const newArchived = [{ id: convId, title: conv.title, deletedAt: new Date().toISOString() }, ...archived];
      saveArchived(newArchived); setArchived(newArchived);
    }
    setConversations(prev => prev.filter(c => c.id !== convId));
    savePinnedIds(getPinnedIds().filter(id => id !== convId));
    if (activeConvId === convId) startNew();
    setDeleteModal(null);
  };

  const handleRestore = async (convId: string) => {
    const newArchived = archived.filter(a => a.id !== convId);
    saveArchived(newArchived); setArchived(newArchived);
    await refreshConversations();
  };

  const q = search.toLowerCase();
  const filtered = conversations
    .filter(c => !archived.some(a => a.id === c.id))
    .filter(c => {
      if (!q) return true;
      if (c.title.toLowerCase().includes(q)) return true;
      if (c.preview.toLowerCase().includes(q)) return true;
      return (msgCache[c.id] ?? []).some(m => m.content.toLowerCase().includes(q));
    });
  const pinned = filtered.filter(c => c.pinned);
  const recent = filtered.filter(c => !c.pinned);
  const uploading = pendingFiles.some(f => f.status === "uploading");

  return (
    <>
      <style>{STYLE}</style>
      {deleteModal && <DeleteModal onConfirm={() => handleDelete(deleteModal)} onCancel={() => setDeleteModal(null)} />}
      {settingsOpen && <SettingsModal conversations={conversations} messages={messages} archived={archived} storedFiles={storedFiles} onRestore={handleRestore} onClose={() => setSettingsOpen(false)} />}
      {exportContent2 && <ExportModal content={exportContent2} onClose={() => setExportContent(null)} />}

      <div className="flex" style={{ height: "100vh", maxHeight: "100dvh" }}>

        {/* ─── Full sidebar ─── */}
        {sidebarOpen && (
          <aside className="flex w-64 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface)]">
            {/* Search full-width at top */}
            <div className="px-3 pt-3 pb-2">
              <div className="neon-btn rounded-xl w-full">
                <div className="flex items-center gap-2 rounded-xl bg-[var(--background)] px-3 py-2">
                  <Search size={12} className="text-[var(--muted)] shrink-0" />
                  <input ref={searchRef} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search conversations…"
                    className="flex-1 bg-transparent text-xs outline-none text-[var(--foreground)] placeholder:text-[var(--muted)]" />
                  {search && <button onClick={() => setSearch("")}><X size={10} className="text-[var(--muted)]" /></button>}
                </div>
              </div>
            </div>

            <NeonNewBtn onClick={startNew} />

            <div className="flex-1 overflow-y-auto py-1 flex flex-col">
              {pinned.length > 0 && (
                <>
                  <SectionLabel>PINNED</SectionLabel>
                  {pinned.map(c => <ConvItem key={c.id} conv={c} active={activeConvId === c.id}
                    onSelect={() => loadConversation(c.id)} onRename={t => handleRename(c.id, t)}
                    onPin={() => handlePin(c.id)} onDelete={() => setDeleteModal(c.id)} />)}
                </>
              )}
              {recent.length > 0 && (
                <>
                  <SectionLabel>RECENT</SectionLabel>
                  {recent.map(c => <ConvItem key={c.id} conv={c} active={activeConvId === c.id}
                    onSelect={() => loadConversation(c.id)} onRename={t => handleRename(c.id, t)}
                    onPin={() => handlePin(c.id)} onDelete={() => setDeleteModal(c.id)} />)}
                </>
              )}
              {filtered.length === 0 && search && <p className="px-3 py-6 text-xs text-[var(--muted)] text-center">No results found.</p>}
            </div>

            <div className="border-t border-[var(--border)] px-3 py-2 flex items-center gap-1">
              <button onClick={() => setSettingsOpen(true)} className="flex items-center gap-2 flex-1 rounded-lg px-2 py-2 text-xs text-[var(--muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--foreground)] transition">
                <Settings size={13} /> Settings
              </button>
              <button onClick={() => setSidebarOpen(false)} title="Collapse sidebar"
                className="p-2 rounded-lg text-[var(--muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--foreground)] transition shrink-0">
                <PanelLeftClose size={14} />
              </button>
            </div>
          </aside>
        )}

        {/* ─── Mini sidebar ─── */}
        {!sidebarOpen && (
          <aside className="flex w-12 shrink-0 flex-col items-center border-r border-[var(--border)] bg-[var(--surface)] py-2 gap-1">
            <MiniBtn onClick={() => setSidebarOpen(true)} tooltip="Expand sidebar"><PanelLeftOpen size={16} /></MiniBtn>
            <div className="w-6 border-t border-[var(--border)] my-1" />
            <MiniBtn onClick={startNew} tooltip="New conversation" blue><Plus size={16} /></MiniBtn>
            <div className="relative"
              onMouseEnter={() => { if (recentHoverRef.current) clearTimeout(recentHoverRef.current); setRecentHover(true); }}
              onMouseLeave={() => { recentHoverRef.current = setTimeout(() => setRecentHover(false), 250); }}>
              <button className="flex h-9 w-9 items-center justify-center rounded-xl text-[var(--muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--foreground)] transition"><Clock size={16} /></button>
              {recentHover && <MiniRecentPanel conversations={conversations} activeConvId={activeConvId} onSelect={id => { loadConversation(id); setRecentHover(false); }} />}
            </div>
            <MiniBtn onClick={() => { setSidebarOpen(true); setTimeout(() => searchRef.current?.focus(), 100); }} tooltip="Search chats"><Search size={16} /></MiniBtn>
            <div className="mt-auto"><MiniBtn onClick={() => setSettingsOpen(true)} tooltip="Settings"><Settings size={16} /></MiniBtn></div>
          </aside>
        )}

        {/* ─── Main area ─── */}
        <div className="flex flex-1 flex-col overflow-hidden" style={{ background: "#dde3ea" }}>
          <div className="shrink-0 flex items-center gap-3 border-b border-[var(--border)] px-4 py-3 bg-[var(--surface)]">
            <h1 className="text-base font-bold tracking-tight"
              style={{ background: "linear-gradient(90deg,#1d4ed8 0%,#3b82f6 55%,#60a5fa 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              AMZ Navigator
            </h1>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-2xl px-4 py-6">
              {messages.length === 0 && !isResponding ? (
                <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
                  <AgentLogo size={120} />
                  <h2 className="text-2xl font-bold text-[var(--foreground)]">{greeting}</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                    {starters.map(s => (
                      <button key={s.text} onClick={() => { setInput(s.text); textareaRef.current?.focus(); }}
                        className="group flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-left text-xs hover:border-blue-400/50 hover:bg-[var(--accent-soft)] transition-all">
                        <span className="text-base shrink-0">{s.emoji}</span>
                        <span className="text-[var(--muted)] group-hover:text-[var(--foreground)] transition leading-relaxed">{s.text}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-5">
                  {messages.map((msg, i) => (
                    <MessageBubble key={msg.id} msg={msg}
                      isThinking={isResponding && i === messages.length - 1 && msg.role === "assistant"}
                      onExport={msg.role === "assistant" && msg.content ? (c) => setExportContent(c) : undefined} />
                  ))}
                  {isResponding && messages.length > 0 && messages[messages.length - 1].role === "user" && (
                    <div className="flex gap-3 items-start">
                      <AgentLogo size={46} thinking />
                      <div className="flex flex-col gap-1">
                        <span className="text-[11px] font-semibold text-blue-400 px-1">
                          {isResearching ? "Deep Research" : "AMZ Navigator"}
                        </span>
                        <div className="rounded-2xl rounded-tl-sm border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
                          {isResearching
                            ? <span className="text-xs text-emerald-500 flex items-center gap-2">
                                <Globe size={12} className="animate-spin" style={{ animationDuration: "2s" }} />
                                Searching the web and researching…
                              </span>
                            : pendingFiles.length > 0
                            ? <span className="text-xs text-blue-400 flex items-center gap-2"><span className="w-3 h-3 rounded-full border-2 border-blue-400 border-t-transparent spin" />Analyzing file…</span>
                            : <span className="inline-flex gap-1">{[0,1,2].map(i => <span key={i} className="inline-block w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.8s" }} />)}</span>
                          }
                        </div>
                      </div>
                    </div>
                  )}
                  {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-500">{error}</div>}
                </div>
              )}
            </div>
            <div ref={bottomRef} />
          </div>

          {/* Input area */}
          <div className="shrink-0 border-t border-[var(--border)] px-4 pt-3 pb-2" style={{ background: "#dde3ea" }}>
            <div className="mx-auto max-w-2xl">
              {pendingFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {pendingFiles.map((pf, i) => (
                    <span key={i} className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-[11px] font-medium transition-all
                      ${pf.status === "uploading" ? "bg-yellow-500/10 border-yellow-400/30 text-yellow-600"
                        : pf.status === "ready" ? "bg-blue-500/10 border-blue-400/30 text-blue-500"
                        : "bg-red-500/10 border-red-400/30 text-red-500"}`}>
                      {pf.status === "uploading" ? <span className="w-3 h-3 rounded-full border-2 border-current border-t-transparent spin" /> : pf.status === "ready" ? <Check size={11} /> : <X size={11} />}
                      <FileText size={10} />
                      <span className="max-w-[140px] truncate">{pf.file.name}</span>
                      <span className="opacity-50 text-[9px]">{pf.status === "uploading" ? "Analyzing…" : pf.status === "ready" ? "Ready" : "Error"}</span>
                      <button onClick={() => removeFile(i)} className="ml-0.5 opacity-60 hover:opacity-100"><X size={9} /></button>
                    </span>
                  ))}
                </div>
              )}
              <div className={`flex items-end gap-2 rounded-2xl border bg-[var(--background)] px-3 py-2.5 transition-all ${isResponding ? "border-[var(--border)] opacity-70" : "border-[var(--border)] focus-within:border-blue-500/50 focus-within:shadow-[0_0_0_3px_rgb(59_130_246/0.08)]"}`}>
                <button onClick={() => fileInputRef.current?.click()} disabled={isResponding}
                  className="shrink-0 p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--accent-soft)] transition">
                  <Paperclip size={14} />
                </button>
                <input ref={fileInputRef} type="file" multiple className="hidden"
                  onChange={e => { if (e.target.files) handleFileChange(Array.from(e.target.files)); e.target.value = ""; }} />
                <textarea ref={textareaRef} value={input} onChange={e => { setInput(e.target.value); autoResize(); }}
                  onKeyDown={handleKeyDown}
                  placeholder={isListening ? "Listening…" : isResponding ? "AMZ Navigator is thinking…" : "Talk to AMZ Navigator"}
                  rows={1} disabled={isResponding}
                  className="flex-1 resize-none bg-transparent text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] outline-none leading-relaxed"
                  style={{ maxHeight: 140 }} />
                <button onClick={toggleMic} disabled={isResponding}
                  className={`shrink-0 p-1.5 rounded-lg transition ${isListening ? "text-red-500 animate-pulse" : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--accent-soft)]"}`}>
                  <Mic size={14} />
                </button>
                <button onClick={send} disabled={!input.trim() || isResponding || uploading || usage.used >= usage.limit}
                  className={`shrink-0 flex h-8 w-8 items-center justify-center rounded-xl transition-all ${input.trim() && !isResponding && !uploading && usage.used < usage.limit ? "bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-md shadow-blue-500/30 hover:from-blue-500 hover:to-blue-400" : "bg-[var(--accent-soft)] text-[var(--muted)] opacity-50"}`}>
                  <Send size={14} />
                </button>
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <p className="text-[11px] text-[var(--muted)]/60">
                  AMZ Navigator is AI and can make mistakes. Please double-check responses.
                </p>
                <UsageRing used={usage.used} limit={usage.limit} resetAt={usage.resetAt} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
