"use client";

import { useState, useTransition } from "react";
import { DollarSign, X } from "lucide-react";
import { moveOpportunityStage } from "@/lib/actions/pipelines";

type Stage = { id: string; name: string; order: number };
type Opp = {
  id: string; name: string; value: string | null; status: string;
  stageId: string; notes: string | null;
  supplier: { id: string; companyName: string } | null;
};

function OppDetailModal({ opp, stages, onClose }: { opp: Opp; stages: Stage[]; onClose: () => void }) {
  const [, startTransition] = useTransition();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-[var(--foreground)] truncate">{opp.name}</h2>
            {opp.supplier && <p className="text-sm text-[var(--muted)]">{opp.supplier.companyName}</p>}
          </div>
          <button onClick={onClose} className="shrink-0 text-[var(--muted)] hover:text-[var(--foreground)]">
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--muted)]">Value</p>
              <p className="mt-1 text-sm font-semibold text-emerald-600">
                {opp.value ? `$${Number(opp.value).toLocaleString()}` : "—"}
              </p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--muted)]">Status</p>
              <p className={`mt-1 text-sm font-semibold capitalize ${
                opp.status === "won" ? "text-emerald-600" : opp.status === "lost" ? "text-red-500" : "text-blue-500"
              }`}>{opp.status}</p>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-3">
            <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--muted)]">Move to Stage</p>
            <select
              defaultValue={opp.stageId}
              onChange={(e) => startTransition(() => moveOpportunityStage(opp.id, e.target.value))}
              className="mt-1 w-full bg-transparent text-sm text-[var(--foreground)] outline-none"
            >
              {stages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          {opp.notes && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--muted)]">Notes</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--foreground)]">{opp.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function OpportunityKanban({
  stages,
  opportunities,
  pipelineName,
}: {
  stages: Stage[];
  opportunities: Opp[];
  pipelineName: string;
}) {
  const [opps, setOpps] = useState(opportunities);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [selected, setSelected] = useState<Opp | null>(null);
  const [, startTransition] = useTransition();

  function handleDragStart(oppId: string) { setDragging(oppId); }
  function handleDragEnd() { setDragging(null); setDragOver(null); }

  function handleDrop(stageId: string) {
    if (!dragging) return;
    const opp = opps.find((o) => o.id === dragging);
    if (!opp || opp.stageId === stageId) return;
    setOpps((prev) => prev.map((o) => (o.id === dragging ? { ...o, stageId } : o)));
    startTransition(() => moveOpportunityStage(dragging, stageId));
    setDragging(null);
    setDragOver(null);
  }

  const sorted = [...stages].sort((a, b) => a.order - b.order);

  return (
    <>
      {selected && <OppDetailModal opp={selected} stages={sorted} onClose={() => setSelected(null)} />}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {sorted.map((stage) => {
          const stageOpps = opps.filter((o) => o.stageId === stage.id);
          const total = stageOpps.reduce((sum, o) => sum + (o.value ? Number(o.value) : 0), 0);
          const isOver = dragOver === stage.id;

          return (
            <div key={stage.id}
              className="flex w-64 shrink-0 flex-col"
              onDragOver={(e) => { e.preventDefault(); setDragOver(stage.id); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={() => handleDrop(stage.id)}>
              <div className={`mb-3 rounded-xl border px-3 py-2.5 transition ${isOver ? "border-blue-500 bg-blue-50" : "border-[var(--border)] bg-[var(--surface)]"}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold text-[var(--foreground)]">{stage.name}</span>
                  <span className="shrink-0 rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-xs font-medium text-[var(--muted)]">{stageOpps.length}</span>
                </div>
                {total > 0 && (
                  <div className="mt-0.5 flex items-center gap-1 text-xs text-emerald-600 font-medium">
                    <DollarSign size={10} />{total.toLocaleString()}
                  </div>
                )}
              </div>

              <div className={`flex flex-1 flex-col gap-2 rounded-xl p-2 transition min-h-[120px] ${isOver ? "bg-blue-50/50 border-2 border-dashed border-blue-300" : "bg-[var(--background)]"}`}>
                {stageOpps.map((opp) => (
                  <div
                    key={opp.id}
                    draggable
                    onDragStart={(e) => { e.stopPropagation(); handleDragStart(opp.id); }}
                    onDragEnd={handleDragEnd}
                    onClick={() => setSelected(opp)}
                    className={`rounded-xl border bg-[var(--surface)] p-3 cursor-pointer transition select-none ${
                      dragging === opp.id ? "opacity-40 scale-95 border-blue-400" : "border-[var(--border)] hover:border-blue-400/50 hover:shadow-sm"
                    }`}>
                    <div className="font-medium text-sm text-[var(--foreground)] truncate">{opp.name}</div>
                    {opp.supplier && (
                      <div className="mt-0.5 truncate text-xs text-[var(--muted)]">{opp.supplier.companyName}</div>
                    )}
                    <div className="mt-2 flex items-center justify-between">
                      {opp.value ? (
                        <span className="flex items-center gap-0.5 text-xs font-semibold text-emerald-600">
                          <DollarSign size={10} />{Number(opp.value).toLocaleString()}
                        </span>
                      ) : <span />}
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        opp.status === "won" ? "bg-emerald-100 text-emerald-700" :
                        opp.status === "lost" ? "bg-red-100 text-red-600" :
                        "bg-blue-50 text-blue-600"
                      }`}>{opp.status}</span>
                    </div>
                  </div>
                ))}
                {stageOpps.length === 0 && !isOver && (
                  <div className="flex flex-1 items-center justify-center text-xs text-[var(--muted)] py-4">
                    Drop here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
