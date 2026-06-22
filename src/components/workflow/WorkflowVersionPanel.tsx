"use client";

import { useState, useEffect, useTransition } from "react";
import { getWorkflowVersions, restoreWorkflowVersion } from "@/lib/actions/workflows";
import { History, X } from "lucide-react";

type Version = { id: string; savedBy: string; createdAt: Date | string };

export function WorkflowVersionPanel({ workflowId, onClose }: { workflowId: string; onClose: () => void }) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    getWorkflowVersions(workflowId).then((data) => { setVersions(data as unknown as Version[]); setLoading(false); });
  }, [workflowId]);

  function handleRestore(versionId: string) {
    setRestoring(versionId);
    startTransition(async () => {
      await restoreWorkflowVersion(versionId);
      setRestoring(null);
      window.location.reload();
    });
  }

  return (
    <div className="flex h-full w-72 flex-col border-l border-[var(--border)] bg-[var(--surface)]">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
        <span className="text-sm font-semibold text-[var(--foreground)]">Version History</span>
        <button onClick={onClose} className="text-[var(--muted)] hover:text-[var(--foreground)]"><X size={14} /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
        {loading ? (
          <p className="text-xs text-[var(--muted)]">Loading…</p>
        ) : versions.length === 0 ? (
          <p className="text-xs text-[var(--muted)]">No saved versions yet. Versions are created automatically when you save steps.</p>
        ) : versions.map((v, i) => (
          <div key={v.id} className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--background)] p-3">
            <div className="flex items-center gap-2">
              <History size={13} className="text-[var(--muted)] shrink-0" />
              <div>
                <div className="text-xs font-medium text-[var(--foreground)]">
                  {i === 0 ? "Latest snapshot" : `Version ${versions.length - i}`}
                </div>
                <div className="text-[10px] text-[var(--muted)]">{v.savedBy} · {new Date(v.createdAt).toLocaleString()}</div>
              </div>
            </div>
            <button onClick={() => handleRestore(v.id)} disabled={restoring === v.id}
              className="rounded-lg border border-[var(--border)] px-2 py-1 text-[10px] font-medium text-[var(--accent)] hover:bg-[var(--accent-soft)] disabled:opacity-50">
              {restoring === v.id ? "…" : "Restore"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
