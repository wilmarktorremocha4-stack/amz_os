"use client";

import { useEffect, useState } from "react";
import { getWorkflowEnrollments, removeEnrollment } from "@/lib/actions/workflows";
import { Trash2 } from "lucide-react";

type Enrollment = {
  id: string;
  status: string;
  currentStep: number;
  startedAt: Date;
  completedAt: Date | null;
  errorMessage: string | null;
  supplier: { id: string; companyName: string; email: string | null; stage: string };
};

const STATUS_COLOR: Record<string, string> = {
  active: "#0E90C8",
  completed: "#10B981",
  error: "#EF4444",
  paused: "#F59E0B",
};

export function WorkflowEnrollmentsTab({ workflowId }: { workflowId: string }) {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const data = await getWorkflowEnrollments(workflowId);
    setEnrollments(data as Enrollment[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, [workflowId]);

  async function handleRemove(id: string) {
    if (!confirm("Remove this enrollment?")) return;
    await removeEnrollment(id);
    setEnrollments((prev) => prev.filter((e) => e.id !== id));
  }

  if (loading) return <div style={{ padding: 32, color: "#64748B" }}>Loading enrollments…</div>;

  return (
    <div style={{ padding: "24px 28px" }}>
      <div style={{ marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "#E2E8F0", margin: 0 }}>Enrollments ({enrollments.length})</h2>
        <button onClick={load} style={{ fontSize: 12, color: "#0E90C8", background: "transparent", border: "none", cursor: "pointer" }}>Refresh</button>
      </div>
      {enrollments.length === 0 ? (
        <div style={{ color: "#64748B", fontSize: 13 }}>No contacts enrolled yet.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {enrollments.map((e) => (
            <div key={e.id} style={{ borderRadius: 10, border: "1px solid #1E3A5F", background: "#0A1628", padding: "10px 14px", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#E2E8F0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.supplier.companyName}</div>
                <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>{e.supplier.email ?? "No email"} · Step {e.currentStep}</div>
                {e.errorMessage && <div style={{ fontSize: 11, color: "#EF4444", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.errorMessage}</div>}
              </div>
              <div style={{ borderRadius: 6, background: `${STATUS_COLOR[e.status] ?? "#64748B"}20`, padding: "3px 8px", fontSize: 11, fontWeight: 600, color: STATUS_COLOR[e.status] ?? "#64748B", flexShrink: 0 }}>
                {e.status}
              </div>
              <div style={{ fontSize: 11, color: "#64748B", flexShrink: 0, minWidth: 80, textAlign: "right" }}>
                {new Date(e.startedAt).toLocaleDateString()}
              </div>
              <button onClick={() => handleRemove(e.id)}
                style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #2D1F3D", background: "#1A0A20", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#EF4444", flexShrink: 0 }}>
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
