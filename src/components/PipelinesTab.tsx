"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, ChevronDown, ChevronRight, ChevronUp, GripVertical } from "lucide-react";
import {
  createPipeline,
  deletePipeline,
  addPipelineStage,
  deletePipelineStage,
  reorderPipelineStage,
} from "@/lib/actions/pipelines";

type Stage = { id: string; name: string; order: number };
type Pipeline = {
  id: string;
  name: string;
  stages: Stage[];
  _count: { opportunities: number };
};

const STAGE_COLORS = [
  "#3b82f6","#8b5cf6","#06b6d4","#10b981","#f59e0b","#ef4444","#ec4899","#6366f1","#14b8a6","#f97316",
];

function DeleteConfirm({ label, onConfirm, onCancel }: { label: string; onConfirm: () => void; onCancel: () => void }) {
  const [value, setValue] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl">
        <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-950">
          <Trash2 size={18} className="text-red-600" />
        </div>
        <h2 className="mt-3 text-base font-semibold text-[var(--foreground)]">Delete {label}?</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          This action cannot be undone. Type <span className="font-mono font-bold text-red-500">DELETE</span> to confirm.
        </p>
        <input autoFocus value={value} onChange={(e) => setValue(e.target.value)}
          placeholder="DELETE" className="input mt-3 w-full font-mono" />
        <div className="mt-4 flex gap-2">
          <button onClick={onCancel}
            className="flex-1 rounded-xl border border-[var(--border)] py-2 text-sm text-[var(--muted)] hover:bg-[var(--accent-soft)]">
            Cancel
          </button>
          <button disabled={value !== "DELETE"} onClick={onConfirm}
            className="flex-1 rounded-xl bg-red-600 py-2 text-sm font-semibold text-white disabled:opacity-40">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export function PipelinesTab({ pipelines }: { pipelines: Pipeline[] }) {
  const [showCreate, setShowCreate] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ type: "pipeline" | "stage"; id: string; name: string } | null>(null);
  const [addingStage, setAddingStage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleCreatePipeline(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await createPipeline(fd);
      setShowCreate(false);
    });
  }

  function handleAddStage(e: React.FormEvent<HTMLFormElement>, pipelineId: string) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("pipelineId", pipelineId);
    startTransition(async () => {
      await addPipelineStage(fd);
      setAddingStage(null);
    });
  }

  function handleConfirmDelete() {
    if (!confirmDelete) return;
    startTransition(async () => {
      if (confirmDelete.type === "pipeline") await deletePipeline(confirmDelete.id);
      else await deletePipelineStage(confirmDelete.id);
      setConfirmDelete(null);
    });
  }

  if (pipelines.length === 0 && !showCreate) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-[var(--border)] p-16 text-center">
        <div className="text-4xl">🔀</div>
        <p className="font-medium text-[var(--foreground)]">No pipelines yet</p>
        <p className="text-sm text-[var(--muted)]">Create a pipeline to track your sales stages.</p>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <Plus size={14} /> Create pipeline
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {confirmDelete && (
        <DeleteConfirm
          label={confirmDelete.name}
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--muted)]">{pipelines.length} pipeline{pipelines.length !== 1 ? "s" : ""}</p>
        <button onClick={() => setShowCreate(true)} className="btn-primary whitespace-nowrap">
          <Plus size={14} /> New pipeline
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreatePipeline}
          className="rounded-xl border border-blue-500/30 bg-[var(--surface)] p-4 flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Pipeline name</label>
            <input name="name" placeholder="e.g. Sales Pipeline" required className="input w-full" autoFocus />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--muted)]">
              Stages (comma-separated, or leave blank for defaults)
            </label>
            <input name="stages" placeholder="New Lead, Contacted, Proposal, Closed Won" className="input w-full" />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowCreate(false)}
              className="flex-1 rounded-xl border border-[var(--border)] py-2 text-sm text-[var(--muted)]">Cancel</button>
            <button type="submit" disabled={pending} className="flex-1 btn-primary disabled:opacity-50">
              {pending ? "Creating…" : "Create"}
            </button>
          </div>
        </form>
      )}

      <div className="flex flex-col gap-3">
        {pipelines.map((pipeline) => {
          const isOpen = expanded === pipeline.id;
          const sortedStages = [...pipeline.stages].sort((a, b) => a.order - b.order);
          return (
            <div key={pipeline.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3">
                <button onClick={() => setExpanded(isOpen ? null : pipeline.id)}
                  className="flex flex-1 items-center gap-2 text-left">
                  {isOpen ? <ChevronDown size={15} className="text-[var(--muted)]" /> : <ChevronRight size={15} className="text-[var(--muted)]" />}
                  <span className="font-medium text-[var(--foreground)]">{pipeline.name}</span>
                  <span className="text-xs text-[var(--muted)]">
                    {pipeline.stages.length} stage{pipeline.stages.length !== 1 ? "s" : ""} · {pipeline._count.opportunities} opp{pipeline._count.opportunities !== 1 ? "s" : ""}
                  </span>
                </button>
                <button onClick={() => setConfirmDelete({ type: "pipeline", id: pipeline.id, name: `pipeline "${pipeline.name}"` })}
                  className="rounded-lg p-1.5 text-[var(--muted)] hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950">
                  <Trash2 size={14} />
                </button>
              </div>

              {isOpen && (
                <div className="border-t border-[var(--border)] px-4 py-3">
                  <p className="mb-2 text-xs font-medium text-[var(--muted)]">Stages (drag up/down to reorder)</p>
                  <div className="flex flex-col gap-1.5">
                    {sortedStages.map((stage, i) => (
                      <div key={stage.id}
                        className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2">
                        <GripVertical size={13} className="shrink-0 text-[var(--muted)]" />
                        <div
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: STAGE_COLORS[i % STAGE_COLORS.length] }}
                        />
                        <span className="flex-1 text-sm text-[var(--foreground)]">{stage.name}</span>
                        <div className="flex items-center gap-0.5">
                          <button
                            disabled={i === 0}
                            onClick={() => startTransition(() => reorderPipelineStage(stage.id, "up"))}
                            className="rounded p-0.5 text-[var(--muted)] hover:text-blue-500 disabled:opacity-30">
                            <ChevronUp size={13} />
                          </button>
                          <button
                            disabled={i === sortedStages.length - 1}
                            onClick={() => startTransition(() => reorderPipelineStage(stage.id, "down"))}
                            className="rounded p-0.5 text-[var(--muted)] hover:text-blue-500 disabled:opacity-30">
                            <ChevronDown size={13} />
                          </button>
                          <button
                            onClick={() => setConfirmDelete({ type: "stage", id: stage.id, name: `stage "${stage.name}"` })}
                            className="ml-1 rounded p-0.5 text-[var(--muted)] hover:text-red-500">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {addingStage === pipeline.id ? (
                    <form onSubmit={(e) => handleAddStage(e, pipeline.id)} className="mt-2 flex gap-2">
                      <input name="name" placeholder="Stage name" required className="input flex-1 text-sm" autoFocus />
                      <button type="button" onClick={() => setAddingStage(null)}
                        className="rounded-lg border border-[var(--border)] px-2 py-1 text-xs text-[var(--muted)]">✕</button>
                      <button type="submit" disabled={pending}
                        className="rounded-lg bg-blue-600 px-3 py-1 text-xs text-white disabled:opacity-50">Add</button>
                    </form>
                  ) : (
                    <button onClick={() => setAddingStage(pipeline.id)}
                      className="mt-2 flex items-center gap-1.5 text-xs text-[var(--muted)] hover:text-blue-500">
                      <Plus size={12} /> Add stage
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
