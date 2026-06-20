"use client";

import { useState, useTransition } from "react";
import {
  Plus, Trash2, Copy, Mail, Search, X, Eye, Edit3,
  LayoutGrid, List, Tag, Clock, ChevronRight, Sparkles,
  FileText, Send,
} from "lucide-react";
import { createEmailTemplate, deleteEmailTemplate } from "@/lib/actions/contactNotes";
import { DeleteConfirmModal } from "@/components/DeleteConfirmModal";

type Template = { id: string; name: string; subject: string; body: string };

const CATEGORIES = ["All", "Outreach", "Follow-up", "Promotional", "Introduction", "Other"] as const;
type Category = typeof CATEGORIES[number];

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Outreach:     { bg: "#EFF6FF", text: "#2563EB", border: "#BFDBFE" },
  "Follow-up":  { bg: "#F0FDF4", text: "#16A34A", border: "#BBF7D0" },
  Promotional:  { bg: "#FFF7ED", text: "#EA580C", border: "#FED7AA" },
  Introduction: { bg: "#FAF5FF", text: "#9333EA", border: "#E9D5FF" },
  Other:        { bg: "#F8FAFC", text: "#64748B", border: "#E2E8F0" },
};

const MERGE_VARS = ["{{firstName}}", "{{companyName}}", "{{email}}", "{{senderName}}", "{{website}}", "{{phone}}"];

function guessCategory(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("follow") || n.includes("followup")) return "Follow-up";
  if (n.includes("promo") || n.includes("campaign")) return "Promotional";
  if (n.includes("intro")) return "Introduction";
  if (n.includes("outreach") || n.includes("initial") || n.includes("first")) return "Outreach";
  return "Other";
}

function templateHeaderColor(id: string) {
  const colors = ["#3B82F6","#8B5CF6","#10B981","#F59E0B","#EC4899","#0E90C8","#EF4444","#6366F1"];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) & 0xFFFFFF;
  return colors[Math.abs(hash) % colors.length];
}

export function EmailTemplatesTab({ templates }: { templates: Template[] }) {
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Template | null>(null);
  const [preview, setPreview] = useState<Template | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [createTab, setCreateTab] = useState<"compose" | "html">("compose");
  const [pending, startTransition] = useTransition();

  // Create/edit form state
  const [formName, setFormName] = useState("");
  const [formSubject, setFormSubject] = useState("");
  const [formBody, setFormBody] = useState("");
  const [formCategory, setFormCategory] = useState<string>("Outreach");

  function openCreate() {
    setFormName(""); setFormSubject(""); setFormBody(""); setFormCategory("Outreach");
    setEditing(null); setShowCreate(true); setCreateTab("compose");
  }

  function openEdit(t: Template) {
    setFormName(t.name); setFormSubject(t.subject); setFormBody(t.body);
    setFormCategory(guessCategory(t.name));
    setEditing(t); setShowCreate(true); setCreateTab("compose");
  }

  function handleSave() {
    const fd = new FormData();
    fd.set("name", formName);
    fd.set("subject", formSubject);
    fd.set("body", formBody);
    startTransition(async () => {
      await createEmailTemplate(fd);
      setShowCreate(false);
    });
  }

  function insertMergeVar(v: string) {
    setFormBody((b) => b + v);
  }

  const filtered = templates.filter((t) => {
    const cat = guessCategory(t.name);
    if (activeCategory !== "All" && cat !== activeCategory) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase()) && !t.subject.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex flex-col gap-0" style={{ minHeight: 0 }}>
      {/* Header bar */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Email Templates</h1>
          <p className="text-sm text-[var(--muted)] mt-0.5">{templates.length} template{templates.length !== 1 ? "s" : ""} · Reuse across campaigns and sequences</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/25 hover:from-blue-500 hover:to-blue-400 transition">
          <Plus size={15} /> New Template
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex items-center justify-between gap-3 mb-5">
        {/* Category tabs */}
        <div className="flex items-center gap-1 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {CATEGORIES.map((cat) => {
            const count = cat === "All" ? templates.length : templates.filter((t) => guessCategory(t.name) === cat).length;
            return (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition ${activeCategory === cat ? "bg-blue-600 text-white shadow-sm" : "text-[var(--muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--foreground)]"}`}>
                {cat}
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${activeCategory === cat ? "bg-white/20 text-white" : "bg-[var(--accent-soft)] text-[var(--muted)]"}`}>{count}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Search */}
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search templates…"
              className="input pl-9 pr-3 py-1.5 text-sm w-48" />
            {search && <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--foreground)]"><X size={12} /></button>}
          </div>
          {/* View toggle */}
          <div className="flex items-center rounded-lg border border-[var(--border)] overflow-hidden">
            <button onClick={() => setViewMode("grid")} className={`p-2 transition ${viewMode === "grid" ? "bg-blue-50 text-blue-600" : "text-[var(--muted)] hover:bg-[var(--accent-soft)]"}`}><LayoutGrid size={14} /></button>
            <button onClick={() => setViewMode("list")} className={`p-2 transition ${viewMode === "list" ? "bg-blue-50 text-blue-600" : "text-[var(--muted)] hover:bg-[var(--accent-soft)]"}`}><List size={14} /></button>
          </div>
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-[var(--border)] py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
            <Mail size={24} className="text-blue-400" />
          </div>
          <div>
            <p className="font-semibold text-[var(--foreground)]">{search ? "No templates match your search" : "No templates yet"}</p>
            <p className="mt-1 text-sm text-[var(--muted)]">{search ? "Try a different keyword" : "Create reusable email templates to speed up your outreach."}</p>
          </div>
          {!search && (
            <button onClick={openCreate} className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 transition">
              <Plus size={14} /> Create your first template
            </button>
          )}
        </div>
      )}

      {/* Grid view */}
      {viewMode === "grid" && filtered.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => {
            const cat = guessCategory(t.name);
            const catStyle = CATEGORY_COLORS[cat] ?? CATEGORY_COLORS.Other;
            const headerColor = templateHeaderColor(t.id);
            return (
              <div key={t.id} className="group flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                {/* Colored header preview */}
                <div style={{ background: `${headerColor}15`, borderBottom: `3px solid ${headerColor}`, padding: "16px 16px 12px", position: "relative" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: headerColor, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Mail size={14} style={{ color: "white" }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</div>
                    </div>
                    <button onClick={() => setDeleteId(t.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity rounded-lg p-1 hover:bg-red-50 text-[var(--muted)] hover:text-red-500">
                      <Trash2 size={13} />
                    </button>
                  </div>
                  {/* Fake email lines */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{ height: 8, borderRadius: 4, background: `${headerColor}40`, width: "90%" }} />
                    <div style={{ height: 6, borderRadius: 4, background: `${headerColor}25`, width: "70%" }} />
                    <div style={{ height: 6, borderRadius: 4, background: `${headerColor}25`, width: "80%" }} />
                  </div>
                </div>

                {/* Card body */}
                <div className="flex flex-col gap-2 p-4 flex-1">
                  <div className="flex items-center gap-2">
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: catStyle.bg, color: catStyle.text, border: `1px solid ${catStyle.border}`, borderRadius: 999, padding: "2px 8px", fontSize: 10, fontWeight: 600 }}>
                      <Tag size={9} />{cat}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--muted)] flex items-start gap-1.5 mt-1">
                    <Send size={10} className="mt-0.5 shrink-0 text-[var(--muted)]" />
                    <span className="truncate">{t.subject}</span>
                  </p>
                  <p className="text-xs text-[var(--foreground)] opacity-60 line-clamp-2 mt-1">{t.body}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 border-t border-[var(--border)] px-4 py-2.5">
                  <button onClick={() => setPreview(t)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium text-[var(--muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--foreground)] transition">
                    <Eye size={12} /> Preview
                  </button>
                  <div className="w-px h-4 bg-[var(--border)]" />
                  <button onClick={() => openEdit(t)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium text-[var(--muted)] hover:bg-blue-50 hover:text-blue-600 transition">
                    <Edit3 size={12} /> Edit
                  </button>
                  <div className="w-px h-4 bg-[var(--border)]" />
                  <button onClick={() => { setFormName(t.name + " (copy)"); setFormSubject(t.subject); setFormBody(t.body); setFormCategory(guessCategory(t.name)); setEditing(null); setShowCreate(true); }}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium text-[var(--muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--foreground)] transition">
                    <Copy size={12} /> Duplicate
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List view */}
      {viewMode === "list" && filtered.length > 0 && (
        <div className="rounded-xl border border-[var(--border)] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--accent-soft)]/50">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Subject</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Category</th>
                <th className="w-32 px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => {
                const cat = guessCategory(t.name);
                const catStyle = CATEGORY_COLORS[cat] ?? CATEGORY_COLORS.Other;
                const headerColor = templateHeaderColor(t.id);
                return (
                  <tr key={t.id} className="group border-b border-[var(--border)] hover:bg-[var(--accent-soft)]/40 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div style={{ width: 30, height: 30, borderRadius: 7, background: `${headerColor}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Mail size={13} style={{ color: headerColor }} />
                        </div>
                        <span className="font-medium text-sm text-[var(--foreground)] truncate max-w-xs">{t.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--muted)] truncate max-w-xs">{t.subject}</td>
                    <td className="px-4 py-3">
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: catStyle.bg, color: catStyle.text, border: `1px solid ${catStyle.border}`, borderRadius: 999, padding: "2px 8px", fontSize: 10, fontWeight: 600 }}>
                        {cat}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setPreview(t)} className="rounded-lg p-1.5 text-[var(--muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--foreground)]"><Eye size={13} /></button>
                        <button onClick={() => openEdit(t)} className="rounded-lg p-1.5 text-[var(--muted)] hover:bg-blue-50 hover:text-blue-600"><Edit3 size={13} /></button>
                        <button onClick={() => setDeleteId(t.id)} className="rounded-lg p-1.5 text-[var(--muted)] hover:bg-red-50 hover:text-red-500"><Trash2 size={13} /></button>
                        <ChevronRight size={13} className="text-[var(--muted)]" />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Create / Edit Modal ── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto p-6">
          <div className="w-full max-w-2xl rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl mt-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                  <FileText size={15} className="text-blue-600" />
                </div>
                <h2 className="text-base font-semibold text-[var(--foreground)]">{editing ? "Edit Template" : "New Email Template"}</h2>
              </div>
              <button onClick={() => setShowCreate(false)} className="rounded-lg p-1.5 text-[var(--muted)] hover:bg-[var(--accent-soft)]"><X size={16} /></button>
            </div>

            <div className="p-6 flex flex-col gap-4">
              {/* Name + Category row */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="mb-1.5 block text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Template name</label>
                  <input value={formName} onChange={(e) => setFormName(e.target.value)} className="input w-full" placeholder="e.g. Initial Wholesale Outreach" />
                </div>
                <div className="w-44">
                  <label className="mb-1.5 block text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Category</label>
                  <select value={formCategory} onChange={(e) => setFormCategory(e.target.value)} className="input w-full bg-[var(--surface)]">
                    {CATEGORIES.filter((c) => c !== "All").map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Subject line</label>
                <input value={formSubject} onChange={(e) => setFormSubject(e.target.value)} className="input w-full"
                  placeholder="e.g. Partnership opportunity for {{companyName}}" />
              </div>

              {/* Body tabs */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Body</label>
                  <div className="flex rounded-lg border border-[var(--border)] overflow-hidden text-xs">
                    <button onClick={() => setCreateTab("compose")} className={`px-3 py-1 font-medium transition ${createTab === "compose" ? "bg-blue-600 text-white" : "text-[var(--muted)] hover:bg-[var(--accent-soft)]"}`}>Compose</button>
                    <button onClick={() => setCreateTab("html")} className={`px-3 py-1 font-medium transition ${createTab === "html" ? "bg-blue-600 text-white" : "text-[var(--muted)] hover:bg-[var(--accent-soft)]"}`}>HTML</button>
                  </div>
                </div>
                <textarea value={formBody} onChange={(e) => setFormBody(e.target.value)} rows={10}
                  style={{ fontFamily: createTab === "html" ? "monospace" : "inherit", fontSize: createTab === "html" ? 12 : 13 }}
                  className="input w-full resize-y"
                  placeholder={createTab === "html" ? "<p>Hi {{firstName}},</p>\n<p>I'm reaching out about...</p>" : "Hi {{firstName}},\n\nI'm reaching out to discuss a potential partnership with {{companyName}}…"} />
              </div>

              {/* Merge vars */}
              <div>
                <p className="mb-2 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Merge variables</p>
                <div className="flex flex-wrap gap-1.5">
                  {MERGE_VARS.map((v) => (
                    <button key={v} onClick={() => insertMergeVar(v)}
                      className="flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--accent-soft)] px-2.5 py-1 text-xs font-mono text-[var(--foreground)] hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition">
                      <Sparkles size={10} /> {v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview banner */}
              {formBody && (
                <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3">
                  <p className="mb-1 text-xs font-semibold text-blue-600 flex items-center gap-1.5"><Eye size={11} /> Preview</p>
                  <p className="text-xs text-[var(--foreground)] opacity-80 line-clamp-3">{formBody.replace(/<[^>]+>/g, "")}</p>
                </div>
              )}

              <div className="flex justify-end gap-2 border-t border-[var(--border)] pt-4">
                <button onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
                <button onClick={handleSave} disabled={pending || !formName || !formSubject || !formBody}
                  className="btn-primary flex items-center gap-2 disabled:opacity-40">
                  <Send size={14} /> {pending ? "Saving…" : editing ? "Update Template" : "Save Template"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Preview Modal ── */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6">
          <div className="w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl overflow-hidden">
            {/* Colored top */}
            <div style={{ background: templateHeaderColor(preview.id), padding: "20px 24px 16px" }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
                    <Mail size={15} className="text-white" />
                  </div>
                  <span className="font-semibold text-white">{preview.name}</span>
                </div>
                <button onClick={() => setPreview(null)} className="rounded-lg p-1.5 bg-white/10 text-white hover:bg-white/20"><X size={15} /></button>
              </div>
            </div>
            <div className="p-5 flex flex-col gap-3">
              <div className="flex items-start gap-2 text-sm">
                <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider w-16 shrink-0 mt-0.5">Subject</span>
                <span className="text-[var(--foreground)] font-medium">{preview.subject}</span>
              </div>
              <div className="h-px bg-[var(--border)]" />
              <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4 text-sm text-[var(--foreground)] whitespace-pre-wrap max-h-72 overflow-y-auto leading-relaxed">
                {preview.body}
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => { openEdit(preview); setPreview(null); }} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] py-2 text-sm text-[var(--muted)] hover:bg-blue-50 hover:text-blue-600 transition">
                  <Edit3 size={13} /> Edit
                </button>
                <button onClick={() => setPreview(null)} className="flex flex-1 items-center justify-center rounded-xl border border-[var(--border)] py-2 text-sm text-[var(--muted)] hover:bg-[var(--accent-soft)] transition">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirm ── */}
      {deleteId && (
        <DeleteConfirmModal
          title={`Delete "${templates.find((t) => t.id === deleteId)?.name ?? "template"}"?`}
          description="This template will be permanently deleted and cannot be recovered."
          onConfirm={() => { startTransition(async () => { await deleteEmailTemplate(deleteId); setDeleteId(null); }); }}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}
