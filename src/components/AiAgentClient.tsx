"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Plus, Search, Trash2, Pencil, Check, X, Copy, Send, Paperclip,
  User, Settings, Menu, Pin, Loader2, MoreHorizontal, Clock,
  MessageSquare, Zap, Archive, HardDrive, RotateCcw, FileText,
  Image as ImageIcon,
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import AnimatedOrb, { type OrbState } from "@/components/AnimatedOrb";

const GREETINGS = [
  "Have you grabbed a coffee already? Now, let's talk! ☕",
  "Good to have you here. What are we working on today?",
  "Ready when you are — what's on your plate?",
  "Hope the day's treating you well. What do you need?",
  "Alright, let's get into it. What's the mission today?",
  "You showed up — that's the first step. What's next?",
  "No small talk needed. What can I help you crush today?",
  "The grind doesn't stop. What are we tackling?",
  "Another day, another opportunity. What's on your mind?",
  "Big things happen one conversation at a time. Let's go.",
  "Fresh session, fresh focus. What do you want to work on?",
  "Let's make today count. What's the plan?",
  "Good timing — I'm ready to dive in. What do you need?",
  "Every great brand deal starts with a conversation. Let's begin.",
  "Glad you're here. What's on your Amazon agenda today?",
  "Sharp minds get sharp results. What are we solving?",
  "No fluff, just focus. What do you want to tackle?",
  "The best time to start is now. What's first on the list?",
  "You've got questions, I've got answers. Fire away.",
  "Let's build something today. What's the goal?",
  "Good things happen when you take action. What's yours?",
  "I'm here, you're here — let's make it count. What's up?",
  "Wholesale waits for no one. What are we working on?",
  "New session, new wins. What are we going after?",
  "The right move starts with the right conversation. Let's go.",
  "Got a challenge? Let's work through it together.",
  "Think of me as your Amazon co-pilot. Where are we flying today?",
  "Whether it's brands, products, or outreach — I'm ready. What's first?",
  "Every successful seller has a good system. Let's build yours.",
  "Focused and ready. What do you want to figure out today?",
];
function getRandomGreeting() { return GREETINGS[Math.floor(Math.random() * GREETINGS.length)]; }

const STARTERS = [
  { icon: "🏷️", text: "Walk me through the Brand Partnership Blueprint" },
  { icon: "📦", text: "How do I qualify a wholesale brand for Amazon?" },
  { icon: "✉️", text: "Write me an outreach email to a new supplier" },
  { icon: "📊", text: "What are the key steps in the Wholesale Masterclass?" },
  { icon: "🔍", text: "How do I find profitable wholesale products?" },
  { icon: "💰", text: "What margins should I target for wholesale?" },
  { icon: "🤝", text: "How do I negotiate better terms with suppliers?" },
  { icon: "📈", text: "Walk me through the brand approval process" },
];
function getRandomStarters(n = 4) { return [...STARTERS].sort(() => Math.random() - 0.5).slice(0, n); }

interface Message { id: string; role: "user" | "assistant"; content: string; streaming?: boolean; createdAt: number; }
interface Conversation { id: string; title: string; pinned: boolean; updatedAt: string; preview: string; difyConversationId?: string; }
interface UsageState { used: number; limit: number; remaining: number; resetAt: string | null; resetInMs: number; percentUsed: number; allowed: boolean; }
interface BlockedState { message: string; resetInMs: number; windowEnd: string | null; }
interface ArchivedConv { id: string | null; title: string; deletedAt: string | null; }
interface UserFile { id: string; name: string; fileType: string; size: number | null; mimeType: string | null; createdAt: string; }

function genId() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

function formatReset(ms: number): string {
  if (ms <= 0) return "now";
  const s = Math.ceil(ms / 1000);
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  if (m > 0) return `${m}m`;
  return `${sec}s`;
}

function groupConversations(convs: Conversation[]) {
  const now = Date.now();
  const today: Conversation[] = [], yesterday: Conversation[] = [], week: Conversation[] = [], older: Conversation[] = [];
  for (const c of convs) {
    if (c.pinned) continue;
    const d = now - new Date(c.updatedAt).getTime();
    if (d < 86_400_000) today.push(c);
    else if (d < 172_800_000) yesterday.push(c);
    else if (d < 604_800_000) week.push(c);
    else older.push(c);
  }
  return { today, yesterday, week, older };
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-1">
      {[0, 150, 300].map((d) => (
        <div key={d} className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"
          style={{ animationDelay: `${d}ms`, animationDuration: "0.8s" }} />
      ))}
    </div>
  );
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={async () => { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all" title="Copy">
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function msgToOrbState(msg: Message): OrbState {
  if (!msg.streaming) return "done";
  if (msg.content === "") return "thinking";
  return "responding";
}

interface Props {
  userId: string;
  userEmail: string;
  userName: string;
}

export default function AiAgentClient({ userId, userEmail, userName }: Props) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingConv, setLoadingConv] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [panel, setPanel] = useState<"settings" | null>(null);
  const [usage, setUsage] = useState<UsageState>({ used: 0, limit: 50, remaining: 50, resetAt: null, resetInMs: 0, percentUsed: 0, allowed: true });
  const [blockedState, setBlockedState] = useState<BlockedState | null>(null);
  const [countdown, setCountdown] = useState("");
  const [starters, setStarters] = useState(() => getRandomStarters(4));
  const [greeting, setGreeting] = useState(() => getRandomGreeting());
  const [convLoaded, setConvLoaded] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [messageCache, setMessageCache] = useState<Record<string, Message[]>>({});
  const [collapsedPopout, setCollapsedPopout] = useState<"recents" | "pinned" | "search" | null>(null);
  const [settingsTab, setSettingsTab] = useState<"archive" | "storage">("archive");
  const [archivedConvs, setArchivedConvs] = useState<ArchivedConv[]>([]);
  const [userFiles, setUserFiles] = useState<UserFile[]>([]);
  const [storageSubTab, setStorageSubTab] = useState<"files" | "images">("files");
  const [loadingArchive, setLoadingArchive] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [searchResults, setSearchResults] = useState<Array<{ id: string; title: string; snippet: string; updatedAt: string }>>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const streamingMsgIdRef = useRef<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const collapsedPopoutRef = useRef<HTMLDivElement>(null);
  const collapsedSearchRef = useRef<HTMLInputElement>(null);
  const searchOverlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (window.innerWidth >= 1024) setSidebarOpen(true); }, []);

  useEffect(() => {
    fetch("/api/ai-conversations")
      .then((r) => r.json())
      .then((data: Conversation[]) => { if (Array.isArray(data)) setConversations(data); setConvLoaded(true); })
      .catch(() => setConvLoaded(true));
  }, []);

  useEffect(() => {
    fetch("/api/ai-usage").then((r) => r.json()).then((d) => {
      if (d.used !== undefined) setUsage({ used: d.used, limit: d.limit, remaining: d.remaining ?? d.limit - d.used, resetAt: d.resetAt ?? null, resetInMs: d.resetInMs ?? 0, percentUsed: d.percentUsed ?? 0, allowed: d.allowed ?? true });
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) { setSearchResults([]); setSearchLoading(false); return; }
    setSearchLoading(true);
    const timer = setTimeout(() => {
      fetch(`/api/ai-search?q=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((data) => { if (Array.isArray(data)) setSearchResults(data); setSearchLoading(false); })
        .catch(() => setSearchLoading(false));
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Supabase Realtime — instant cross-app sync
  useEffect(() => {
    const refreshConvs = () => {
      fetch("/api/ai-conversations").then((r) => r.json())
        .then((data: Conversation[]) => { if (Array.isArray(data)) setConversations(data); })
        .catch(() => {});
    };

    const onVisibility = () => { if (document.visibilityState === "visible") refreshConvs(); };
    document.addEventListener("visibilitychange", onVisibility);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const channel = supabase
        .channel(`ai-agent-${userId}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "AiConversation", filter: `userId=eq.${userId}` }, () => refreshConvs())
        .subscribe();
      const interval = setInterval(refreshConvs, 30_000);
      return () => {
        supabase.removeChannel(channel);
        document.removeEventListener("visibilitychange", onVisibility);
        clearInterval(interval);
      };
    }

    const interval = setInterval(refreshConvs, 10_000);
    return () => { document.removeEventListener("visibilitychange", onVisibility); clearInterval(interval); };
  }, [userId]);

  useEffect(() => {
    const load = () => fetch("/api/ai-starters").then((r) => r.json()).then((d) => { if (Array.isArray(d) && d.length) setStarters(d); }).catch(() => {});
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (menuOpenId && menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpenId(null); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpenId]);

  useEffect(() => {
    if (!collapsedPopout) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (collapsedPopoutRef.current?.contains(target)) return;
      if (searchOverlayRef.current?.contains(target)) return;
      setCollapsedPopout(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [collapsedPopout]);

  useEffect(() => {
    if (panel !== "settings" || settingsTab !== "archive") return;
    setLoadingArchive(true);
    fetch("/api/ai-conversations/archived").then((r) => r.json()).then((d) => { if (Array.isArray(d)) setArchivedConvs(d); }).catch(() => {}).finally(() => setLoadingArchive(false));
  }, [panel, settingsTab]);

  useEffect(() => {
    if (panel !== "settings" || settingsTab !== "storage") return;
    setLoadingFiles(true);
    fetch("/api/user-files").then((r) => r.json()).then((d) => { if (Array.isArray(d)) setUserFiles(d); }).catch(() => {}).finally(() => setLoadingFiles(false));
  }, [panel, settingsTab]);

  useEffect(() => {
    if (!blockedState?.windowEnd) { setCountdown(""); return; }
    const tick = () => {
      const ms = new Date(blockedState.windowEnd!).getTime() - Date.now();
      if (ms <= 0) {
        setBlockedState(null); setCountdown("");
        fetch("/api/ai-usage").then((r) => r.json()).then((d) => {
          if (d.used !== undefined) setUsage({ used: d.used, limit: d.limit, remaining: d.remaining ?? d.limit - d.used, resetAt: d.resetAt ?? null, resetInMs: d.resetInMs ?? 0, percentUsed: d.percentUsed ?? 0, allowed: d.allowed ?? true });
        }).catch(() => {});
        return;
      }
      setCountdown(formatReset(ms));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [blockedState?.windowEnd]);

  const handleSelectConv = useCallback(async (id: string) => {
    if (id === activeConvId) return;
    if (window.innerWidth < 1024) setSidebarOpen(false);
    setActiveConvId(id); setMessages([]); setLoadingConv(true);
    try {
      const res = await fetch(`/api/ai-conversations/${id}`);
      const data = await res.json();
      if (Array.isArray(data.messages)) {
        const msgs = data.messages.map((m: Message) => ({ ...m, streaming: false }));
        setMessages(msgs);
        setMessageCache((prev) => ({ ...prev, [id]: msgs }));
      }
    } catch {}
    setLoadingConv(false);
  }, [activeConvId]);

  const handleNewChat = useCallback(() => {
    setActiveConvId(null); setMessages([]); setInput(""); setPendingFiles([]);
    if (window.innerWidth < 1024) setSidebarOpen(false);
    setGreeting(getRandomGreeting());
    fetch("/api/ai-starters").then((r) => r.json()).then((d) => { if (Array.isArray(d) && d.length) setStarters(d); }).catch(() => {});
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    const conv = conversations.find((c) => c.id === id);
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConvId === id) { setActiveConvId(null); setMessages([]); }
    try {
      await fetch(`/api/ai-conversations/${id}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: conv?.title ?? "Deleted Chat" }) });
    } catch {}
  }, [activeConvId, conversations]);

  const handleRestore = useCallback(async (convId: string | null) => {
    if (!convId) return;
    await fetch(`/api/ai-conversations/${convId}/restore`, { method: "POST" }).catch(() => {});
    setArchivedConvs((prev) => prev.filter((c) => c.id !== convId));
    fetch("/api/ai-conversations").then((r) => r.json()).then((d) => { if (Array.isArray(d)) setConversations(d); }).catch(() => {});
  }, []);

  const handleRenameStart = useCallback((id: string, title: string) => { setEditingId(id); setEditTitle(title); }, []);

  const handleRenameSave = useCallback(async (id: string) => {
    if (!editTitle.trim()) return;
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, title: editTitle.trim() } : c)));
    setEditingId(null);
    try {
      await fetch(`/api/ai-conversations/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: editTitle.trim() }) });
    } catch {}
  }, [editTitle]);

  const handlePin = useCallback(async (convId: string) => {
    const conv = conversations.find((c) => c.id === convId);
    if (!conv) return;
    const newPinned = !conv.pinned;
    setConversations((prev) => {
      const updated = prev.map((c) => c.id === convId ? { ...c, pinned: newPinned } : c);
      return updated.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
    });
    await fetch(`/api/ai-conversations/${convId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pinned: newPinned }) });
  }, [conversations]);

  const autoResize = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 180)}px`;
  }, []);

  const handleSend = useCallback(async (text: string, filesToSend?: File[]) => {
    if (loading || !text.trim()) return;
    if (!usage.allowed || blockedState) return;

    const uploadedFiles: { type: string; transfer_method: string; upload_file_id: string }[] = [];
    if (filesToSend?.length) {
      for (const file of filesToSend) {
        try {
          const fd = new FormData(); fd.append("file", file);
          const res = await fetch("/api/ai-upload", { method: "POST", body: fd });
          if (res.ok) { const data = await res.json(); uploadedFiles.push({ type: file.type.startsWith("image/") ? "image" : "document", transfer_method: "local_file", upload_file_id: data.id }); }
        } catch {}
      }
    }

    const userMsg: Message = { id: genId(), role: "user", content: text, createdAt: Date.now() };
    const aiMsgId = genId();
    streamingMsgIdRef.current = aiMsgId;
    const aiMsg: Message = { id: aiMsgId, role: "assistant", content: "", streaming: true, createdAt: Date.now() + 1 };

    setMessages((prev) => [...prev, userMsg, aiMsg]);
    setInput(""); setPendingFiles([]);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setLoading(true);

    const difyConvId = activeConvId ?? "";

    try {
      const res = await fetch("/api/ai-chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: text, difyConversationId: difyConvId || undefined, files: uploadedFiles.length ? uploadedFiles : undefined }) });

      if (res.status === 429) {
        const errData = await res.json().catch(() => ({}));
        setBlockedState({ message: errData.message ?? "Message limit reached.", resetInMs: errData.resetInMs ?? 0, windowEnd: errData.windowEnd ?? null });
        setMessages((prev) => prev.filter((m) => m.id !== aiMsgId));
        return;
      }
      if (!res.ok) { const errData = await res.json().catch(() => ({ error: `HTTP ${res.status}` })); throw new Error(errData.error ?? `HTTP ${res.status}`); }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buf = "", newDifyConvId = difyConvId;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n"); buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          try {
            const parsed = JSON.parse(raw);
            if (parsed.type === "chunk" && parsed.chunk) {
              setMessages((prev) => prev.map((m) => m.id === aiMsgId ? { ...m, content: m.content + parsed.chunk } : m));
            } else if (parsed.type === "dify_conv_id") {
              newDifyConvId = parsed.difyConvId;
            } else if (parsed.type === "done") {
              setMessages((prev) => prev.map((m) => m.id === aiMsgId ? { ...m, streaming: false } : m));
              fetch("/api/ai-usage").then((r) => r.json()).then((d) => {
                if (d.used !== undefined) setUsage({ used: d.used, limit: d.limit, remaining: d.remaining ?? d.limit - d.used, resetAt: d.resetAt ?? null, resetInMs: d.resetInMs ?? 0, percentUsed: d.percentUsed ?? 0, allowed: d.allowed ?? true });
              }).catch(() => {});
            } else if (parsed.type === "error") {
              throw new Error(parsed.message ?? "Stream error");
            }
          } catch (parseErr) { if (parseErr instanceof SyntaxError) continue; throw parseErr; }
        }
      }

      const shortTitle = text.length > 45 ? text.slice(0, 45) + "…" : text;
      if (activeConvId) {
        setConversations((prev) => prev.map((c) => c.id === activeConvId ? { ...c, preview: text, updatedAt: new Date().toISOString() } : c));
      } else if (newDifyConvId) {
        const newConv: Conversation = { id: newDifyConvId, title: shortTitle, pinned: false, updatedAt: new Date().toISOString(), preview: text };
        setConversations((prev) => [newConv, ...prev]);
        setActiveConvId(newDifyConvId);
        fetch("/api/ai-conversations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ difyConversationId: newDifyConvId, title: shortTitle }) }).catch(() => {});
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Something went wrong.";
      setMessages((prev) => prev.map((m) => m.id === aiMsgId ? { ...m, content: `⚠️ ${errMsg}`, streaming: false } : m));
    } finally { setLoading(false); streamingMsgIdRef.current = null; }
  }, [loading, activeConvId, usage.allowed, blockedState]);

  const submit = useCallback(() => { if (!input.trim() || loading) return; handleSend(input.trim(), pendingFiles.length ? pendingFiles : undefined); }, [input, loading, pendingFiles, handleSend]);
  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } };

  const filteredConvs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return conversations;
    const localMatches = conversations.filter((c) => {
      if (c.title.toLowerCase().includes(q)) return true;
      if (c.preview?.toLowerCase().includes(q)) return true;
      const msgs = messageCache[c.id] || [];
      return msgs.some((m) => m.content.toLowerCase().includes(q));
    });
    const localIds = new Set(localMatches.map((c) => c.id));
    const backendOnly = searchResults.filter((r) => !localIds.has(r.id)).map((r) => {
      const existing = conversations.find((c) => c.id === r.id);
      return existing ?? { id: r.id, title: r.title, pinned: false, updatedAt: r.updatedAt, preview: r.snippet };
    });
    return [...localMatches, ...backendOnly];
  }, [conversations, searchQuery, messageCache, searchResults]);

  const pinnedConvs = filteredConvs.filter((c) => c.pinned);
  const groups = groupConversations(filteredConvs);

  const usagePct = usage.percentUsed;
  const usageColor = usagePct < 60 ? "from-blue-600 to-cyan-500" : usagePct < 85 ? "from-yellow-500 to-orange-500" : "from-red-600 to-red-500";

  function SectionLabel({ label }: { label: string }) {
    return <p className="text-[9px] font-bold uppercase tracking-widest px-3 mb-1 mt-3 first:mt-1 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">{label}</p>;
  }

  function ConvItem({ conv }: { conv: Conversation }) {
    const isActive = conv.id === activeConvId;
    const isPinned = conv.pinned;
    const isMenuOpen = menuOpenId === conv.id;

    return (
      <div className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-xl cursor-pointer transition-all duration-150 ${isActive ? "bg-blue-600/25 border border-blue-500/40 text-white" : "hover:bg-blue-500/[0.08] border border-transparent text-slate-300 hover:text-blue-200"}`}
        onClick={() => handleSelectConv(conv.id)}>
        {editingId === conv.id ? (
          <div className="flex-1 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <input autoFocus value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleRenameSave(conv.id); if (e.key === "Escape") setEditingId(null); }}
              className="flex-1 bg-white/10 rounded-lg px-2 py-1 text-xs text-white outline-none border border-blue-500/40" />
            <button onClick={() => handleRenameSave(conv.id)} className="text-emerald-400 hover:text-emerald-300"><Check className="w-3.5 h-3.5" /></button>
            <button onClick={() => setEditingId(null)} className="text-slate-500 hover:text-slate-300"><X className="w-3.5 h-3.5" /></button>
          </div>
        ) : (
          <>
            <span className="flex-1 truncate text-xs font-semibold leading-snug">{conv.title}</span>
            <div className="relative" onClick={(e) => e.stopPropagation()} ref={isMenuOpen ? menuRef : null}>
              <button onClick={() => setMenuOpenId(isMenuOpen ? null : conv.id)}
                className={`p-1 rounded-lg transition-all ${isMenuOpen ? "opacity-100 text-white bg-white/10" : "opacity-0 group-hover:opacity-100 text-slate-400 hover:text-white hover:bg-white/10"}`}
                title="More options">
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>
              {isMenuOpen && (
                <div className="absolute right-0 top-7 z-50 bg-[#1a2236] border border-white/10 rounded-xl shadow-2xl py-1 min-w-[152px]">
                  <button onClick={() => { handleRenameStart(conv.id, conv.title); setMenuOpenId(null); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-200 hover:bg-white/[0.07] transition-colors">
                    <Pencil className="w-3.5 h-3.5 text-slate-400" />Rename
                  </button>
                  <button onClick={() => { handlePin(conv.id); setMenuOpenId(null); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-200 hover:bg-white/[0.07] transition-colors">
                    <Pin className={`w-3.5 h-3.5 ${isPinned ? "text-blue-400" : "text-slate-400"}`} />
                    {isPinned ? "Unpin" : "Pin"}
                  </button>
                  <div className="my-1 border-t border-white/[0.06]" />
                  <button onClick={() => { setDeleteConfirmId(conv.id); setMenuOpenId(null); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />Delete
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] overflow-hidden">
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full mx-4 border border-gray-100">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0"><Trash2 className="w-5 h-5 text-red-500" /></div>
              <div>
                <h3 className="text-gray-900 font-bold text-base leading-tight">Delete conversation?</h3>
                <p className="text-gray-500 text-sm mt-1 leading-relaxed">This will move to Archive. You can restore it from <span className="font-medium text-gray-700">Settings → Archive</span>.</p>
              </div>
            </div>
            <div className="flex gap-2.5 mt-5">
              <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm font-medium transition-colors">Cancel</button>
              <button onClick={() => { handleDelete(deleteConfirmId); setDeleteConfirmId(null); }} className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div className={`flex-shrink-0 flex flex-col bg-[#080e1f] border-r border-white/[0.06] transition-all duration-300 fixed inset-y-0 left-0 z-50 lg:static lg:z-auto lg:inset-auto ${sidebarOpen ? "w-64 translate-x-0" : "w-64 -translate-x-full lg:translate-x-0 lg:w-14"}`}>
        {sidebarOpen ? (
          <>
            <div className="flex-1 flex flex-col min-h-0 p-3">
              <div className="relative flex items-center justify-center mb-3 px-1 h-11">
                <div className="relative w-11 h-11 flex-shrink-0">
                  <div className="absolute inset-0 blur-xl bg-blue-500/20 rounded-xl" />
                  <img
                    src="https://assets.cdn.filesafe.space/2rx7sGBL7YKaiP0HwK56/media/6a380e1e1c5d711b35ce5f63.png"
                    alt="AMZ Navigator"
                    className="relative w-11 h-11 object-cover rounded-xl"
                    style={{ mixBlendMode: "screen" }}
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                  />
                </div>
                <button onClick={() => setSidebarOpen(false)} title="Close sidebar"
                  className="absolute right-1 w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.07] transition-all">
                  <Menu style={{ width: "17px", height: "17px" }} />
                </button>
              </div>

              <button onClick={handleNewChat}
                className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl bg-gradient-to-r from-blue-600/80 to-blue-500/80 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-semibold transition-all duration-200 shadow-lg shadow-blue-500/20 mb-3">
                <Plus className="w-4 h-4" />New Conversation
              </button>

              <div className="relative mb-2">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search chats…"
                  className="w-full bg-white/[0.05] border border-white/[0.07] rounded-xl pl-8 pr-3 py-2 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-blue-500/40 transition-all" />
              </div>

              <div className="flex-1 overflow-y-auto scrollbar-thin space-y-0.5 pr-0.5">
                {!convLoaded && <div className="flex justify-center py-8"><Loader2 className="w-4 h-4 text-blue-500 animate-spin" /></div>}
                {pinnedConvs.length > 0 && (<><SectionLabel label="Pinned" />{pinnedConvs.map((c) => <ConvItem key={c.id} conv={c} />)}</>)}
                {groups.today.length > 0 && (<><SectionLabel label="Today" />{groups.today.map((c) => <ConvItem key={c.id} conv={c} />)}</>)}
                {groups.yesterday.length > 0 && (<><SectionLabel label="Yesterday" />{groups.yesterday.map((c) => <ConvItem key={c.id} conv={c} />)}</>)}
                {groups.week.length > 0 && (<><SectionLabel label="Previous 7 days" />{groups.week.map((c) => <ConvItem key={c.id} conv={c} />)}</>)}
                {groups.older.length > 0 && (<><SectionLabel label="Older" />{groups.older.map((c) => <ConvItem key={c.id} conv={c} />)}</>)}
                {convLoaded && conversations.length === 0 && !searchQuery && (
                  <div className="text-center py-8"><MessageSquare className="w-8 h-8 text-slate-700 mx-auto mb-2" /><p className="text-xs text-slate-600">No conversations yet.<br />Start chatting!</p></div>
                )}
                {convLoaded && searchQuery && filteredConvs.length === 0 && (
                  <p className="text-center text-xs text-slate-600 py-6">No results for &ldquo;{searchQuery}&rdquo;</p>
                )}
              </div>
            </div>

            <div className="border-t border-white/[0.06] p-3 space-y-1">
              <div className="px-1 mb-2">
                <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                  <span className="flex items-center gap-1"><Zap className="w-2.5 h-2.5" />{usage.remaining} msg left</span>
                  <span>{usage.used}/{usage.limit}</span>
                </div>
                <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
                  <div className={`h-full rounded-full bg-gradient-to-r ${usageColor} transition-all duration-500`} style={{ width: `${Math.max(2, usagePct)}%` }} />
                </div>
                {!usage.allowed && countdown && <p className="text-[10px] text-red-400 mt-1">Resets in {countdown}</p>}
              </div>
              <button onClick={() => setPanel(panel === "settings" ? null : "settings")}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.05] transition-all text-xs">
                <Settings className="w-3.5 h-3.5" />Settings
              </button>
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                  {(userName || userEmail)[0]?.toUpperCase() ?? "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white truncate font-medium">{userName || userEmail}</p>
                  <p className="text-[10px] text-slate-600 truncate">{userEmail}</p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="relative flex flex-col items-center pt-2 pb-3 gap-0.5" ref={collapsedPopoutRef}>
            <button onClick={() => setSidebarOpen(true)} title="Open sidebar" className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.07] transition-all"><Menu style={{ width: "18px", height: "18px" }} /></button>
            <button onClick={() => { handleNewChat(); setCollapsedPopout(null); }} title="New chat" className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.07] transition-all"><Plus style={{ width: "18px", height: "18px" }} /></button>
            <button onClick={() => setCollapsedPopout(collapsedPopout === "recents" ? null : "recents")} title="Recent chats"
              className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${collapsedPopout === "recents" ? "bg-blue-600/25 text-blue-300" : "text-slate-400 hover:text-white hover:bg-white/[0.07]"}`}>
              <Clock style={{ width: "18px", height: "18px" }} />
            </button>
            <button onClick={() => setCollapsedPopout(collapsedPopout === "pinned" ? null : "pinned")} title="Pinned chats"
              className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${collapsedPopout === "pinned" ? "bg-blue-600/25 text-blue-300" : "text-slate-400 hover:text-white hover:bg-white/[0.07]"}`}>
              <Pin style={{ width: "16px", height: "16px" }} />
            </button>
            <button onClick={() => setCollapsedPopout(collapsedPopout === "search" ? null : "search")} title="Search chats"
              className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${collapsedPopout === "search" ? "bg-blue-600/25 text-blue-300" : "text-slate-400 hover:text-white hover:bg-white/[0.07]"}`}>
              <Search style={{ width: "18px", height: "18px" }} />
            </button>

            {collapsedPopout === "recents" && (
              <div className="absolute left-full top-0 z-50 w-64 bg-[#0d1526] border border-white/[0.08] rounded-r-xl shadow-2xl overflow-hidden" style={{ maxHeight: "70vh" }}>
                <div className="px-4 py-3 border-b border-white/[0.06]"><p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Today</p></div>
                <div className="overflow-y-auto" style={{ maxHeight: "calc(70vh - 44px)" }}>
                  {groups.today.length === 0 ? <p className="text-xs text-slate-500 px-4 py-4 text-center">No chats today</p> :
                    groups.today.map((c) => <button key={c.id} onClick={() => { handleSelectConv(c.id); setCollapsedPopout(null); }} className="w-full text-left px-4 py-2.5 text-xs text-slate-300 hover:bg-blue-500/[0.08] hover:text-blue-200 truncate border-b border-white/[0.03] transition-colors">{c.title}</button>)}
                </div>
              </div>
            )}
            {collapsedPopout === "pinned" && (
              <div className="absolute left-full top-0 z-50 w-64 bg-[#0d1526] border border-white/[0.08] rounded-r-xl shadow-2xl overflow-hidden" style={{ maxHeight: "70vh" }}>
                <div className="px-4 py-3 border-b border-white/[0.06]"><p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Pinned</p></div>
                <div className="overflow-y-auto" style={{ maxHeight: "calc(70vh - 44px)" }}>
                  {pinnedConvs.length === 0 ? <p className="text-xs text-slate-500 px-4 py-4 text-center">No pinned chats</p> :
                    pinnedConvs.map((c) => <button key={c.id} onClick={() => { handleSelectConv(c.id); setCollapsedPopout(null); }} className="w-full text-left px-4 py-2.5 text-xs text-slate-300 hover:bg-blue-500/[0.08] hover:text-blue-200 truncate border-b border-white/[0.03] transition-colors">{c.title}</button>)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main area */}
      <div className="flex-1 min-w-0 flex flex-col relative bg-[#f8fafc]">

        {collapsedPopout === "search" && !sidebarOpen && (
          <div ref={searchOverlayRef} className="absolute inset-0 z-50 flex items-start justify-center pt-16 bg-black/30 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) { setCollapsedPopout(null); setSearchQuery(""); } }}>
            <div className="w-full max-w-lg mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="flex items-center px-4 py-3 border-b border-gray-100">
                <Search className="w-4 h-4 text-gray-400 mr-3 flex-shrink-0" />
                <input ref={collapsedSearchRef} autoFocus value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search conversations and messages…" className="flex-1 outline-none text-sm text-gray-800 placeholder-gray-400 bg-white" />
                {searchLoading && <Loader2 className="w-4 h-4 text-blue-400 animate-spin mx-2" />}
                <button onClick={() => { setCollapsedPopout(null); setSearchQuery(""); }}><X className="w-4 h-4 text-gray-400 hover:text-gray-600 ml-2" /></button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {searchQuery.trim() === "" ? <p className="text-xs text-gray-400 text-center py-6">Start typing to search all messages…</p> :
                  filteredConvs.length === 0 && !searchLoading ? <p className="text-xs text-gray-400 text-center py-6">No results for &ldquo;{searchQuery}&rdquo;</p> :
                  filteredConvs.slice(0, 20).map((c) => (
                    <button key={c.id} onClick={() => { handleSelectConv(c.id); setCollapsedPopout(null); setSearchQuery(""); }}
                      className="w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                      <p className="text-sm text-gray-700 truncate">{c.title}</p>
                      {c.preview && <p className="text-xs text-gray-400 mt-0.5 truncate">{c.preview}</p>}
                    </button>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Settings panel */}
        {panel === "settings" && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setPanel(null)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h2 className="text-gray-900 font-bold text-base">Settings</h2>
                <button onClick={() => setPanel(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
              </div>
              <div className="flex border-b border-gray-100">
                <button onClick={() => setSettingsTab("archive")} className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${settingsTab === "archive" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}>
                  <Archive className="w-4 h-4" />Archive
                </button>
                <button onClick={() => setSettingsTab("storage")} className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${settingsTab === "storage" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}>
                  <HardDrive className="w-4 h-4" />Storage
                </button>
              </div>

              {settingsTab === "archive" && (
                <div className="overflow-y-auto" style={{ maxHeight: "50vh" }}>
                  <p className="text-xs text-gray-500 px-5 py-3 border-b border-gray-50">Deleted conversations are archived here. Restore any time.</p>
                  {loadingArchive ? <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 text-blue-500 animate-spin" /></div> :
                    archivedConvs.length === 0 ? <p className="text-sm text-gray-400 text-center py-8">No archived conversations</p> :
                    archivedConvs.map((c) => (
                      <div key={c.id ?? c.title} className="flex items-center justify-between px-5 py-3.5 border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-gray-800 font-medium truncate">{c.title}</p>
                          {c.deletedAt && <p className="text-xs text-gray-400 mt-0.5">Deleted {new Date(c.deletedAt).toLocaleDateString()}</p>}
                        </div>
                        <button onClick={() => handleRestore(c.id)} className="ml-3 flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 text-xs font-medium transition-colors">
                          <RotateCcw className="w-3 h-3" />Restore
                        </button>
                      </div>
                    ))}
                </div>
              )}

              {settingsTab === "storage" && (
                <div>
                  <div className="flex gap-2 p-4 border-b border-gray-100">
                    <button onClick={() => setStorageSubTab("files")} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${storageSubTab === "files" ? "bg-blue-50 text-blue-600 border border-blue-200" : "text-gray-500 border border-gray-200 hover:bg-gray-50"}`}>
                      <FileText className="w-3.5 h-3.5" />Files ({userFiles.filter((f) => f.fileType !== "image").length})
                    </button>
                    <button onClick={() => setStorageSubTab("images")} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${storageSubTab === "images" ? "bg-blue-50 text-blue-600 border border-blue-200" : "text-gray-500 border border-gray-200 hover:bg-gray-50"}`}>
                      <ImageIcon className="w-3.5 h-3.5" />Images ({userFiles.filter((f) => f.fileType === "image").length})
                    </button>
                  </div>
                  <div className="overflow-y-auto" style={{ maxHeight: "40vh" }}>
                    {loadingFiles ? <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 text-blue-500 animate-spin" /></div> :
                      (() => {
                        const filtered = userFiles.filter((f) => storageSubTab === "images" ? f.fileType === "image" : f.fileType !== "image");
                        return filtered.length === 0 ? <p className="text-sm text-gray-400 text-center py-8">No files uploaded yet</p> :
                          filtered.map((f) => (
                            <div key={f.id} className="flex items-center gap-3 px-5 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors">
                              {f.fileType === "image" ? <ImageIcon className="w-4 h-4 text-blue-500 flex-shrink-0" /> : <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />}
                              <div className="min-w-0 flex-1">
                                <p className="text-sm text-gray-800 truncate">{f.name}</p>
                                <p className="text-xs text-gray-400">{f.size ? `${(f.size / 1024).toFixed(1)} KB · ` : ""}{new Date(f.createdAt).toLocaleDateString()}</p>
                              </div>
                            </div>
                          ));
                      })()}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex-shrink-0 flex items-center gap-2 px-4 py-3.5 border-b border-gray-200 bg-white shadow-sm">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all" title="Open sidebar">
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-base sm:text-lg tracking-tight bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 bg-clip-text text-transparent">
            AMZ Navigator
          </h1>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto scrollbar-thin px-3 sm:px-4 py-4 sm:py-6 bg-[#f8fafc]">
          {messages.length === 0 && !loadingConv ? (
            <div className="flex flex-col items-center justify-center min-h-full gap-6 sm:gap-8 max-w-2xl mx-auto px-2 sm:px-0">
              <div className="text-center">
                <div className="relative inline-flex items-center justify-center mb-4 sm:mb-5">
                  <AnimatedOrb state="idle" size={72} />
                </div>
                <h2 className="text-2xl font-bold text-black">{greeting}</h2>
              </div>
              <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                {starters.map(({ icon, text }) => (
                  <button key={text} onClick={() => { handleSend(text); if (window.innerWidth < 1024) setSidebarOpen(false); }}
                    className="group flex items-start gap-2.5 sm:gap-3 bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-xl px-3.5 sm:px-4 py-3 sm:py-3.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md shadow-sm">
                    <span className="text-base sm:text-lg flex-shrink-0 mt-0.5">{icon}</span>
                    <span className="text-gray-600 group-hover:text-blue-700 text-xs leading-relaxed transition-colors font-medium">{text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : loadingConv ? (
            <div className="flex items-center justify-center h-full"><Loader2 className="w-6 h-6 text-blue-500 animate-spin" /></div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 message-animate ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                  {msg.role === "assistant" ? (
                    <AnimatedOrb state={msgToOrbState(msg)} size={36} />
                  ) : (
                    <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center bg-blue-600 shadow-md"><User className="w-4 h-4 text-white" /></div>
                  )}
                  <div className={`group flex flex-col max-w-[90%] sm:max-w-[78%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                    <div className={`rounded-2xl px-4 py-3 ${msg.role === "user" ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-tr-sm shadow-md" : "bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm"}`}>
                      {msg.role === "user" ? (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                      ) : msg.streaming && msg.content === "" ? (
                        <TypingDots />
                      ) : (
                        <div className="prose-chat-light text-sm">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}
                            components={{
                              a: ({ href, children, ...rest }) => <a href={href} target="_blank" rel="noopener noreferrer" {...rest}>{children}</a>,
                              img: ({ src, alt, ...rest }) => {
                                const href = typeof src === "string" ? src : undefined;
                                return <a href={href} target="_blank" rel="noopener noreferrer" className="block"><img src={href} alt={alt} style={{ maxWidth: "100%", borderRadius: "8px" }} {...rest} /></a>;
                              },
                            }}>
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                    {!msg.streaming && msg.content && msg.role === "assistant" && (
                      <div className="flex mt-1 opacity-0 group-hover:opacity-100 transition-opacity"><CopyBtn text={msg.content} /></div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="flex-shrink-0 px-3 sm:px-4 pb-3 sm:pb-4 pt-2.5 sm:pt-3 bg-white border-t border-gray-200">
          <div className="max-w-3xl mx-auto">
            {blockedState && (
              <div className="mb-3 rounded-xl border border-red-300 bg-red-50 px-4 py-3">
                <p className="text-sm font-semibold text-red-600">Message limit reached</p>
                <p className="text-xs text-red-500 mt-0.5">{blockedState.message}{countdown ? ` Resets in ${countdown}.` : ""}</p>
              </div>
            )}
            {pendingFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {pendingFiles.map((f, i) => (
                  <div key={i} className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 rounded-lg px-2.5 py-1 text-xs text-blue-700">
                    <Paperclip className="w-3 h-3" />
                    <span className="max-w-[120px] truncate">{f.name}</span>
                    <button onClick={() => setPendingFiles((prev) => prev.filter((_, j) => j !== i))} className="text-blue-400 hover:text-red-500 ml-0.5"><X className="w-3 h-3" /></button>
                  </div>
                ))}
              </div>
            )}
            <div className={`flex items-end gap-2.5 bg-gray-50 border rounded-2xl px-4 py-3 transition-all duration-200 ${blockedState ? "border-red-200 opacity-60" : "border-gray-200 focus-within:border-blue-400 focus-within:shadow-md focus-within:shadow-blue-500/10"}`}>
              <button onClick={() => fileRef.current?.click()} disabled={!!blockedState} title="Attach file"
                className="flex-shrink-0 p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all self-end mb-0.5 disabled:opacity-40 disabled:cursor-not-allowed">
                <Paperclip className="w-4 h-4" />
              </button>
              <input ref={fileRef} type="file" multiple className="hidden" onChange={(e) => { if (e.target.files) setPendingFiles((prev) => [...prev, ...Array.from(e.target.files!)]); }} />
              <textarea ref={textareaRef} value={input}
                onChange={(e) => { setInput(e.target.value); autoResize(); }}
                onKeyDown={onKey}
                placeholder={blockedState ? "Limit reached — come back when your window resets" : "Message AMZ Navigator…"}
                disabled={loading || !!blockedState} rows={1}
                className="flex-1 bg-transparent text-gray-800 placeholder-gray-400 resize-none outline-none text-sm leading-relaxed disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ maxHeight: "180px" }} />
              <button onClick={submit} disabled={!input.trim() || loading || !!blockedState}
                className="flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 hover:from-blue-500 hover:to-cyan-500 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 shadow-md shadow-blue-500/20 hover:shadow-blue-500/35 hover:-translate-y-0.5 active:translate-y-0 self-end">
                {loading ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" /> : <Send className="w-3.5 h-3.5 text-white" />}
              </button>
            </div>
            <p className="text-center text-[10px] text-gray-400 mt-2">AMZ Navigator is AI and can make mistakes. Please double-check responses.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
