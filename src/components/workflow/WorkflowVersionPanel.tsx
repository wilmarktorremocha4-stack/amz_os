"use client";

import { useEffect, useState } from "react";
import { getWorkflowVersions, restoreWorkflowVersion } from "@/lib/actions/workflows";
import { RotateCcw } from "lucide-react";

type Version = { id: string; savedBy: string; createdAt: Date; steps: unknown };

export function WorkflowVersionPanel({ workflowId }: { workflowId: string }) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);

  useEffect(() => {
    getWorkflowVersions(workflowId).then((v) => { setVersions(v as Version[]); setLoading(false); });
  }, [workflowId]);

  async function restore(id: string) {
    if (!confirm("Restore this version? Current steps will be overwritten.")) return;
    setRestoring(id);
    await restoreWorkflowVersion(id);
    setRestoring(null);
    window.location.reload();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#0A1628", borderLeft: "1px solid #1E3A5F" }}>
      <div style={{ padding: "12px 14px", borderBottom: "1px solid #1E3A5F", fontSize: 13, fontWeight: 700, color: "#E2E8F0" }}>Version History</div>
      <div style={{ flex: 1, overflowY: "auto", padding: "10px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
        {loading ? (
          <div style={{ color: "#64748B", fontSize: 12 }}>Loading…</div>
        ) : versions.length === 0 ? (
          <div style={{ color: "#64748B", fontSize: 12 }}>No saved versions yet. Versions are saved automatically when you update steps.</div>
        ) : versions.map((v, i) => {
          const stepsArr = v.steps as unknown[];
          return (
            <div key={v.id} style={{ borderRadius: 8, border: "1px solid #1E3A5F", background: "#030A18", padding: "8px 10px", display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#E2E8F0" }}>
                  {i === 0 ? "Latest" : `Version ${versions.length - i}`}
                </div>
                <div style={{ fontSize: 10, color: "#475569", marginTop: 2 }}>
                  {stepsArr?.length ?? 0} steps · {v.savedBy} · {new Date(v.createdAt).toLocaleString()}
                </div>
              </div>
              {i > 0 && (
                <button onClick={() => restore(v.id)} disabled={restoring === v.id}
                  style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #1E3A5F", background: "#0A1628", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#0E90C8" }}>
                  <RotateCcw size={12} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
