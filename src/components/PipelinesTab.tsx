"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import {
  createPipeline,
  deletePipeline,
  addPipelineStage,
  deletePipelineStage,
} from "@/lib/actions/pipelines";

type Stage = { id: string; name: string; order: number };
type Pipeline = {
  id: string;
  name: string;
  stages: Stage[];
  _count: { opportunities: number };
};

export function PipelinesTab({ pipelines }: { pipelines: Pipeline[] }) {
  const [showCreate, setShowCreate] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try { await createPipeline(fd); } catch { /* redirect throws */ }
      setShowCreate(false);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--muted)]">
          {pipelines.length} pipeline{pipelines.length !== 1 ? "s" : ""}
        </p>
        <button onClick={() => setShowCreate(true)} className="btn-primary whitespace-nowrap">
          <Plus size={14} />
          Create pipeline
        </button>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl">
            <h2 className="mb-4 text-base font-semibold text-[var(--foreground)]">Create pipeline</h2>
            <form onSubmit={handleCreate} className="flex flex-col gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--muted)]">
                  Pipeline name *
                </label>
                <input name="name" placeholder="e.g. Wholesale Outreach" required className="input w-full" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--muted)]">
                  Stages (comma-separated — leave blank for defaults)
                </label>
                <input
                  name="stages"
                  placeholder="New Lead, Contacted, Proposal Sent, Closed Won"
                  className="input w-full"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 rounded-xl border border-[var(--border)] py-2 text-sm text-[var(--muted)] hover:bg-[var(--accent-soft)]"
                >
                  Cancel
                </button>
                <button type="submit" disabled={pending} className="flex-1 btn-primary disabled:opacity-50">
                  {pending ? "Creating…" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {pipelines.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] p-12 text-center">
          <p className="font-medium text-[var(--foreground)]">No pipelines yet</p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Create your first pipeline to track opportunities across custom stages.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {pipelines.map((p) => (
            <div key={p.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)]">
              <div className="flex items-center gap-3 p-4">
                <button
                  onClick={() => setExpanded(expanded === p.id ? null : p.id)}
                  className="flex flex-1 items-center gap-2 text-left"
                >
                  {expanded === p.id
                    ? <ChevronDown size={16} className="text-[var(--muted)]" />
                    : <ChevronRight size={16} className="text-[var(--muted)]" />}
                  <span className="font-medium text-[var(--foreground)]">{p.name}</span>
                  <span className="text-xs text-[var(--muted)]">
                    {p.stages.length} stage{p.stages.length !== 1 ? "s" : ""}
                    {p._count.opportunities > 0 &&
                      ` · ${p._count.opportunities} opportunit${p._count.opportunities !== 1 ? "ies" : "y"}`}
                  </span>
                </button>
                <button
                  onClick={() => startTransition(() => deletePipeline(p.id))}
                  className="rounded-lg p-1.5 text-[var(--muted)] hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {expanded === p.id && (
                <div className="border-t border-[var(--border)] p-4">
                  <div className="mb-3 flex flex-wrap gap-2">
                    {[...p.stages]
                      .sort((a, b) => a.order - b.order)
                      .map((s) => (
                        <div
                          key={s.id}
                          className="flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--accent-soft)] px-3 py-1 text-xs"
                        >
                          {s.name}
                          <button
                            onClick={() => startTransition(() => deletePipelineStage(s.id))}
                            className="ml-1 text-[var(--muted)] hover:text-red-500"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                  </div>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const fd = new FormData(e.currentTarget);
                      fd.append("pipelineId", p.id);
                      startTransition(async () => {
                        await addPipelineStage(fd);
                        (e.target as HTMLFormElement).reset();
                      });
                    }}
                    className="flex gap-2"
                  >
                    <input name="name" placeholder="New stage name…" required className="input flex-1 text-sm" />
                    <button type="submit" className="btn-secondary whitespace-nowrap text-xs">
                      <Plus size={12} />
                      Add stage
                    </button>
                  </form>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
