"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, DollarSign, Trash2, ChevronDown, LayoutGrid, List, Search, X } from "lucide-react";
import {
  createOpportunity,
  moveOpportunityStage,
  deleteOpportunity,
  updateOpportunityStatus,
} from "@/lib/actions/pipelines";
import { OpportunityKanban } from "@/components/OpportunityKanban";

type Stage = { id: string; name: string; order: number };
type Pipeline = { id: string; name: string; stages: Stage[] };
type Supplier = { id: string; companyName: string };
type Opp = {
  id: string;
  name: string;
  value: string | null;
  status: string;
  notes: string | null;
  stageId: string;
  supplierId: string | null;
  supplier: Supplier | null;
};

const STATUS_COLORS: Record<string, string> = {
  open: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
  won: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
  lost: "bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-300",
};

function OppCard({ opp, stages }: { opp: Opp; stages: Stage[] }) {
  const [, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="group rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-sm transition hover:border-blue-400/40 hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-[var(--foreground)]">
            {opp.name}
          </div>
          {opp.supplier && (
            <div className="mt-0.5 truncate text-xs text-[var(--muted)]">
              {opp.supplier.companyName}
            </div>
          )}
        </div>
        <button
          onClick={() => setConfirmDelete(!confirmDelete)}
          className="shrink-0 rounded p-1 text-[var(--muted)] opacity-0 hover:text-red-500 group-hover:opacity-100"
        >
          <Trash2 size={12} />
        </button>
      </div>

      {opp.value && (
        <div className="mt-2 flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          <DollarSign size={11} />
          {Number(opp.value).toLocaleString()}
        </div>
      )}

      <div className="mt-2 flex items-center gap-2">
        <select
          defaultValue={opp.status}
          onChange={(e) =>
            startTransition(() => updateOpportunityStatus(opp.id, e.target.value))
          }
          className={`rounded-full border-0 px-2 py-0.5 text-[10px] font-medium outline-none cursor-pointer ${STATUS_COLORS[opp.status] ?? STATUS_COLORS.open}`}
        >
          <option value="open">Open</option>
          <option value="won">Won</option>
          <option value="lost">Lost</option>
        </select>
      </div>

      <select
        defaultValue={opp.stageId}
        onChange={(e) =>
          startTransition(() => moveOpportunityStage(opp.id, e.target.value))
        }
        className="mt-2 w-full rounded-lg border border-[var(--border)] bg-transparent px-2 py-1 text-xs text-[var(--muted)] outline-none"
      >
        {stages.map((s) => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>

      {confirmDelete && (
        <div className="mt-2 flex gap-1.5 border-t border-[var(--border)] pt-2">
          <button
            onClick={() => setConfirmDelete(false)}
            className="flex-1 rounded-lg border border-[var(--border)] py-1 text-xs text-[var(--muted)]"
          >
            Cancel
          </button>
          <button
            onClick={() => startTransition(() => deleteOpportunity(opp.id))}
            className="flex-1 rounded-lg bg-red-600 py-1 text-xs font-medium text-white"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

function ContactSearch({
  suppliers,
  value,
  onChange,
}: {
  suppliers: Supplier[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = suppliers.find((s) => s.id === value);
  const filtered = query
    ? suppliers.filter((s) => s.companyName.toLowerCase().includes(query.toLowerCase()))
    : suppliers;

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <div
        className="input flex w-full cursor-pointer items-center gap-2"
        onClick={() => { setOpen((v) => !v); setQuery(""); }}
      >
        {selected ? (
          <>
            <span className="flex-1 truncate text-sm text-[var(--foreground)]">{selected.companyName}</span>
            <button type="button" onClick={(e) => { e.stopPropagation(); onChange(""); setOpen(false); }}
              className="shrink-0 text-[var(--muted)] hover:text-red-500">
              <X size={13} />
            </button>
          </>
        ) : (
          <>
            <Search size={13} className="shrink-0 text-[var(--muted)]" />
            <span className="text-sm text-[var(--muted)]">Search contact…</span>
          </>
        )}
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xl">
          <div className="flex items-center gap-2 border-b border-[var(--border)] px-3 py-2">
            <Search size={13} className="shrink-0 text-[var(--muted)]" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type to filter…"
              className="flex-1 bg-transparent text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted)]"
            />
          </div>
          <div className="max-h-48 overflow-y-auto py-1">
            <button type="button"
              onClick={() => { onChange(""); setOpen(false); }}
              className="w-full px-3 py-2 text-left text-sm text-[var(--muted)] hover:bg-[var(--accent-soft)]">
              — No contact linked
            </button>
            {filtered.length === 0 && (
              <p className="px-3 py-2 text-xs text-[var(--muted)]">No contacts match "{query}"</p>
            )}
            {filtered.map((s) => (
              <button type="button" key={s.id}
                onClick={() => { onChange(s.id); setOpen(false); setQuery(""); }}
                className={`w-full truncate px-3 py-2 text-left text-sm transition hover:bg-[var(--accent-soft)] ${value === s.id ? "bg-blue-50 font-medium text-blue-600" : "text-[var(--foreground)]"}`}>
                {s.companyName}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AddOppModal({
  pipeline,
  suppliers,
  onClose,
}: {
  pipeline: Pipeline;
  suppliers: Supplier[];
  onClose: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [supplierId, setSupplierId] = useState("");
  const [name, setName] = useState("");
  const router = useRouter();

  // Auto-fill opportunity name from selected contact
  function handleContactChange(id: string) {
    setSupplierId(id);
    if (id && !name) {
      const contact = suppliers.find((s) => s.id === id);
      if (contact) setName(contact.companyName);
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("supplierId", supplierId);
    startTransition(async () => {
      await createOpportunity(fd);
      router.refresh();
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl">
        <h2 className="mb-4 text-base font-semibold text-[var(--foreground)]">Add opportunity</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input type="hidden" name="pipelineId" value={pipeline.id} />

          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Contact</label>
            <ContactSearch suppliers={suppliers} value={supplierId} onChange={handleContactChange} />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Opportunity name</label>
            <input name="name" required placeholder="e.g. WBC Deal Q3"
              value={name} onChange={(e) => setName(e.target.value)}
              className="input w-full" />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Stage</label>
            <select name="stageId" required className="input w-full">
              {pipeline.stages.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Value ($)</label>
            <input name="value" type="number" step="0.01" min="0" placeholder="0"
              className="input w-full" />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Source</label>
            <select name="source" className="input w-full">
              <option value="">Select source…</option>
              <option>Direct outreach</option>
              <option>Brand Finder</option>
              <option>Referral</option>
              <option>Cold email</option>
              <option>Social media</option>
              <option>Trade show</option>
              <option>Other</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Business name</label>
            <input name="businessName" placeholder="Legal business name (optional)" className="input w-full" />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Notes</label>
            <textarea name="notes" placeholder="Optional notes…" rows={2}
              className="input w-full resize-none" />
          </div>

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-xl border border-[var(--border)] py-2 text-sm text-[var(--muted)] hover:bg-[var(--accent-soft)]">
              Cancel
            </button>
            <button type="submit" disabled={pending} className="flex-1 btn-primary disabled:opacity-50">
              {pending ? "Adding…" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function OpportunitiesTab({
  pipelines,
  opportunities,
  suppliers,
}: {
  pipelines: Pipeline[];
  opportunities: Opp[];
  suppliers: Supplier[];
}) {
  const [selectedId, setSelectedId] = useState(pipelines[0]?.id ?? "");
  const [showAdd, setShowAdd] = useState(false);
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");

  const pipeline = pipelines.find((p) => p.id === selectedId);
  const stageIds = new Set(pipeline?.stages.map((s) => s.id) ?? []);
  const pipelineOpps = opportunities.filter((o) => stageIds.has(o.stageId));
  const totalValue = pipelineOpps.reduce((s, o) => s + (o.value ? Number(o.value) : 0), 0);

  if (pipelines.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-[var(--border)] p-16 text-center">
        <div className="text-4xl">🔀</div>
        <p className="font-medium text-[var(--foreground)]">No pipelines yet</p>
        <p className="text-sm text-[var(--muted)]">Create a pipeline first from the Pipelines tab.</p>
        <a href="/opportunities?tab=pipelines" className="btn-primary">Go to Pipelines →</a>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {showAdd && pipeline && (
        <AddOppModal pipeline={pipeline} suppliers={suppliers} onClose={() => setShowAdd(false)} />
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="input max-w-[200px] appearance-none pr-8 font-medium"
          >
            {pipelines.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
        </div>
        <span className="text-sm text-[var(--muted)]">
          {pipelineOpps.length} opportunit{pipelineOpps.length !== 1 ? "ies" : "y"} ·{" "}
          <span className="font-medium text-emerald-600 dark:text-emerald-400">
            ${totalValue.toLocaleString()}
          </span>{" "}
          total
        </span>
        <div className="ml-auto flex items-center gap-2">
          <div className="flex rounded-lg border border-[var(--border)] overflow-hidden">
            <button onClick={() => setViewMode("kanban")} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition ${viewMode === "kanban" ? "bg-blue-600 text-white" : "text-[var(--muted)] hover:bg-[var(--accent-soft)]"}`}>
              <LayoutGrid size={13} /> Kanban
            </button>
            <button onClick={() => setViewMode("list")} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition ${viewMode === "list" ? "bg-blue-600 text-white" : "text-[var(--muted)] hover:bg-[var(--accent-soft)]"}`}>
              <List size={13} /> List
            </button>
          </div>
          <button onClick={() => setShowAdd(true)} className="btn-primary whitespace-nowrap">
            <Plus size={14} />
            Add opportunity
          </button>
        </div>
      </div>

      {/* Drag-drop Kanban */}
      {viewMode === "kanban" && pipeline && (
        <OpportunityKanban
          stages={pipeline.stages}
          opportunities={pipelineOpps.map((o) => ({ ...o, value: o.value }))}
          pipelineName={pipeline.name}
        />
      )}

      {/* List view */}
      {viewMode === "list" && pipeline && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[...pipeline.stages]
            .sort((a, b) => a.order - b.order)
            .map((stage) => {
              const cols = pipelineOpps.filter((o) => o.stageId === stage.id);
              const colVal = cols.reduce((s, o) => s + (o.value ? Number(o.value) : 0), 0);
              return (
                <div key={stage.id} className="flex w-60 shrink-0 flex-col gap-2">
                  <div className="rounded-t-xl bg-[var(--accent-soft)] px-3 py-2">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                      {stage.name}
                    </div>
                    <div className="text-[10px] text-[var(--muted)]">
                      {cols.length} · ${colVal.toLocaleString()}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {cols.map((o) => (
                      <OppCard key={o.id} opp={o} stages={pipeline.stages} />
                    ))}
                    {cols.length === 0 && (
                      <div className="rounded-xl border border-dashed border-[var(--border)] p-3 text-center text-xs text-[var(--muted)]">
                        Empty
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}

