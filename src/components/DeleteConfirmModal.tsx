"use client";

import { useState } from "react";
import { Trash2, X } from "lucide-react";

export function DeleteConfirmModal({
  title,
  description,
  onConfirm,
  onCancel,
}: {
  title: string;
  description?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [input, setInput] = useState("");
  const ready = input === "DELETE";

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100">
              <Trash2 size={15} className="text-red-500" />
            </div>
            <h2 className="text-base font-semibold text-[var(--foreground)]">{title}</h2>
          </div>
          <button onClick={onCancel} className="rounded-lg p-1 text-[var(--muted)] hover:bg-[var(--accent-soft)]">
            <X size={16} />
          </button>
        </div>
        <div className="flex flex-col gap-4 p-6">
          {description && (
            <p className="text-sm text-[var(--muted)]">{description}</p>
          )}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--muted)]">
              Type <span className="font-mono font-bold text-red-500">DELETE</span> to confirm
            </label>
            <input
              autoFocus
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && ready) onConfirm(); if (e.key === "Escape") onCancel(); }}
              placeholder="DELETE"
              className="input w-full font-mono tracking-wider"
            />
          </div>
          <div className="flex justify-end gap-2 border-t border-[var(--border)] pt-4">
            <button onClick={onCancel} className="btn-secondary">Cancel</button>
            <button
              onClick={onConfirm}
              disabled={!ready}
              className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 transition disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
