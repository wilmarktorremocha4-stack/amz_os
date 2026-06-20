"use client";

import { useEffect, useState } from "react";
import { getWorkflowNotes, addWorkflowNote } from "@/lib/actions/workflows";
import { Send } from "lucide-react";

type Note = { id: string; content: string; authorName: string; createdAt: Date };

export function WorkflowNotesPanel({ workflowId }: { workflowId: string }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getWorkflowNotes(workflowId).then((n) => { setNotes(n as Note[]); setLoading(false); });
  }, [workflowId]);

  async function submit() {
    if (!text.trim()) return;
    setSaving(true);
    const note = await addWorkflowNote(workflowId, text.trim());
    setNotes((prev) => [note as Note, ...prev]);
    setText("");
    setSaving(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#0A1628", borderLeft: "1px solid #1E3A5F" }}>
      <div style={{ padding: "12px 14px", borderBottom: "1px solid #1E3A5F", fontSize: 13, fontWeight: 700, color: "#E2E8F0" }}>Notes</div>
      <div style={{ flex: 1, overflowY: "auto", padding: "10px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
        {loading ? (
          <div style={{ color: "#64748B", fontSize: 12 }}>Loading…</div>
        ) : notes.length === 0 ? (
          <div style={{ color: "#64748B", fontSize: 12 }}>No notes yet. Add one below.</div>
        ) : notes.map((n) => (
          <div key={n.id} style={{ borderRadius: 8, border: "1px solid #1E3A5F", background: "#030A18", padding: "8px 10px" }}>
            <div style={{ fontSize: 12, color: "#E2E8F0", lineHeight: 1.5 }}>{n.content}</div>
            <div style={{ fontSize: 10, color: "#475569", marginTop: 4 }}>{n.authorName} · {new Date(n.createdAt).toLocaleString()}</div>
          </div>
        ))}
      </div>
      <div style={{ padding: "10px 14px", borderTop: "1px solid #1E3A5F", display: "flex", gap: 8 }}>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} placeholder="Add a note…"
          style={{ flex: 1, borderRadius: 8, border: "1px solid #1E3A5F", background: "#030A18", color: "#E2E8F0", padding: "6px 10px", fontSize: 12, outline: "none", resize: "none", fontFamily: "inherit" }} />
        <button onClick={submit} disabled={saving || !text.trim()}
          style={{ borderRadius: 8, border: "none", background: "#0E90C8", color: "white", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1, alignSelf: "flex-end" }}>
          <Send size={13} />
        </button>
      </div>
    </div>
  );
}
