"use client";

import { useEffect, useState } from "react";
import { getWorkflowExecutionLogs } from "@/lib/actions/workflows";
import { CheckCircle2, XCircle, MinusCircle } from "lucide-react";

type LogEntry = {
  id: string; supplierName: string | null; stepLabel: string | null; stepType: string | null;
  status: string; message: string | null; errorDetail: string | null; durationMs: number | null;
  createdAt: Date | string;
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  success: <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />,
  failed: <XCircle size={14} className="text-red-500 shrink-0" />,
  skipped: <MinusCircle size={14} className="text-[var(--muted)] shrink-0" />,
};

export function WorkflowLogsTab({ workflowId }: { workflowId: string }) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "success" | "failed">("all");

  useEffect(() => {
    getWorkflowExecutionLogs(workflowId).then((data) => {
      setLogs(data as unknown as LogEntry[]);
      setLoading(false);
    });
  }, [workflowId]);

  const filtered = filter === "all" ? logs : logs.filter((l) => l.status === filter);

  if (loading) return <div className="p-8 text-sm text-[var(--muted)]">Loading logs…</div>;

  return (
    <div className="p-6">
      <div className="mb-4 flex gap-2">
        {(["all", "success", "failed"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`rounded-lg px-3 py-1 text-xs font-medium capitalize ${filter === f ? "bg-blue-500 text-white" : "bg-[var(--accent-soft)] text-[var(--muted)]"}`}>
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] p-12 text-center text-sm text-[var(--muted)]">
          No execution logs yet. Logs appear after contacts move through this workflow.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((log) => (
            <div key={log.id} className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
              <div className="mt-0.5">{STATUS_ICON[log.status] ?? STATUS_ICON.skipped}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[var(--foreground)]">{log.stepLabel ?? log.stepType}</span>
                  {log.supplierName && <span className="text-xs text-[var(--muted)]">→ {log.supplierName}</span>}
                </div>
                {log.message && <p className="mt-0.5 text-xs text-[var(--muted)]">{log.message}</p>}
                {log.errorDetail && <p className="mt-0.5 text-xs font-mono text-red-500">{log.errorDetail}</p>}
              </div>
              <div className="shrink-0 text-right text-[10px] text-[var(--muted)]">
                <div>{new Date(log.createdAt).toLocaleString()}</div>
                {log.durationMs !== null && <div>{log.durationMs}ms</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
