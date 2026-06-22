"use client";

import { useEffect, useState, useTransition } from "react";
import { getWorkflowEnrollments, removeEnrollment } from "@/lib/actions/workflows";
import { X } from "lucide-react";

type Enrollment = {
  id: string; status: string; currentStep: number;
  startedAt: Date | string; completedAt: Date | string | null; errorMessage: string | null;
  supplier: { id: string; companyName: string; email: string | null };
};

const STATUS_COLOR: Record<string, string> = {
  active: "bg-blue-100 text-blue-700",
  completed: "bg-emerald-100 text-emerald-700",
  paused: "bg-amber-100 text-amber-700",
  removed: "bg-slate-100 text-slate-500",
  error: "bg-red-100 text-red-600",
};

export function WorkflowEnrollmentsTab({ workflowId, totalSteps }: { workflowId: string; totalSteps: number }) {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [, startTransition] = useTransition();

  useEffect(() => {
    getWorkflowEnrollments(workflowId).then((data) => {
      setEnrollments(data as unknown as Enrollment[]);
      setLoading(false);
    });
  }, [workflowId]);

  function handleRemove(id: string) {
    startTransition(async () => {
      await removeEnrollment(id);
      setEnrollments((prev) => prev.map((e) => e.id === id ? { ...e, status: "removed" } : e));
    });
  }

  if (loading) return <div className="p-8 text-sm text-[var(--muted)]">Loading enrollments…</div>;

  return (
    <div className="p-6">
      {enrollments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] p-12 text-center text-sm text-[var(--muted)]">
          No contacts enrolled in this workflow yet.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[var(--border)]">
          <table className="w-full text-sm">
            <thead className="bg-[var(--accent-soft)]">
              <tr className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                <th className="px-4 py-2.5 text-left">Contact</th>
                <th className="px-4 py-2.5 text-left">Status</th>
                <th className="px-4 py-2.5 text-left">Progress</th>
                <th className="px-4 py-2.5 text-left">Started</th>
                <th className="px-4 py-2.5 text-left">Completed</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {enrollments.map((e) => (
                <tr key={e.id} className="text-[var(--foreground)]">
                  <td className="px-4 py-2.5">
                    <div className="font-medium">{e.supplier.companyName}</div>
                    <div className="text-xs text-[var(--muted)]">{e.supplier.email}</div>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${STATUS_COLOR[e.status] ?? "bg-slate-100 text-slate-500"}`}>{e.status}</span>
                    {e.errorMessage && <div className="mt-0.5 text-[10px] text-red-500">{e.errorMessage}</div>}
                  </td>
                  <td className="px-4 py-2.5 text-xs">{e.currentStep} / {totalSteps}</td>
                  <td className="px-4 py-2.5 text-xs">{new Date(e.startedAt).toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-xs">{e.completedAt ? new Date(e.completedAt).toLocaleString() : "—"}</td>
                  <td className="px-4 py-2.5 text-right">
                    {e.status === "active" && (
                      <button onClick={() => handleRemove(e.id)} title="Remove from workflow" className="rounded p-1 text-red-400 hover:bg-red-50">
                        <X size={13} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
