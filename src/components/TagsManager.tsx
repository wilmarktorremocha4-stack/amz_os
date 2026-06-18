"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { createTag, deleteTag } from "@/lib/actions/tags";

const TAG_COLORS = [
  "#3b82f6", "#8b5cf6", "#06b6d4", "#10b981",
  "#f59e0b", "#ef4444", "#ec4899", "#6366f1",
];

type Tag = { id: string; name: string; color: string };

export function TagsManager({ tags }: { tags: Tag[] }) {
  const [showForm, setShowForm] = useState(false);
  const [selectedColor, setSelectedColor] = useState(TAG_COLORS[0]);
  const [pending, startTransition] = useTransition();

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("color", selectedColor);
    startTransition(async () => {
      await createTag(fd);
      setShowForm(false);
      (e.target as HTMLFormElement).reset();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--muted)]">
          {tags.length} tag{tags.length !== 1 ? "s" : ""} — apply these to contacts for filtering
        </p>
        <button onClick={() => setShowForm(true)} className="btn-primary whitespace-nowrap">
          <Plus size={14} />
          New tag
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl">
            <h2 className="mb-4 text-base font-semibold text-[var(--foreground)]">Create tag</h2>
            <form onSubmit={handleCreate} className="flex flex-col gap-3">
              <input name="name" placeholder="Tag name" required className="input w-full" />
              <div>
                <label className="mb-2 block text-xs font-medium text-[var(--muted)]">Color</label>
                <div className="flex gap-2">
                  {TAG_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedColor(c)}
                      className={`h-6 w-6 rounded-full transition-transform ${selectedColor === c ? "scale-125 ring-2 ring-white ring-offset-1" : ""}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 rounded-xl border border-[var(--border)] py-2 text-sm text-[var(--muted)] hover:bg-[var(--accent-soft)]">
                  Cancel
                </button>
                <button type="submit" disabled={pending} className="flex-1 btn-primary disabled:opacity-50">
                  {pending ? "Creating…" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {tags.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] p-12 text-center">
          <p className="font-medium text-[var(--foreground)]">No tags yet</p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Create tags to organize and filter your contacts.
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          {tags.map((tag) => (
            <TagChip key={tag.id} tag={tag} />
          ))}
        </div>
      )}
    </div>
  );
}

function TagChip({ tag }: { tag: Tag }) {
  const [, startTransition] = useTransition();
  return (
    <div
      className="group flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium"
      style={{ borderColor: tag.color + "40", backgroundColor: tag.color + "15", color: tag.color }}
    >
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: tag.color }} />
      {tag.name}
      <button
        onClick={() => startTransition(() => deleteTag(tag.id))}
        className="ml-1 opacity-0 transition group-hover:opacity-100 hover:text-red-500"
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
}
