"use client";

import { useState, useTransition } from "react";
import { Plus, Send, Trash2, Mail, BarChart3, ChevronDown, Users, X, CheckSquare } from "lucide-react";
import { createCampaign, updateCampaign, deleteCampaign, sendCampaign } from "@/lib/actions/email-campaigns";
import { DeleteConfirmModal } from "@/components/DeleteConfirmModal";
import { EmailBuilderRoot } from "@/components/email-builder/EmailBuilderRoot";
import { EmailDoc, DEFAULT_DOC } from "@/lib/email-builder";
import type { MergeVariable } from "@/lib/merge-variables";

type Stats = { total: number; sent: number; opened: number; clicked: number; bounced: number };
type Campaign = {
  id: string; name: string; subject: string; bodyJson: EmailDoc;
  status: string; sentAt: Date | null; createdAt: Date; stats: Stats;
};
type Supplier = { id: string; companyName: string; email: string | null };
type Template = { id: string; name: string; bodyJson: EmailDoc };

export function CampaignsClient({ campaigns, suppliers, templates = [], mergeVariables = [] }: {
  campaigns: Campaign[]; suppliers: Supplier[];
  templates?: Template[]; mergeVariables?: MergeVariable[];
}) {
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [sending, setSending] = useState<Campaign | null>(null);
  const [doc, setDoc] = useState<EmailDoc>(DEFAULT_DOC);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [html, setHtml] = useState("");
  const [loadTemplateId, setLoadTemplateId] = useState("");
  const [pending, startTransition] = useTransition();

  function openCreate() { setDoc(DEFAULT_DOC); setName(""); setSubject(""); setCreating(true); }
  function openEdit(c: Campaign) { setDoc(c.bodyJson); setName(c.name); setSubject(c.subject); setEditing(c); }

  function handleCreate() {
    const fd = new FormData();
    fd.set("name", name);
    fd.set("subject", subject);
    fd.set("bodyJson", JSON.stringify(doc));
    startTransition(async () => { await createCampaign(fd); setCreating(false); });
  }

  function handleUpdate() {
    if (!editing) return;
    startTransition(async () => {
      await updateCampaign(editing.id, { name, subject, bodyJson: doc });
      setEditing(null);
    });
  }

  function handleSend() {
    if (!sending) return;
    const ids = [...selectedIds];
    startTransition(async () => {
      await sendCampaign(sending.id, ids);
      setSending(null);
      setSelectedIds(new Set());
    });
  }

  const withEmail = suppliers.filter((s) => s.email);

  return (
    <main className="flex flex-1 flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">Campaigns</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">Create and send email campaigns to your contacts.</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus size={15} /> New Campaign
        </button>
      </div>

      {/* Campaign list */}
      <div className="flex flex-col gap-3">
        {campaigns.length === 0 && (
          <div className="card rounded-xl border-dashed p-10 text-center">
            <Mail size={32} className="mx-auto mb-3 text-[var(--muted)]" />
            <p className="font-medium text-[var(--foreground)]">No campaigns yet</p>
            <p className="mt-1 text-sm text-[var(--muted)]">Create your first campaign to start reaching out at scale.</p>
          </div>
        )}
        {campaigns.map((c) => (
          <div key={c.id} className="card flex items-center justify-between gap-4 p-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[var(--foreground)] truncate">{c.name}</span>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  c.status === "sent" ? "bg-emerald-100 text-emerald-700" :
                  c.status === "sending" ? "bg-blue-100 text-blue-700" :
                  "bg-[var(--accent-soft)] text-[var(--muted)]"
                }`}>{c.status}</span>
              </div>
              <p className="mt-0.5 truncate text-xs text-[var(--muted)]">Subject: {c.subject}</p>
              {c.stats.total > 0 && (
                <div className="mt-2 flex items-center gap-4 text-xs text-[var(--muted)]">
                  <span className="flex items-center gap-1"><Users size={11} />{c.stats.total} recipients</span>
                  <span>{c.stats.sent > 0 ? Math.round((c.stats.opened / c.stats.sent) * 100) : 0}% open rate</span>
                  <span>{c.stats.sent > 0 ? Math.round((c.stats.clicked / c.stats.sent) * 100) : 0}% click rate</span>
                  {c.stats.bounced > 0 && <span className="text-red-500">{c.stats.bounced} bounced</span>}
                </div>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button onClick={() => openEdit(c)} className="btn-secondary px-3 py-1.5 text-xs">Edit</button>
              {c.status === "draft" && (
                <button onClick={() => { setSending(c); setSelectedIds(new Set(withEmail.map((s) => s.id))); }}
                  className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500">
                  <Send size={12} /> Send
                </button>
              )}
              <button onClick={() => setDeleteConfirmId(c.id)}
                className="rounded-lg p-1.5 text-red-400 hover:bg-red-50 transition"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>

      {/* Create / Edit modal */}
      {(creating || editing) && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm overflow-y-auto p-6">
          <div className="w-full max-w-3xl rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
              <h2 className="text-lg font-semibold text-[var(--foreground)]">{editing ? "Edit Campaign" : "New Campaign"}</h2>
              <button onClick={() => { setCreating(false); setEditing(null); }} className="text-[var(--muted)] hover:text-[var(--foreground)]"><X size={18} /></button>
            </div>
            <div className="flex flex-col gap-4 p-6">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Campaign name</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} className="input w-full" placeholder="Q2 Wholesale Outreach" />
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Subject line</label>
                  <input value={subject} onChange={(e) => setSubject(e.target.value)} className="input w-full" placeholder="Partnership opportunity with {{companyName}}" />
                </div>
              </div>
              {templates.length > 0 && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Load from template</label>
                  <select value={loadTemplateId} onChange={e => {
                    const tpl = templates.find(t => t.id === e.target.value);
                    if (tpl) { setDoc(JSON.parse(JSON.stringify(tpl.bodyJson))); }
                    setLoadTemplateId(e.target.value);
                  }} className="input w-full text-sm">
                    <option value="">— Select a template —</option>
                    {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="mb-2 block text-xs font-medium text-[var(--muted)]">Email body</label>
                <div className="h-[520px] overflow-hidden rounded-xl border border-[var(--border)]">
                  <EmailBuilderRoot doc={doc} onChange={setDoc} onHtmlChange={setHtml} mergeVariables={mergeVariables} />
                </div>
              </div>
              <div className="flex justify-end gap-2 border-t border-[var(--border)] pt-4">
                <button onClick={() => { setCreating(false); setEditing(null); }} className="btn-secondary">Cancel</button>
                <button onClick={editing ? handleUpdate : handleCreate} disabled={pending || !name || !subject}
                  className="btn-primary disabled:opacity-50">{pending ? "Saving…" : "Save Campaign"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Send modal */}
      {deleteConfirmId && (
        <DeleteConfirmModal
          title={`Delete "${campaigns.find((x) => x.id === deleteConfirmId)?.name ?? "campaign"}"?`}
          description="This campaign and all its stats will be permanently deleted."
          onConfirm={() => { startTransition(() => deleteCampaign(deleteConfirmId)); setDeleteConfirmId(null); }}
          onCancel={() => setDeleteConfirmId(null)}
        />
      )}

      {sending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-6">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Send: {sending.name}</h2>
              <button onClick={() => setSending(null)}><X size={18} /></button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[var(--foreground)]">Select recipients ({selectedIds.size} of {withEmail.length})</span>
                <button type="button" className="text-xs text-blue-500"
                  onClick={() => setSelectedIds(selectedIds.size === withEmail.length ? new Set() : new Set(withEmail.map((s) => s.id)))}>
                  {selectedIds.size === withEmail.length ? "Deselect all" : "Select all"}
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto flex flex-col gap-1 rounded-xl border border-[var(--border)] p-2">
                {withEmail.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-[var(--accent-soft)] cursor-pointer">
                    <input type="checkbox" checked={selectedIds.has(s.id)}
                      onChange={(e) => setSelectedIds((prev) => { const n = new Set(prev); e.target.checked ? n.add(s.id) : n.delete(s.id); return n; })}
                      className="rounded" />
                    <span className="flex-1 text-sm text-[var(--foreground)] truncate">{s.companyName}</span>
                    <span className="text-xs text-[var(--muted)] truncate">{s.email}</span>
                  </label>
                ))}
              </div>
              {withEmail.length === 0 && <p className="text-sm text-[var(--muted)]">No contacts with email addresses.</p>}
              <div className="flex justify-end gap-2 border-t border-[var(--border)] pt-4">
                <button onClick={() => setSending(null)} className="btn-secondary">Cancel</button>
                <button onClick={handleSend} disabled={pending || selectedIds.size === 0}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50">
                  <Send size={14} />{pending ? "Sending…" : `Send to ${selectedIds.size} contacts`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
