"use client";

import { useState, useTransition } from "react";
import { Plus, DollarSign } from "lucide-react";
import { moveOpportunityStage } from "@/lib/actions/pipelines";

type Stage = { id: string; name: string; order: number };
type Opp = {
  id: string; name: string; value: string | null; status: string;
  stageId: string; notes: string | null;
  supplier: { id: string; companyName: string } | null;
};

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
  const [, startTransition] = useTransition();

  function handleDragStart(oppId: string) {
    setDragging(oppId);
  }

  function handleDragEnd() {
    setDragging(null);
    setDragOver(null);
  }

  function handleDrop(stageId: string) {
    if (!dragging || dragging === stageId) return;
    const opp = opps.find((o) => o.id === dragging);
    if (!opp || opp.stageId === stageId) return;

    // Optimistic update
    setOpps((prev) => prev.map((o) => (o.id === dragging ? { ...o, stageId } : o)));
    startTransition(() => moveOpportunityStage(dragging, stageId));
    setDragging(null);
    setDragOver(null);
  }

  const sorted = [...stages].sort((a, b) => a.order - b.order);

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {sorted.map((stage) => {
        const stageOpps = opps.filter((o) => o.stageId === stage.id);
        const total = stageOpps.reduce((sum, o) => sum + (o.value ? Number(o.value) : 0), 0);
        const isOver = dragOver === stage.id;

        return (
          <div key={stage.id}
            className="flex w-68 shrink-0 flex-col"
            onDragOver={(e) => { e.preventDefault(); setDragOver(stage.id); }}
            onDragLeave={() => setDragOver(null)}
            onDrop={() => handleDrop(stage.id)}>
            {/* Column header */}
            <div className={`mb-3 rounded-xl border px-3 py-2.5 transition ${isOver ? "border-blue-500 bg-blue-50" : "border-[var(--border)] bg-[var(--surface)]"}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-[var(--foreground)]">{stage.name}</span>
                <span className="rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-xs font-medium text-[var(--muted)]">{stageOpps.length}</span>
              </div>
              {total > 0 && (
                <div className="mt-0.5 flex items-center gap-1 text-xs text-emerald-600 font-medium">
                  <DollarSign size={10} />{total.toLocaleString()}
                </div>
              )}
            </div>

            {/* Cards */}
            <div className={`flex flex-1 flex-col gap-2 rounded-xl p-2 transition min-h-[120px] ${isOver ? "bg-blue-50/50 border-2 border-dashed border-blue-300" : "bg-[var(--background)]"}`}>
              {stageOpps.map((opp) => (
                <OppCard key={opp.id} opp={opp} dragging={dragging === opp.id}
                  onDragStart={() => handleDragStart(opp.id)}
                  onDragEnd={handleDragEnd} />
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
  );
}

function OppCard({ opp, dragging, onDragStart, onDragEnd }: {
  opp: Opp; dragging: boolean;
  onDragStart: () => void; onDragEnd: () => void;
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`rounded-xl border bg-[var(--surface)] p-3 cursor-grab active:cursor-grabbing transition select-none ${
        dragging ? "opacity-40 scale-95 border-blue-400" : "border-[var(--border)] hover:border-[var(--muted)] hover:shadow-sm"
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
  );
}
