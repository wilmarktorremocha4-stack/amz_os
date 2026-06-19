import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";
import { Plus, Zap, Users, Play, Pause, Trash2, Edit } from "lucide-react";
import { toggleWorkflowStatus, deleteWorkflow } from "@/lib/actions/workflows";
import { TRIGGER_DISPLAY, TriggerType } from "@/lib/workflow-types";

export const dynamic = "force-dynamic";

export default async function AutomationsPage() {
  const user = await getCurrentUser();
  const workflows = await prisma.workflow.findMany({
    where: { userId: user.id },
    include: { _count: { select: { enrollments: true } } },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <main className="flex flex-1 flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">Automations</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">GHL-style workflows that run automatically on your contacts.</p>
        </div>
        <Link href="/automations/new"
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-500/25 hover:from-blue-500 hover:to-blue-400 transition">
          <Plus size={15} /> New Workflow
        </Link>
      </div>

      {workflows.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-5 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg shadow-blue-500/25">
            <Zap size={28} className="text-white" />
          </div>
          <div>
            <p className="text-lg font-semibold text-[var(--foreground)]">No workflows yet</p>
            <p className="mt-1 text-sm text-[var(--muted)] max-w-sm">Build automated sequences that trigger based on contact activity, emails, pipeline changes, and more.</p>
          </div>
          <Link href="/automations/new"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-500/25 hover:from-blue-500 hover:to-blue-400 transition">
            <Plus size={14} /> Create First Workflow
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {workflows.map((wf) => {
            const triggerMeta = TRIGGER_DISPLAY[wf.triggerType as TriggerType];
            return (
              <div key={wf.id} className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    wf.status === "active" ? "bg-emerald-500/10 text-emerald-500" :
                    wf.status === "paused" ? "bg-amber-500/10 text-amber-500" :
                    "bg-[var(--accent-soft)] text-[var(--muted)]"
                  }`}>
                    <Zap size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[var(--foreground)] truncate">{wf.name}</span>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                        wf.status === "active" ? "bg-emerald-500/10 text-emerald-600" :
                        wf.status === "paused" ? "bg-amber-500/10 text-amber-600" :
                        "bg-[var(--accent-soft)] text-[var(--muted)]"
                      }`}>{wf.status}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-[var(--muted)] truncate">
                      Trigger: {triggerMeta?.label ?? wf.triggerType} · {(wf.steps as unknown[]).length} steps ·{" "}
                      <span className="inline-flex items-center gap-0.5"><Users size={10} /> {wf._count.enrollments} enrolled</span>
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Link href={`/automations/${wf.id}`}
                    className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--foreground)] transition">
                    <Edit size={12} /> Edit
                  </Link>
                  <form action={toggleWorkflowStatus.bind(null, wf.id)}>
                    <button type="submit" className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                      wf.status === "active" ? "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20" : "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                    }`}>
                      {wf.status === "active" ? <><Pause size={12} /> Pause</> : <><Play size={12} /> Activate</>}
                    </button>
                  </form>
                  <form action={deleteWorkflow.bind(null, wf.id)}>
                    <button type="submit" className="rounded-lg p-1.5 text-[var(--muted)] hover:bg-red-500/10 hover:text-red-500 transition">
                      <Trash2 size={14} />
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
