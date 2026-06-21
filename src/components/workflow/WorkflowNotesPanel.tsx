"use client";

import { useState, useEffect, useTransition } from "react";
import { getWorkflowNotes, addWorkflowNote } from "@/lib/actions/workflows";
import { Send, X } from "lucide-react";

type Note = { id: string; content: string; createdAt: Date | string; authorName: string };

export function WorkflowNotesPanel({ workflowId, onClose }: { workflowId: string; onClose: () => void }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [, startTransition] = useTransition();

  useEffect(() => {
    getWorkflowNotes(workflowId).then((data) => { setNotes(data as unknown as Note[]); setLoading(false); });
  }, [workflowId]);

  function handleAdd() {
    if (!draft.trim()) return;
    const content = draft.trim();
    setDraft("");
    startTransition(async () => {
      const note = await addWorkflowNote(workflowId, content);
      setNotes((prev) => [note as unknown as Note, ...prev]);
    });
  }

  return (
    <div className="flex h-full w-72 flex-col border-l border-[var(--border)] bg-[var(--surface)]">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
        <span className="text-sm font-semibold text-[var(--foreground)]">Notes</span>
        <button onClick={onClose} className="text-[var(--muted)] hover:text-[var(--foreground)]"><X size={14} /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
        {loading ? (
          <p className="text-xs text-[var(--muted)]">Loading…</p>
        ) : notes.length === 0 ? (
          <p className="text-xs text-[var(--muted)]">No notes yet. Leave context for your team about this workflow.</p>
        ) : notes.map((n) => (
          <div key={n.id} className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-3">
            <p className="text-sm text-[var(--foreground)]">{n.content}</p>
            <p className="mt-1 text-[10px] text-[var(--muted)]">{n.authorName} · {new Date(n.createdAt).toLocaleString()}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 border-t border-[var(--border)] p-3">
        <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Add a note…" className="input flex-1 text-sm" />
        <button onClick={handleAdd} className="btn-primary shrink-0 p-2"><Send size={13} /></button>
      </div>
    </div>
  );
}
