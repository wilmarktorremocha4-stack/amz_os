"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, Mail, Clock, Users, ChevronDown, ChevronRight, X, Play } from "lucide-react";
import { createSequence, deleteSequence, addSequenceStep, deleteSequenceStep, enrollInSequence } from "@/lib/actions/email-sequences";
import { DeleteConfirmModal } from "@/components/DeleteConfirmModal";
import { EmailBuilderRoot } from "@/components/email-builder/EmailBuilderRoot";
import { EmailDoc, DEFAULT_DOC } from "@/lib/email-builder";

type Step = { id: string; subject: string; bodyJson: unknown; delayDays: number; order: number };
type Sequence = { id: string; name: string; description: string | null; status: string; steps: Step[]; enrollments: { status: string }[] };
type Supplier = { id: string; companyName: string; email: string | null };

export function SequencesClient({ sequences, suppliers }: { sequences: Sequence[]; suppliers: Supplier[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [addingStep, setAddingStep] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState<Sequence | null>(null);
  const [stepSubject, setStepSubject] = useState("");
  const [stepBody, setStepBody] = useState<EmailDoc>(DEFAULT_DOC);
  const [stepDelay, setStepDelay] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteSeqId, setDeleteSeqId] = useState<string | null>(null);
  const [deleteStepId, setDeleteStepId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const withEmail = suppliers.filter((s) => s.email);

  function handleCreateSequence(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => { await createSequence(fd); setCreating(false); });
  }

  function handleAddStep(sequenceId: string) {
    startTransition(async () => {
      const seq = sequences.find((s) => s.id === sequenceId);
      await addSequenceStep(sequenceId, {
        subject: stepSubject,
        bodyJson: stepBody,
        delayDays: stepDelay,
        order: (seq?.steps.length ?? 0),
      });
      setAddingStep(null);
      setStepSubject("");
      setStepBody(DEFAULT_DOC);
      setStepDelay(0);
    });
  }

  function handleEnroll() {
    if (!enrolling) return;
    startTransition(async () => {
      await enrollInSequence(enrolling.id, [...selectedIds]);
      setEnrolling(null);
      setSelectedIds(new Set());
    });
  }

  return (
    <main className="flex flex-1 flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">Sequences</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">Automated multi-step email follow-up sequences.</p>
        </div>
        <button onClick={() => setCreating(true)} className="btn-primary flex items-center gap-2">
          <Plus size={15} /> New Sequence
        </button>
      </div>

      {creating && (
        <form onSubmit={handleCreateSequence} className="card flex flex-col gap-3 p-5">
          <h3 className="font-semibold text-[var(--foreground)]">Create Sequence</h3>
          <input name="name" required placeholder="Sequence name" className="input w-full" />
          <textarea name="description" rows={2} placeholder="Description (optional)" className="input w-full resize-none" />
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setCreating(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={pending} className="btn-primary disabled:opacity-50">{pending ? "Creating…" : "Create"}</button>
          </div>
        </form>
      )}

      <div className="flex flex-col gap-3">
        {sequences.length === 0 && !creating && (
          <div className="card rounded-xl border-dashed p-10 text-center">
            <Mail size={32} className="mx-auto mb-3 text-[var(--muted)]" />
            <p className="font-medium text-[var(--foreground)]">No sequences yet</p>
            <p className="mt-1 text-sm text-[var(--muted)]">Build a multi-step outreach sequence for automated follow-ups.</p>
          </div>
        )}

        {sequences.map((seq) => {
          const active = seq.enrollments.filter((e) => e.status === "active").length;
          const isOpen = expanded === seq.id;
          return (
            <div key={seq.id} className="card overflow-hidden">
              <div className="flex items-center justify-between gap-3 p-4">
                <button className="flex items-center gap-2 text-left" onClick={() => setExpanded(isOpen ? null : seq.id)}>
                  {isOpen ? <ChevronDown size={16} className="text-[var(--muted)]" /> : <ChevronRight size={16} className="text-[var(--muted)]" />}
                  <div>
                    <div className="font-semibold text-[var(--foreground)]">{seq.name}</div>
                    {seq.description && <div className="text-xs text-[var(--muted)]">{seq.description}</div>}
                  </div>
                </button>
                <div className="flex shrink-0 items-center gap-3">
                  <div className="flex items-center gap-1 text-xs text-[var(--muted)]">
                    <Mail size={12} />{seq.steps.length} steps
                  </div>
                  {active > 0 && (
                    <div className="flex items-center gap-1 text-xs text-emerald-600">
                      <Users size={12} />{active} enrolled
                    </div>
                  )}
                  <button onClick={() => { setEnrolling(seq); setSelectedIds(new Set(withEmail.map((s) => s.id))); }}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500">
                    <Play size={11} /> Enroll
                  </button>
                  <button onClick={() => setDeleteSeqId(seq.id)} className="rounded-lg p-1.5 text-red-400 hover:bg-red-50">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {isOpen && (
                <div className="border-t border-[var(--border)] p-4">
                  <div className="flex flex-col gap-3">
                    {seq.steps.map((step, i) => (
                      <div key={step.id} className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--background)] p-3">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">{i + 1}</div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-[var(--foreground)]">{step.subject}</div>
                          <div className="mt-0.5 flex items-center gap-1 text-xs text-[var(--muted)]">
                            <Clock size={10} /> {step.delayDays === 0 ? "Send immediately" : `Send after ${step.delayDays} day${step.delayDays !== 1 ? "s" : ""}`}
                          </div>
                        </div>
                        <button onClick={() => setDeleteStepId(step.id)} className="text-red-400 hover:text-red-500">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}

                    {addingStep === seq.id ? (
                      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 flex flex-col gap-3">
                        <h4 className="font-medium text-sm text-[var(--foreground)]">Add Step {seq.steps.length + 1}</h4>
                        <input value={stepSubject} onChange={(e) => setStepSubject(e.target.value)} placeholder="Subject line" className="input w-full text-sm" />
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-[var(--muted)]">Send after:</label>
                          <input type="number" min={0} value={stepDelay} onChange={(e) => setStepDelay(Number(e.target.value))} className="input w-20 text-sm" />
                          <span className="text-xs text-[var(--muted)]">days</span>
                        </div>
                        <div className="h-[400px] overflow-hidden rounded-xl border border-[var(--border)]">
                          <EmailBuilderRoot doc={stepBody} onChange={setStepBody} onHtmlChange={() => {}} mergeVariables={[]} />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <button type="button" onClick={() => setAddingStep(null)} className="btn-secondary text-sm">Cancel</button>
                          <button type="button" disabled={pending || !stepSubject} onClick={() => handleAddStep(seq.id)} className="btn-primary text-sm disabled:opacity-50">{pending ? "Adding…" : "Add Step"}</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => { setAddingStep(seq.id); setStepSubject(""); setStepBody(DEFAULT_DOC); setStepDelay(seq.steps.length === 0 ? 0 : 3); }}
                        className="flex items-center gap-2 rounded-xl border-2 border-dashed border-[var(--border)] px-4 py-3 text-sm text-[var(--muted)] hover:border-blue-400 hover:text-blue-500 transition">
                        <Plus size={14} /> Add step
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {deleteSeqId && (
        <DeleteConfirmModal
          title={`Delete "${sequences.find((s) => s.id === deleteSeqId)?.name ?? "sequence"}"?`}
          description="All steps and enrollment data for this sequence will be permanently deleted."
          onConfirm={() => { startTransition(() => deleteSequence(deleteSeqId)); setDeleteSeqId(null); }}
          onCancel={() => setDeleteSeqId(null)}
        />
      )}

      {deleteStepId && (
        <DeleteConfirmModal
          title="Delete this step?"
          description="This step will be removed from the sequence permanently."
          onConfirm={() => { startTransition(() => deleteSequenceStep(deleteStepId)); setDeleteStepId(null); }}
          onCancel={() => setDeleteStepId(null)}
        />
      )}

      {/* Enroll modal */}
      {enrolling && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-6">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
              <h2 className="font-semibold text-[var(--foreground)]">Enroll in: {enrolling.name}</h2>
              <button onClick={() => setEnrolling(null)}><X size={18} /></button>
            </div>
            <div className="p-6 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--foreground)]">{selectedIds.size} selected</span>
                <button className="text-xs text-blue-500" onClick={() => setSelectedIds(selectedIds.size === withEmail.length ? new Set() : new Set(withEmail.map((s) => s.id)))}>
                  {selectedIds.size === withEmail.length ? "Deselect all" : "Select all"}
                </button>
              </div>
              <div className="max-h-56 overflow-y-auto flex flex-col gap-1 rounded-xl border border-[var(--border)] p-2">
                {withEmail.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-[var(--accent-soft)] cursor-pointer">
                    <input type="checkbox" checked={selectedIds.has(s.id)}
                      onChange={(e) => setSelectedIds((prev) => { const n = new Set(prev); e.target.checked ? n.add(s.id) : n.delete(s.id); return n; })} />
                    <span className="flex-1 text-sm truncate">{s.companyName}</span>
                    <span className="text-xs text-[var(--muted)] truncate">{s.email}</span>
                  </label>
                ))}
              </div>
              <div className="flex justify-end gap-2 border-t border-[var(--border)] pt-4">
                <button onClick={() => setEnrolling(null)} className="btn-secondary">Cancel</button>
                <button onClick={handleEnroll} disabled={pending || selectedIds.size === 0} className="btn-primary flex items-center gap-2 disabled:opacity-50">
                  <Play size={13} /> {pending ? "Enrolling…" : `Enroll ${selectedIds.size}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
