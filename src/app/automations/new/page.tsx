"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TRIGGER_DISPLAY, TRIGGER_TYPES, TriggerType } from "@/lib/workflow-types";
import { createWorkflow } from "@/lib/actions/workflows";
import {
  UserPlus, Tag, X, FileText, CheckSquare, CheckCircle2,
  Send, Mail, MousePointer, AlertCircle, UserMinus,
  Briefcase, GitBranch, Flag, Clock, BadgeCheck, Store, Globe, Calendar,
  ArrowRightCircle, Edit3,
} from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<{ size?: number }>> = {
  UserPlus, Tag, X, FileText, CheckSquare, CheckCircle2, Send, Mail,
  MousePointer, AlertCircle, UserMinus, Briefcase, GitBranch, Flag, Clock,
  BadgeCheck, Store, Globe, Calendar, ArrowRightCircle, Edit3,
};

const CATEGORIES = ["Contact", "Email", "Pipeline", "Sourcing", "System"] as const;

export default function NewWorkflowPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<TriggerType | null>(null);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  const grouped = CATEGORIES.map(cat => ({
    category: cat,
    triggers: Object.entries(TRIGGER_DISPLAY).filter(([, m]) => m.category === cat),
  }));

  async function handleCreate() {
    if (!selected || !name.trim()) return;
    setCreating(true);
    try {
      const wf = await createWorkflow({ name: name.trim(), triggerType: selected, triggerConfig: {} });
      router.push(`/automations/${wf.id}`);
    } finally {
      setCreating(false);
    }
  }

  return (
    <main className="flex flex-1 flex-col gap-6 p-8 max-w-4xl mx-auto w-full">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">New Workflow</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Choose a trigger to start this workflow.</p>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-[var(--muted)]">Workflow name</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. New Contact Welcome Sequence"
          className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--foreground)] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition" />
      </div>

      <div className="flex flex-col gap-6">
        <p className="text-sm font-semibold text-[var(--foreground)]">Select a trigger</p>
        {grouped.map(({ category, triggers }) => (
          <div key={category}>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]/60">{category}</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {triggers.map(([type, meta]) => {
                const Icon = ICON_MAP[meta.icon];
                const isSelected = selected === type;
                return (
                  <button key={type} onClick={() => setSelected(type as TriggerType)}
                    className={`flex items-start gap-3 rounded-xl border p-3 text-left transition ${
                      isSelected ? "border-blue-500 bg-blue-500/5 shadow-sm" : "border-[var(--border)] bg-[var(--surface)] hover:border-blue-400/40 hover:bg-[var(--accent-soft)]"
                    }`}>
                    <div className={`mt-0.5 shrink-0 rounded-lg p-1.5 ${isSelected ? "bg-blue-500 text-white" : "bg-[var(--accent-soft)] text-[var(--muted)]"}`}>
                      {Icon ? <Icon size={13} /> : <div className="h-3 w-3" />}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[var(--foreground)] leading-tight">{meta.label}</p>
                      <p className="mt-0.5 text-[10px] text-[var(--muted)] leading-snug">{meta.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 border-t border-[var(--border)] pt-4 mt-2">
        <button onClick={handleCreate} disabled={!selected || !name.trim() || creating}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/25 hover:from-blue-500 hover:to-blue-400 transition disabled:opacity-40 disabled:cursor-not-allowed">
          {creating ? "Creating…" : "Create Workflow →"}
        </button>
        <button onClick={() => router.push("/automations")}
          className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm text-[var(--muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--foreground)] transition">
          Cancel
        </button>
      </div>
    </main>
  );
}
