"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, Copy, Mail } from "lucide-react";
import { createEmailTemplate, deleteEmailTemplate } from "@/lib/actions/contactNotes";

type Template = { id: string; name: string; subject: string; body: string };

export function EmailTemplatesTab({ templates }: { templates: Template[] }) {
  const [showForm, setShowForm] = useState(false);
  const [preview, setPreview] = useState<Template | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteInput, setDeleteInput] = useState("");
  const [pending, startTransition] = useTransition();

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await createEmailTemplate(fd);
      setShowForm(false);
    });
  }

  function handleDelete() {
    if (!deleteId || deleteInput !== "DELETE") return;
    startTransition(async () => {
      await deleteEmailTemplate(deleteId);
      setDeleteId(null);
      setDeleteInput("");
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--muted)]">
          {templates.length} template{templates.length !== 1 ? "s" : ""} — reuse these when emailing contacts
        </p>
        <button onClick={() => setShowForm(true)} className="btn-primary whitespace-nowrap">
          <Plus size={14} />
          New template
        </button>
      </div>

      {/* Create form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl">
            <h2 className="mb-4 text-base font-semibold text-[var(--foreground)]">New email template</h2>
            <form onSubmit={handleCreate} className="flex flex-col gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Template name</label>
                <input name="name" placeholder="e.g. Initial outreach" required className="input w-full" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Subject line</label>
                <input name="subject" placeholder="e.g. Wholesale inquiry — {Company Name}" required className="input w-full" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Body</label>
                <textarea name="body" rows={8} required placeholder="Hi there,&#10;&#10;I'm reaching out regarding…" className="input w-full resize-none" />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 rounded-xl border border-[var(--border)] py-2.5 text-sm text-[var(--muted)] hover:bg-[var(--accent-soft)]">
                  Cancel
                </button>
                <button type="submit" disabled={pending} className="flex-1 btn-primary disabled:opacity-50">
                  {pending ? "Saving…" : "Save template"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview modal */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-[var(--foreground)]">{preview.name}</h2>
              <button onClick={() => setPreview(null)} className="text-[var(--muted)] hover:text-[var(--foreground)]">✕</button>
            </div>
            <div className="mb-2">
              <span className="text-xs font-medium text-[var(--muted)]">Subject: </span>
              <span className="text-sm text-[var(--foreground)]">{preview.subject}</span>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4 text-sm text-[var(--foreground)] whitespace-pre-wrap max-h-72 overflow-y-auto">
              {preview.body}
            </div>
            <button onClick={() => setPreview(null)} className="mt-4 w-full rounded-xl border border-[var(--border)] py-2 text-sm text-[var(--muted)] hover:bg-[var(--accent-soft)]">
              Close
            </button>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl">
            <h2 className="mb-1 text-base font-semibold text-[var(--foreground)]">Delete template?</h2>
            <p className="text-sm text-[var(--muted)]">
              Type <span className="font-mono font-bold text-red-500">DELETE</span> to confirm.
            </p>
            <input autoFocus value={deleteInput} onChange={(e) => setDeleteInput(e.target.value)}
              placeholder="DELETE" className="input mt-3 w-full font-mono" />
            <div className="mt-4 flex gap-2">
              <button onClick={() => { setDeleteId(null); setDeleteInput(""); }}
                className="flex-1 rounded-xl border border-[var(--border)] py-2 text-sm text-[var(--muted)]">
                Cancel
              </button>
              <button disabled={deleteInput !== "DELETE" || pending} onClick={handleDelete}
                className="flex-1 rounded-xl bg-red-600 py-2 text-sm font-semibold text-white disabled:opacity-40">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      {templates.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[var(--border)] p-16 text-center">
          <Mail size={32} className="text-[var(--muted)]" />
          <div>
            <p className="font-medium text-[var(--foreground)]">No templates yet</p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Create reusable email templates to send to your contacts faster.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <div key={t.id}
              className="group flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <div className="mb-1 flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400">
                    <Mail size={14} />
                  </div>
                  <span className="font-medium text-[var(--foreground)] text-sm truncate">{t.name}</span>
                </div>
                <button onClick={() => setDeleteId(t.id)}
                  className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-[var(--muted)] hover:text-red-500">
                  <Trash2 size={14} />
                </button>
              </div>
              <p className="mt-1 text-xs text-[var(--muted)] truncate">Subject: {t.subject}</p>
              <p className="mt-2 line-clamp-3 text-xs text-[var(--foreground)] opacity-70">{t.body}</p>
              <button onClick={() => setPreview(t)}
                className="mt-3 rounded-lg border border-[var(--border)] py-1.5 text-xs text-[var(--muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--foreground)] transition-colors">
                Preview
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
