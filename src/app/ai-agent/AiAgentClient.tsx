"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Send, Search, MoreHorizontal, Pin, Pencil, Trash2, X,
  Plus, PanelLeftClose, PanelLeftOpen, Copy, Check,
  Paperclip, Settings, Archive, HardDrive, ImageIcon, Clock,
} from "lucide-react";

const AGENT_IMG = "https://assets.cdn.filesafe.space/2rx7sGBL7YKaiP0HwK56/media/6a399f8f7b00529580ab8d3d.png";

const GREETINGS = [
  "How can I help you today?",
  "What's on the agenda today?",
  "Ready to find your next winning brand?",
  "What would you like to source today?",
  "Let's find your next opportunity.",
  "What can I help you with today?",
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
  const a = [...arr].sort(() => Math.random() - 0.5);
  return a.slice(0, n);
}

/* ─── Pinned state via localStorage ─── */
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

/* ─── CSS ─── */
const STYLE = `
@keyframes avatar-think {
  0%,100% {
    filter: drop-shadow(0 0 5px #1e3a8a) drop-shadow(0 0 10px #1d4ed8);
  }
  50% {
    filter: drop-shadow(0 0 12px #1d4ed8) drop-shadow(0 0 24px #3b82f6) drop-shadow(0 0 36px rgba(59,130,246,0.4));
  }
}
.avatar-think { animation: avatar-think 2.4s ease-in-out infinite; }
.logo-glow {
  filter: drop-shadow(0 0 6px #1e3a8a) drop-shadow(0 0 14px #1d4ed8);
}
.logo-glow-sm {
  filter: drop-shadow(0 0 4px #1e3a8a) drop-shadow(0 0 8px #1d4ed8);
}
.neon-btn {
  position: relative;
  background: transparent;
  border: none;
  outline: none;
  cursor: pointer;
}
.neon-btn::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1.5px;
  background: linear-gradient(90deg, #1d4ed8, #2563eb, #60a5fa);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  box-shadow: 0 0 8px rgba(37,99,235,0.5), 0 0 16px rgba(37,99,235,0.25);
}
`;

type AiMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
  fileUrls?: string[];
};

type Conversation = {
  id: string;
  title: string;
  pinned: boolean;
  updatedAt: string;
  preview: string;
};

type UploadedFile = {
  name: string;
  upload_file_id: string;
  type: string; // "image" | "document" | "audio" | "video"
};

/* ─── Logo component ─── */
function AgentLogo({ size = 40, thinking = false }: { size?: number; thinking?: boolean }) {
  return (
    <div className={thinking ? "avatar-think" : "logo-glow"} style={{ display: "inline-block", lineHeight: 0 }}>
      <Image src={AGENT_IMG} alt="AMZ Navigator" width={size} height={size}
        style={{ width: size, height: size, objectFit: "contain" }} unoptimized />
    </div>
  );
}

/* ─── Neon section label (PINNED / RECENT) ─── */
function NeonLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="neon-btn mx-3 my-2 rounded-lg px-3 py-1.5 text-center"
      style={{ background: "rgba(29,78,216,0.06)" }}>
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", background: "linear-gradient(90deg,#1d4ed8,#60a5fa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
        {children}
      </span>
    </div>
  );
}

/* ─── Neon New Conversation button ─── */
function NeonNewBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="neon-btn mx-3 mt-2 mb-1 w-[calc(100%-24px)] rounded-xl py-2.5 flex items-center justify-center gap-2 transition-all hover:bg-blue-500/5 active:scale-[0.98]"
      style={{ background: "rgba(29,78,216,0.04)" }}>
      <Plus size={13} style={{ color: "#3b82f6" }} />
      <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.04em", background: "linear-gradient(90deg,#1d4ed8,#60a5fa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
        New Conversation
      </span>
    </button>
  );
}

/* ─── Markdown ─── */
function MdLine({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g);
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith("**") && p.endsWith("**")) return <strong key={i}>{p.slice(2, -2)}</strong>;
        const m = p.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (m) return <a key={i} href={m[2]} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 opacity-80 hover:opacity-100">{m[1]}</a>;
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

function MessageBubble({ msg, isThinking }: { msg: AiMessage; isThinking?: boolean }) {
  const isUser = msg.role === "user";
  return (
    <div className={`group flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"} items-start`}>
      {isUser
        ? <div className="shrink-0 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-400 text-white text-xs font-bold border border-blue-500/40">U</div>
        : <AgentLogo size={38} thinking={isThinking} />
      }
      <div className={`max-w-[78%] flex flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}>
        {!isUser && <span className="text-[11px] font-semibold text-blue-400 px-1">AMZ Navigator</span>}
        <div className={`rounded-2xl px-4 py-3 ${isUser
          ? "rounded-tr-sm bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/20"
          : "rounded-tl-sm border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] shadow-sm"}`}>
          {isUser
            ? <span className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</span>
            : <MarkdownContent content={msg.content || "…"} />}
        </div>
        {!isUser && msg.content && <CopyButton text={msg.content} />}
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
        <p className="mt-1.5 text-xs text-[var(--muted)]">This will permanently remove this conversation and all its messages.</p>
        <div className="mt-4 flex gap-2">
          <button onClick={onConfirm} className="flex-1 rounded-lg bg-red-500 py-2 text-xs font-semibold text-white hover:bg-red-600">Delete</button>
          <button onClick={onCancel} className="flex-1 rounded-lg border border-[var(--border)] py-2 text-xs text-[var(--muted)] hover:bg-[var(--accent-soft)]">Cancel</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Settings modal ─── */
function SettingsModal({ conversations, messages, onClose }: { conversations: Conversation[]; messages: AiMessage[]; onClose: () => void }) {
  const [tab, setTab] = useState<"archive" | "storage">("archive");
  const [storageTab, setStorageTab] = useState<"files" | "images">("files");
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
              <p className="text-xs text-[var(--muted)]">Deleted conversations are archived here and removed after 30 days.</p>
              <div className="rounded-xl border border-[var(--border)] p-3 text-center">
                <p className="text-xs text-[var(--muted)]">No archived conversations</p>
              </div>
            </div>
          )}
          {tab === "storage" && (
            <div className="flex flex-col gap-3">
              <div className="rounded-xl border border-[var(--border)] p-3 flex flex-col gap-2">
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--muted)]">Total conversations</span>
                  <span className="font-semibold">{conversations.length}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--muted)]">Messages in current chat</span>
                  <span className="font-semibold">{messages.length}</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-[var(--border)] mt-1">
                  <div className="h-1.5 rounded-full bg-gradient-to-r from-blue-600 to-blue-400" style={{ width: `${Math.min(100, (conversations.length / 50) * 100)}%` }} />
                </div>
                <p className="text-[10px] text-[var(--muted)]">{conversations.length} / 50 conversations</p>
              </div>
              <div className="flex gap-1 rounded-xl border border-[var(--border)] p-1">
                {(["files", "images"] as const).map(t => (
                  <button key={t} onClick={() => setStorageTab(t)} className={`flex-1 rounded-lg py-1.5 text-xs font-medium flex items-center justify-center gap-1.5 transition capitalize ${storageTab === t ? "bg-blue-500/10 text-blue-500" : "text-[var(--muted)] hover:text-[var(--foreground)]"}`}>
                    {t === "files" ? <Paperclip size={11} /> : <ImageIcon size={11} />} {t}
                  </button>
                ))}
              </div>
              <div className="rounded-xl border border-[var(--border)] p-4 text-center">
                <p className="text-xs text-[var(--muted)]">{storageTab === "files" ? "No files uploaded yet" : "No images uploaded yet"}</p>
              </div>
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
      <button onClick={onClick}
        className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${blue ? "text-blue-500 hover:bg-blue-500/10" : "text-[var(--muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--foreground)]"}`}>
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

/* ─── Mini recent chats popup ─── */
function MiniRecentPanel({ conversations, activeConvId, onSelect }: { conversations: Conversation[]; activeConvId: string | null; onSelect: (id: string) => void }) {
  return (
    <div className="absolute left-full top-0 ml-2.5 z-50 w-60 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl overflow-hidden">
      <div className="px-3 py-2 border-b border-[var(--border)]">
        <p className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest">Recent Chats</p>
      </div>
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

/* ─── Main ─── */
export default function AiAgentClient({ initialConversations }: { initialConversations: Conversation[] }) {
  const [conversations, setConversations] = useState<Conversation[]>(() => applyPinned(initialConversations));
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
  const [files, setFiles] = useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [greeting] = useState(() => GREETINGS[Math.floor(Math.random() * GREETINGS.length)]);
  const [starters, setStarters] = useState(() => shufflePick(ALL_STARTERS, 4));
  const [recentHover, setRecentHover] = useState(false);
  const recentHoverRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
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
    setActiveConvId(convId);
    setDifyConvId(convId); // Dify conv ID = convId for native conversations
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
    setActiveConvId(null);
    setDifyConvId(null);
    setMessages([]);
    setInput("");
    setFiles([]);
    setUploadedFiles([]);
    setError(null);
    setStarters(shufflePick(ALL_STARTERS, 4));
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }, []);

  const refreshConversations = async () => {
    const res = await fetch("/api/ai-conversations");
    if (res.ok) {
      const convs: Conversation[] = await res.json();
      setConversations(applyPinned(convs));
    }
  };

  /* ─── File upload to Dify ─── */
  const handleFileChange = async (newFiles: File[]) => {
    setFiles(prev => [...prev, ...newFiles]);
    setUploading(true);
    const results: UploadedFile[] = [];
    for (const f of newFiles) {
      const form = new FormData();
      form.append("file", f);
      const res = await fetch("/api/ai-upload", { method: "POST", body: form });
      if (res.ok) {
        const data = await res.json() as { id: string; mime_type?: string };
        const mime = data.mime_type ?? f.type ?? "";
        const type = mime.startsWith("image/") ? "image"
          : mime.startsWith("audio/") ? "audio"
          : mime.startsWith("video/") ? "video"
          : "document";
        results.push({ name: f.name, upload_file_id: data.id, type });
      }
    }
    setUploadedFiles(prev => [...prev, ...results]);
    setUploading(false);
  };

  const removeFile = (i: number) => {
    setFiles(prev => prev.filter((_, j) => j !== i));
    setUploadedFiles(prev => prev.filter((_, j) => j !== i));
  };

  /* ─── Send ─── */
  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || isResponding) return;

    const difyFiles = uploadedFiles.map(f => ({
      type: f.type,
      transfer_method: "local_file",
      upload_file_id: f.upload_file_id,
    }));

    const userMsg: AiMessage = { id: crypto.randomUUID(), role: "user", content: text, createdAt: Date.now(), fileUrls: uploadedFiles.map(f => f.name) };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setFiles([]);
    setUploadedFiles([]);
    setIsResponding(true);
    setError(null);
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    const assistantId = crypto.randomUUID();

    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: text, difyConversationId: difyConvId, files: difyFiles }),
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
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;
          try {
            const json = JSON.parse(raw);
            if (json.type === "dify_conv_id") {
              setDifyConvId(json.difyConvId);
              setActiveConvId(json.difyConvId);
            }
            if (json.type === "chunk") {
              setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: m.content + json.chunk } : m));
            }
            if (json.type === "done") await refreshConversations();
          } catch { /* skip */ }
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setMessages(prev => prev.filter(m => m.id !== assistantId));
    } finally {
      setIsResponding(false);
    }
  }, [input, isResponding, difyConvId, uploadedFiles]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const handleRename = async (convId: string, title: string) => {
    await fetch(`/api/ai-conversations/${convId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title }) });
    setConversations(prev => prev.map(c => c.id === convId ? { ...c, title } : c));
  };

  const handlePin = (convId: string) => {
    const conv = conversations.find(c => c.id === convId);
    if (!conv) return;
    const ids = getPinnedIds();
    const newIds = conv.pinned ? ids.filter(id => id !== convId) : [...ids, convId];
    savePinnedIds(newIds);
    setConversations(prev => prev.map(c => c.id === convId ? { ...c, pinned: !c.pinned } : c));
  };

  const handleDelete = async (convId: string) => {
    await fetch(`/api/ai-conversations/${convId}`, { method: "DELETE" });
    const ids = getPinnedIds().filter(id => id !== convId);
    savePinnedIds(ids);
    setConversations(prev => prev.filter(c => c.id !== convId));
    if (activeConvId === convId) startNew();
    setDeleteModal(null);
  };

  const q = search.toLowerCase();
  const filtered = conversations.filter(c => {
    if (!q) return true;
    if (c.title.toLowerCase().includes(q)) return true;
    if (c.preview.toLowerCase().includes(q)) return true;
    return (msgCache[c.id] ?? []).some(m => m.content.toLowerCase().includes(q));
  });
  const pinned = filtered.filter(c => c.pinned);
  const recent = filtered.filter(c => !c.pinned);

  return (
    <>
      <style>{STYLE}</style>
      {deleteModal && <DeleteModal onConfirm={() => handleDelete(deleteModal)} onCancel={() => setDeleteModal(null)} />}
      {settingsOpen && <SettingsModal conversations={conversations} messages={messages} onClose={() => setSettingsOpen(false)} />}

      <div className="flex" style={{ height: "calc(100vh)", maxHeight: "100dvh" }}>

        {/* ─── Full sidebar ─── */}
        {sidebarOpen && (
          <aside className="flex w-64 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface)]">
            {/* Top: collapse + logo */}
            <div className="flex items-center gap-2 px-3 py-3 border-b border-[var(--border)]">
              <button onClick={() => setSidebarOpen(false)}
                className="p-1.5 rounded-lg hover:bg-[var(--accent-soft)] text-[var(--muted)] hover:text-[var(--foreground)] transition shrink-0">
                <PanelLeftClose size={15} />
              </button>
              <div className="flex-1 flex justify-center">
                <AgentLogo size={48} />
              </div>
            </div>

            {/* Search — neon outline */}
            <div className="px-3 pt-3 pb-1">
              <div className="neon-btn rounded-xl w-full">
                <div className="flex items-center gap-2 rounded-xl bg-[var(--background)] px-3 py-2">
                  <Search size={12} className="text-[var(--muted)] shrink-0" />
                  <input ref={searchRef} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search conversations…"
                    className="flex-1 bg-transparent text-xs outline-none text-[var(--foreground)] placeholder:text-[var(--muted)]" />
                  {search && <button onClick={() => setSearch("")}><X size={10} className="text-[var(--muted)]" /></button>}
                </div>
              </div>
            </div>

            {/* New Conversation */}
            <NeonNewBtn onClick={startNew} />

            {/* Conversations — scrollable */}
            <div className="flex-1 overflow-y-auto py-1 flex flex-col">
              {pinned.length > 0 && (
                <>
                  <NeonLabel>PINNED</NeonLabel>
                  {pinned.map(c => <ConvItem key={c.id} conv={c} active={activeConvId === c.id}
                    onSelect={() => loadConversation(c.id)} onRename={t => handleRename(c.id, t)}
                    onPin={() => handlePin(c.id)} onDelete={() => setDeleteModal(c.id)} />)}
                </>
              )}
              {recent.length > 0 && (
                <>
                  <NeonLabel>RECENT</NeonLabel>
                  {recent.map(c => <ConvItem key={c.id} conv={c} active={activeConvId === c.id}
                    onSelect={() => loadConversation(c.id)} onRename={t => handleRename(c.id, t)}
                    onPin={() => handlePin(c.id)} onDelete={() => setDeleteModal(c.id)} />)}
                </>
              )}
              {filtered.length === 0 && search && (
                <p className="px-3 py-6 text-xs text-[var(--muted)] text-center">No results found.</p>
              )}
            </div>

            {/* Settings */}
            <div className="border-t border-[var(--border)] px-3 py-2">
              <button onClick={() => setSettingsOpen(true)}
                className="flex items-center gap-2 w-full rounded-lg px-2 py-2 text-xs text-[var(--muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--foreground)] transition">
                <Settings size={13} /> Settings
              </button>
            </div>
          </aside>
        )}

        {/* ─── Mini sidebar ─── */}
        {!sidebarOpen && (
          <aside className="flex w-12 shrink-0 flex-col items-center border-r border-[var(--border)] bg-[var(--surface)] py-2 gap-1">
            <MiniBtn onClick={() => setSidebarOpen(true)} tooltip="Expand sidebar">
              <PanelLeftOpen size={16} />
            </MiniBtn>
            <div className="w-6 border-t border-[var(--border)] my-1" />
            <MiniBtn onClick={startNew} tooltip="New conversation" blue>
              <Plus size={16} />
            </MiniBtn>
            {/* Clock — hover popup */}
            <div className="relative"
              onMouseEnter={() => { if (recentHoverRef.current) clearTimeout(recentHoverRef.current); setRecentHover(true); }}
              onMouseLeave={() => { recentHoverRef.current = setTimeout(() => setRecentHover(false), 250); }}>
              <button className="flex h-9 w-9 items-center justify-center rounded-xl text-[var(--muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--foreground)] transition">
                <Clock size={16} />
              </button>
              {recentHover && (
                <MiniRecentPanel conversations={conversations} activeConvId={activeConvId}
                  onSelect={id => { loadConversation(id); setRecentHover(false); }} />
              )}
            </div>
            <MiniBtn onClick={() => { setSidebarOpen(true); setTimeout(() => searchRef.current?.focus(), 100); }} tooltip="Search chats">
              <Search size={16} />
            </MiniBtn>
            <div className="mt-auto">
              <MiniBtn onClick={() => setSettingsOpen(true)} tooltip="Settings">
                <Settings size={16} />
              </MiniBtn>
            </div>
          </aside>
        )}

        {/* ─── Main area ─── */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Header */}
          <div className="shrink-0 flex items-center gap-3 border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3">
            <h1 className="text-base font-bold tracking-tight"
              style={{ background: "linear-gradient(90deg,#1d4ed8 0%,#3b82f6 55%,#60a5fa 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              AMZ Navigator
            </h1>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-2xl px-4 py-6">
              {messages.length === 0 && !isResponding ? (
                <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
                  <AgentLogo size={96} />
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
                      isThinking={isResponding && i === messages.length - 1 && msg.role === "assistant"} />
                  ))}
                  {/* Typing indicator while waiting for first chunk */}
                  {isResponding && messages.length > 0 && messages[messages.length - 1].role === "user" && (
                    <div className="flex gap-3 items-start">
                      <AgentLogo size={38} thinking />
                      <div className="flex flex-col gap-1">
                        <span className="text-[11px] font-semibold text-blue-400 px-1">AMZ Navigator</span>
                        <div className="rounded-2xl rounded-tl-sm border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
                          <span className="inline-flex gap-1">
                            {[0,1,2].map(i => (
                              <span key={i} className="inline-block w-2 h-2 rounded-full bg-blue-400 animate-bounce"
                                style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.8s" }} />
                            ))}
                          </span>
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

          {/* Input */}
          <div className="shrink-0 border-t border-[var(--border)] bg-[var(--surface)] px-4 py-3">
            <div className="mx-auto max-w-2xl">
              {files.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {files.map((f, i) => (
                    <span key={i} className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] ${uploadedFiles[i] ? "bg-blue-500/10 border-blue-500/20 text-blue-400" : "bg-yellow-500/10 border-yellow-500/20 text-yellow-600"}`}>
                      <Paperclip size={9} /> {f.name}
                      {uploading && !uploadedFiles[i] && <span className="ml-0.5 opacity-60">↑</span>}
                      <button onClick={() => removeFile(i)}><X size={9} /></button>
                    </span>
                  ))}
                </div>
              )}
              <div className={`flex items-end gap-2 rounded-2xl border bg-[var(--background)] px-3 py-2.5 transition-all ${isResponding ? "border-[var(--border)] opacity-70" : "border-[var(--border)] focus-within:border-blue-500/50 focus-within:shadow-[0_0_0_3px_rgb(59_130_246/0.08)]"}`}>
                <button onClick={() => fileInputRef.current?.click()} disabled={isResponding || uploading}
                  className="shrink-0 p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--accent-soft)] transition">
                  <Paperclip size={14} className={uploading ? "animate-pulse text-blue-400" : ""} />
                </button>
                <input ref={fileInputRef} type="file" multiple className="hidden"
                  onChange={e => { if (e.target.files) handleFileChange(Array.from(e.target.files)); e.target.value = ""; }} />
                <textarea ref={textareaRef} value={input} onChange={e => { setInput(e.target.value); autoResize(); }}
                  onKeyDown={handleKeyDown}
                  placeholder={isResponding ? "AMZ Navigator is thinking…" : "Ask anything about Amazon sourcing…"}
                  rows={1} disabled={isResponding}
                  className="flex-1 resize-none bg-transparent text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] outline-none leading-relaxed"
                  style={{ maxHeight: 140 }} />
                <button onClick={send} disabled={!input.trim() || isResponding || uploading}
                  className={`shrink-0 flex h-8 w-8 items-center justify-center rounded-xl transition-all ${input.trim() && !isResponding && !uploading ? "bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-md shadow-blue-500/30 hover:from-blue-500 hover:to-blue-400" : "bg-[var(--accent-soft)] text-[var(--muted)] opacity-50"}`}>
                  <Send size={14} />
                </button>
              </div>
              <p className="mt-1.5 text-center text-[10px] text-[var(--muted)]/60">
                AMZ Navigator is AI and can make mistakes. Please double-check responses.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
