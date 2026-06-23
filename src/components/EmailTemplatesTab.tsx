"use client";
import { useState } from "react";
import Link from "next/link";
import { deleteEmailTemplate, duplicateEmailTemplate } from "@/lib/actions/email-templates";
import { Plus, Search, Copy, Trash2, FileText } from "lucide-react";

interface Template {
  id: string;
  name: string;
  subject: string;
  category: string | null;
  updatedAt: Date;
}

const BASE_CATEGORIES = ["All", "Outreach", "Follow-up", "Promotional", "Introduction", "Newsletter", "Other"];

export function EmailTemplatesTab({ templates }: { templates: Template[] }) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const existingCats = Array.from(new Set(templates.map(t => t.category).filter(Boolean) as string[]));
  const allCategories = ["All", ...Array.from(new Set([...existingCats, ...BASE_CATEGORIES.slice(1)]))];

  const filtered = templates.filter(t =>
    (categoryFilter === "All" || t.category === categoryFilter) &&
    (t.name.toLowerCase().includes(search.toLowerCase()) || t.subject.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="relative max-w-sm flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search templates…"
            className="input w-full pl-9 text-sm" />
        </div>
        <div className="flex items-center gap-2">
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="input text-sm">
            {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <Link href="/email/templates/new" className="btn-primary flex items-center gap-1.5 text-sm">
            <Plus size={14} /> New Template
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--border)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--accent-soft)] text-xs uppercase tracking-wide text-[var(--muted)]">
            <tr>
              <th className="px-4 py-2.5 text-left">Name</th>
              <th className="px-4 py-2.5 text-left">Subject</th>
              <th className="px-4 py-2.5 text-left">Category</th>
              <th className="px-4 py-2.5 text-left">Last edited</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-[var(--muted)]">
                  <FileText size={28} className="mx-auto mb-2 opacity-40" />
                  {templates.length === 0
                    ? "No templates yet. Click \"New Template\" to create one."
                    : "No templates match your search."}
                </td>
              </tr>
            )}
            {filtered.map(t => (
              <tr key={t.id} className="hover:bg-[var(--accent-soft)]/40">
                <td className="px-4 py-3 font-medium">
                  <Link href={`/email/templates/${t.id}`}
                    className="text-[var(--foreground)] hover:text-[var(--accent)]">{t.name}</Link>
                </td>
                <td className="px-4 py-3 max-w-xs truncate text-[var(--muted)]">
                  {t.subject || <span className="italic opacity-50">No subject</span>}
                </td>
                <td className="px-4 py-3">
                  {t.category && (
                    <span className="rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-xs text-[var(--accent)]">
                      {t.category}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-[var(--muted)]">
                  {new Date(t.updatedAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <form action={duplicateEmailTemplate.bind(null, t.id)}>
                      <button type="submit" title="Duplicate"
                        className="rounded p-1.5 text-[var(--muted)] hover:bg-[var(--accent-soft)]">
                        <Copy size={13} />
                      </button>
                    </form>
                    <form action={deleteEmailTemplate.bind(null, t.id)}>
                      <button type="submit" title="Delete"
                        className="rounded p-1.5 text-red-400 hover:bg-red-500/10">
                        <Trash2 size={13} />
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
