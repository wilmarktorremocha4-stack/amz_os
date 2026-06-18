"use client";

import { useState, useTransition } from "react";
import { Trash2, Tag, X } from "lucide-react";
import { bulkDeleteSuppliers, bulkAddTag, bulkRemoveTag } from "@/lib/actions/suppliers";

type Contact = {
  id: string;
  companyName: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  createdAt: string;
  tags: { id: string; name: string; color: string }[];
};

type Tag = { id: string; name: string; color: string };

export function ContactsTable({
  contacts,
  allTags,
}: {
  contacts: Contact[];
  allTags: Tag[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [showTagPicker, setShowTagPicker] = useState<"add" | "remove" | null>(null);
  const [, startTransition] = useTransition();

  const allSelected = contacts.length > 0 && selected.size === contacts.length;

  function toggleAll() {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(contacts.map((c) => c.id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleBulkDelete() {
    if (deleteInput !== "DELETE") return;
    startTransition(async () => {
      await bulkDeleteSuppliers(Array.from(selected));
      setSelected(new Set());
      setDeleteConfirm(false);
      setDeleteInput("");
    });
  }

  function handleAddTag(tagId: string) {
    startTransition(async () => {
      await bulkAddTag(Array.from(selected), tagId);
      setShowTagPicker(null);
    });
  }

  function handleRemoveTag(tagId: string) {
    startTransition(async () => {
      await bulkRemoveTag(Array.from(selected), tagId);
      setShowTagPicker(null);
    });
  }

  const initials = (name: string) =>
    name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");

  return (
    <div className="flex flex-col gap-3">
      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2.5">
          <span className="text-sm font-medium text-blue-400">
            {selected.size} selected
          </span>
          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setShowTagPicker(showTagPicker === "add" ? null : "add")}
                className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--foreground)] hover:bg-[var(--accent-soft)]">
                <Tag size={12} /> Add tag
              </button>
              {showTagPicker === "add" && (
                <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1.5 shadow-lg">
                  {allTags.map((tag) => (
                    <button key={tag.id} onClick={() => handleAddTag(tag.id)}
                      className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-[var(--accent-soft)]">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: tag.color }} />
                      {tag.name}
                    </button>
                  ))}
                  {allTags.length === 0 && <p className="px-2 py-1 text-xs text-[var(--muted)]">No tags</p>}
                </div>
              )}
            </div>
            <div className="relative">
              <button
                onClick={() => setShowTagPicker(showTagPicker === "remove" ? null : "remove")}
                className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--foreground)] hover:bg-[var(--accent-soft)]">
                <X size={12} /> Remove tag
              </button>
              {showTagPicker === "remove" && (
                <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1.5 shadow-lg">
                  {allTags.map((tag) => (
                    <button key={tag.id} onClick={() => handleRemoveTag(tag.id)}
                      className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-[var(--accent-soft)]">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: tag.color }} />
                      {tag.name}
                    </button>
                  ))}
                  {allTags.length === 0 && <p className="px-2 py-1 text-xs text-[var(--muted)]">No tags</p>}
                </div>
              )}
            </div>
            <button
              onClick={() => setDeleteConfirm(true)}
              className="flex items-center gap-1.5 rounded-lg bg-red-600/90 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600">
              <Trash2 size={12} /> Delete
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-[var(--border)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--accent-soft)] text-left text-xs font-medium text-[var(--muted)]">
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="rounded border-[var(--border)] accent-blue-500"
                />
              </th>
              <th className="px-4 py-3">Contact name</th>
              <th className="hidden px-4 py-3 sm:table-cell">Phone</th>
              <th className="hidden px-4 py-3 md:table-cell">Email</th>
              <th className="hidden px-4 py-3 lg:table-cell">Business name</th>
              <th className="hidden px-4 py-3 xl:table-cell">Created</th>
              <th className="px-4 py-3">Tags</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {contacts.map((c) => (
              <tr
                key={c.id}
                className={`transition-colors hover:bg-[var(--accent-soft)] ${selected.has(c.id) ? "bg-blue-500/5" : ""}`}>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selected.has(c.id)}
                    onChange={() => toggleOne(c.id)}
                    className="rounded border-[var(--border)] accent-blue-500"
                  />
                </td>
                <td className="px-4 py-3">
                  <a href={`/crm/${c.id}`} className="flex items-center gap-2.5 hover:text-blue-500">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
                      {initials(c.companyName)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-[var(--foreground)] truncate">
                        {c.contactName ?? c.companyName}
                      </div>
                    </div>
                  </a>
                </td>
                <td className="hidden px-4 py-3 text-[var(--muted)] sm:table-cell">{c.phone ?? "—"}</td>
                <td className="hidden px-4 py-3 text-[var(--muted)] md:table-cell truncate max-w-[180px]">{c.email ?? "—"}</td>
                <td className="hidden px-4 py-3 text-[var(--muted)] lg:table-cell">{c.companyName}</td>
                <td className="hidden px-4 py-3 text-[var(--muted)] xl:table-cell">
                  {new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {c.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag.id}
                        className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                        style={{ backgroundColor: tag.color + "20", color: tag.color, border: `1px solid ${tag.color}40` }}>
                        {tag.name}
                      </span>
                    ))}
                    {c.tags.length > 2 && (
                      <span className="rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-[10px] text-[var(--muted)]">
                        +{c.tags.length - 2}
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete confirm modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl">
            <h2 className="mb-1 text-base font-semibold text-[var(--foreground)]">
              Delete {selected.size} contact{selected.size !== 1 ? "s" : ""}?
            </h2>
            <p className="text-sm text-[var(--muted)]">
              This is permanent. Type{" "}
              <span className="font-mono font-bold text-red-500">DELETE</span> to confirm.
            </p>
            <input
              autoFocus
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder="DELETE"
              className="input mt-3 w-full font-mono"
            />
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => { setDeleteConfirm(false); setDeleteInput(""); }}
                className="flex-1 rounded-xl border border-[var(--border)] py-2 text-sm text-[var(--muted)]">
                Cancel
              </button>
              <button
                disabled={deleteInput !== "DELETE"}
                onClick={handleBulkDelete}
                className="flex-1 rounded-xl bg-red-600 py-2 text-sm font-semibold text-white disabled:opacity-40">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
