"use client";

import { useEffect, useState } from "react";
import { getWorkflowExecutionLogs } from "@/lib/actions/workflows";

type Log = {
  id: string;
  enrollmentId: string | null;
  supplierId: string | null;
  supplierName: string | null;
  stepId: string | null;
  stepType: string | null;
  stepLabel: string | null;
  status: string;
  message: string | null;
  errorDetail: string | null;
  durationMs: number | null;
  createdAt: Date;
};

const STATUS_COLOR: Record<string, string> = {
  success: "#10B981",
  completed: "#0E90C8",
  error: "#EF4444",
};

export function WorkflowLogsTab({ workflowId }: { workflowId: string }) {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const data = await getWorkflowExecutionLogs(workflowId);
    setLogs(data as Log[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, [workflowId]);

  if (loading) return <div style={{ padding: 32, color: "#64748B" }}>Loading logs…</div>;

  return (
    <div style={{ padding: "24px 28px" }}>
      <div style={{ marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "#E2E8F0", margin: 0 }}>Execution Logs ({logs.length})</h2>
        <button onClick={load} style={{ fontSize: 12, color: "#0E90C8", background: "transparent", border: "none", cursor: "pointer" }}>Refresh</button>
      </div>
      {logs.length === 0 ? (
        <div style={{ color: "#64748B", fontSize: 13 }}>No execution logs yet. Run the workflow to see logs here.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {logs.map((log) => (
            <div key={log.id} style={{ borderRadius: 8, border: "1px solid #1E3A5F", background: "#0A1628", padding: "8px 12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: STATUS_COLOR[log.status] ?? "#64748B", flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#E2E8F0" }}>{log.supplierName ?? "Unknown"}</span>
                  {log.stepLabel && <span style={{ fontSize: 12, color: "#64748B" }}> · {log.stepLabel}</span>}
                  {log.stepType && <span style={{ fontSize: 11, color: "#475569" }}> ({log.stepType})</span>}
                </div>
                {log.durationMs != null && (
                  <span style={{ fontSize: 11, color: "#475569", flexShrink: 0 }}>{log.durationMs}ms</span>
                )}
                <span style={{ fontSize: 11, color: "#475569", flexShrink: 0 }}>
                  {new Date(log.createdAt).toLocaleString()}
                </span>
              </div>
              {log.errorDetail && (
                <div style={{ marginTop: 4, paddingLeft: 18, fontSize: 11, color: "#EF4444", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {log.errorDetail}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
