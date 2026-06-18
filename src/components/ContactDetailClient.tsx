"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft, Mail, Phone, Globe, Tag as TagIcon, Plus, X,
  Trash2, Edit2, ExternalLink, ChevronDown,
} from "lucide-react";
import { updateSupplierStage, archiveSupplier } from "@/lib/actions/suppliers";
import { addTagToContact, removeTagFromContact } from "@/lib/actions/tags";
import { createOpportunity } from "@/lib/actions/pipelines";

const STAGES = [
  "RESEARCHING","CONTACTED","FOLLOWED_UP","NEGOTIATING","APPROVED","REJECTED","ONBOARDED",
] as const;

const STAGE_COLORS: Record<string, string> = {
  RESEARCHING: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  CONTACTED: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  FOLLOWED_UP: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  NEGOTIATING: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  APPROVED: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  REJECTED: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  ONBOARDED: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
};

type Tag = { id: string; name: string; color: string };
type Pipeline = { id: string; name: string; stages: { id: string; name: string; order: number }[] };
type Opportunity = {
  id: string; name: string; value: string | null; status: string;
  notes: string | null; stageId: string; supplierId: string | null;
  pipeline: { id: string; name: string };
  stage: { id: string; name: string };
};

function getInitials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

export function ContactDetailClient({
  supplier,
  contactTags,
  allTags,
  opportunities,
  pipelines,
}: {
  supplier: {
    id: string; companyName: string; contactName: string | null;
    email: string | null; phone: string | null; website: string | null;
    stage: string; notes: string | null; createdAt: string;
  };
  contactTags: Tag[];
  allTags: Tag[];
  opportunities: Opportunity[];
  pipelines: Pipeline[];
}) {
  const [stage, setStage] = useState(supplier.stage);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [showAddOpportunity, setShowAddOpportunity] = useState(false);
  const [, startTransition] = useTransition();
  const [stagePending, startStageTransition] = useTransition();

  const initials = getInitials(supplier.companyName);

  function handleStageChange(newStage: string) {
    setStage(newStage);
    startStageTransition(() => updateSupplierStage(supplier.id, newStage));
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* Top bar */}
      <div className="flex items-center gap-3 border-b border-[var(--border)] bg-[var(--surface)] px-6 py-3">
        <Link href="/crm" className="flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
          <ArrowLeft size={15} />
          Contact Details
        </Link>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: activity feed */}
        <div className="flex flex-1 flex-col overflow-y-auto border-r border-[var(--border)] bg-[var(--bg)]">
          <div className="flex items-center gap-3 border-b border-[var(--border)] px-6 py-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500 text-sm font-bold text-white">
              {initials}
            </div>
            <div>
              <div className="font-semibold text-[var(--foreground)]">{supplier.companyName}</div>
              {supplier.contactName && (
                <div className="text-xs text-[var(--muted)]">{supplier.contactName}</div>
              )}
            </div>
          </div>

          {/* Activity placeholder */}
          <div className="flex flex-1 flex-col items-center justify-center gap-2 p-12 text-center">
            <div className="text-3xl">📋</div>
            <p className="font-medium text-[var(--foreground)]">Activity feed</p>
            <p className="text-sm text-[var(--muted)]">
              Interactions, notes, and history with this contact will appear here.
            </p>
            {supplier.notes && (
              <div className="mt-4 w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-left text-sm text-[var(--foreground)]">
                <p className="mb-1 text-xs font-medium text-[var(--muted)]">Notes</p>
                {supplier.notes}
              </div>
            )}
          </div>
        </div>

        {/* Right: details panel */}
        <div className="w-80 shrink-0 overflow-y-auto bg-[var(--surface)]">
          {/* Tags */}
          <div className="border-b border-[var(--border)] px-5 py-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--muted)]">
                Tags ({contactTags.length})
              </span>
              {allTags.length > 0 && (
                <button onClick={() => setShowTagPicker((v) => !v)}
                  className="flex items-center gap-1 rounded-full border border-dashed border-[var(--border)] px-2 py-0.5 text-[11px] text-[var(--muted)] hover:border-blue-400 hover:text-blue-400">
                  <Plus size={10} /> Add
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {contactTags.map((tag) => (
                <span key={tag.id}
                  className="group/t flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                  style={{ backgroundColor: tag.color + "20", color: tag.color, border: `1px solid ${tag.color}40` }}>
                  {tag.name}
                  <button onClick={() => startTransition(() => removeTagFromContact(supplier.id, tag.id))}
                    className="opacity-0 group-hover/t:opacity-100 transition-opacity">
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
            {showTagPicker && (
              <div className="mt-2 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-2 shadow-lg">
                {allTags.filter((t) => !contactTags.find((ct) => ct.id === t.id)).map((tag) => (
                  <button key={tag.id}
                    onClick={() => {
                      setShowTagPicker(false);
                      startTransition(() => addTagToContact(supplier.id, tag.id));
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-[var(--accent-soft)]">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: tag.color }} />
                    {tag.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Contact info */}
          <div className="border-b border-[var(--border)] px-5 py-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Contact</p>
            <div className="flex flex-col gap-2 text-sm">
              {supplier.email && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] text-[var(--muted)]">Email</span>
                  <a href={`mailto:${supplier.email}`} className="text-blue-500 hover:underline flex items-center gap-1">
                    {supplier.email}
                  </a>
                </div>
              )}
              {supplier.phone && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] text-[var(--muted)]">Phone</span>
                  <span className="text-[var(--foreground)]">{supplier.phone}</span>
                </div>
              )}
              {supplier.website && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] text-[var(--muted)]">Website</span>
                  <a
                    href={supplier.website.startsWith("http") ? supplier.website : `https://${supplier.website}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-500 hover:underline truncate">
                    {supplier.website}
                    <ExternalLink size={10} />
                  </a>
                </div>
              )}
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] text-[var(--muted)]">Stage</span>
                <select value={stage} disabled={stagePending}
                  onChange={(e) => handleStageChange(e.target.value)}
                  className="rounded-lg border border-[var(--border)] bg-transparent px-2 py-1 text-xs text-[var(--foreground)] focus:outline-none">
                  {STAGES.map((s) => (
                    <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] text-[var(--muted)]">Created</span>
                <span className="text-[var(--foreground)]">
                  {new Date(supplier.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>
            </div>
          </div>

          {/* Opportunities */}
          <div className="px-5 py-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Opportunities</p>
              {pipelines.length > 0 && (
                <button onClick={() => setShowAddOpportunity(true)}
                  className="flex items-center gap-1 rounded-full border border-dashed border-[var(--border)] px-2 py-0.5 text-[11px] text-[var(--muted)] hover:border-blue-400 hover:text-blue-400">
                  <Plus size={10} /> Add
                </button>
              )}
            </div>

            {opportunities.length === 0 ? (
              <p className="text-xs text-[var(--muted)]">No opportunities yet.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {opportunities.map((opp) => (
                  <div key={opp.id}
                    className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3 text-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-medium text-[var(--foreground)] truncate">{opp.name}</div>
                        <div className="text-xs text-[var(--muted)]">
                          {opp.pipeline.name} → <span className="text-blue-500">{opp.stage.name}</span>
                        </div>
                      </div>
                      {opp.value && (
                        <span className="shrink-0 text-xs font-semibold text-green-600">
                          ${Number(opp.value).toLocaleString()}
                        </span>
                      )}
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        opp.status === "won" ? "bg-green-100 text-green-700" :
                        opp.status === "lost" ? "bg-red-100 text-red-700" :
                        "bg-blue-100 text-blue-700"
                      }`}>
                        {opp.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {showAddOpportunity && pipelines.length > 0 && (
              <AddOpportunityForm
                supplierId={supplier.id}
                pipelines={pipelines}
                onClose={() => setShowAddOpportunity(false)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AddOpportunityForm({
  supplierId,
  pipelines,
  onClose,
}: {
  supplierId: string;
  pipelines: Pipeline[];
  onClose: () => void;
}) {
  const [selectedPipelineId, setSelectedPipelineId] = useState(pipelines[0]?.id ?? "");
  const [pending, startTransition] = useTransition();
  const selectedPipeline = pipelines.find((p) => p.id === selectedPipelineId);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("supplierId", supplierId);
    startTransition(async () => {
      await createOpportunity(fd);
      onClose();
    });
  }

  return (
    <div className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <input name="name" placeholder="Opportunity name" required className="input w-full text-xs" />
        <input name="value" type="number" placeholder="Value ($)" className="input w-full text-xs" />
        <select name="pipelineId" value={selectedPipelineId}
          onChange={(e) => setSelectedPipelineId(e.target.value)}
          className="input w-full bg-[var(--surface)] text-xs">
          {pipelines.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        {selectedPipeline && (
          <select name="stageId" className="input w-full bg-[var(--surface)] text-xs">
            {selectedPipeline.stages.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        )}
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose}
            className="flex-1 rounded-lg border border-[var(--border)] py-1.5 text-xs text-[var(--muted)]">
            Cancel
          </button>
          <button type="submit" disabled={pending}
            className="flex-1 rounded-lg bg-blue-600 py-1.5 text-xs font-medium text-white disabled:opacity-50">
            {pending ? "Adding…" : "Add"}
          </button>
        </div>
      </form>
    </div>
  );
}
