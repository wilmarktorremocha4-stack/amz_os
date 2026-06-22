"use client";

import { useState } from "react";
import { updateWorkflow, archiveWorkflow } from "@/lib/actions/workflows";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

interface Props {
  workflowId: string;
  initialName: string;
  initialDescription: string;
  initialBuilderMode: string;
}

export function WorkflowSettingsTab({ workflowId, initialName, initialDescription, initialBuilderMode }: Props) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [builderMode, setBuilderMode] = useState(initialBuilderMode);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);

  const inp = "input w-full text-sm";

  async function handleSave() {
    setSaving(true);
    await updateWorkflow(workflowId, { name, description });
    if (typeof window !== "undefined") localStorage.setItem(`wf_mode_${workflowId}`, builderMode);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function handleArchive() {
    await archiveWorkflow(workflowId);
    router.push("/automations");
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-5 p-8">
      <div>
        <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Workflow name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} className={inp} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={inp + " resize-none"} placeholder="What does this workflow do?" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Builder mode</label>
        <div className="flex gap-2">
          <button onClick={() => setBuilderMode("standard")}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm ${builderMode === "standard" ? "border-blue-500 bg-blue-500/10 text-[var(--foreground)] font-medium" : "border-[var(--border)] text-[var(--muted)]"}`}>
            Standard
          </button>
          <button onClick={() => setBuilderMode("advanced")}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm ${builderMode === "advanced" ? "border-blue-500 bg-blue-500/10 text-[var(--foreground)] font-medium" : "border-[var(--border)] text-[var(--muted)]"}`}>
            Advanced
          </button>
        </div>
        <p className="mt-1 text-[10px] text-[var(--muted)]">Advanced mode enables multi-branch workflows. Standard is a single linear sequence.</p>
      </div>
      <button onClick={handleSave} disabled={saving} className="btn-primary self-start disabled:opacity-50">
        {saving ? "Saving…" : saved ? "✓ Saved!" : "Save Settings"}
      </button>

      <div className="mt-4 rounded-xl border border-red-200 bg-red-50/30 p-4">
        <p className="text-sm font-semibold text-red-500">Archive this workflow</p>
        <p className="mt-1 text-xs text-[var(--muted)]">Move to archive. You can restore or permanently delete it later from the Archive page.</p>
        {!confirmArchive ? (
          <button onClick={() => setConfirmArchive(true)} className="mt-3 flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-100">
            <Trash2 size={12} /> Archive Workflow
          </button>
        ) : (
          <div className="mt-3 flex items-center gap-2">
            <button onClick={handleArchive} className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600">Confirm Archive</button>
            <button onClick={() => setConfirmArchive(false)} className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--muted)]">Cancel</button>
          </div>
        )}
      </div>
    </div>
  );
}
