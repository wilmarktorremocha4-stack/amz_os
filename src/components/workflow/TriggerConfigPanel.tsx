"use client";

import { TriggerType, TriggerConfig, WorkflowFilter } from "@/lib/workflow-types";
import { Plus, Trash2 } from "lucide-react";

interface Props {
  triggerType: TriggerType;
  config: TriggerConfig;
  onChange: (config: TriggerConfig) => void;
  tags: { id: string; name: string }[];
  pipelines: { id: string; name: string; stages: { id: string; name: string }[] }[];
  customFields: { id: string; name: string; type: string }[];
}

const STAGES = ["RESEARCHING", "CONTACTED", "FOLLOWED_UP", "NEGOTIATING", "APPROVED", "REJECTED", "ONBOARDED"];
const inp = "w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-sm text-[var(--foreground)] outline-none focus:border-blue-500";
const lbl = "mb-1 block text-xs font-medium text-[var(--muted)]";

export function TriggerConfigPanel({ triggerType, config, onChange, tags, pipelines, customFields }: Props) {
  function patch(updates: Partial<TriggerConfig>) { onChange({ ...config, ...updates }); }

  function addFilter() {
    patch({ filters: [...(config.filters ?? []), { field: "", operator: "equals", value: "" }] });
  }
  function updateFilter(i: number, updates: Partial<WorkflowFilter>) {
    const filters = [...(config.filters ?? [])];
    filters[i] = { ...filters[i], ...updates };
    patch({ filters });
  }
  function removeFilter(i: number) {
    patch({ filters: (config.filters ?? []).filter((_, idx) => idx !== i) });
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">Trigger Configuration</p>

      {(triggerType === "contact.tag_added" || triggerType === "contact.tag_removed") && (
        <div>
          <label className={lbl}>Which tag?</label>
          <select value={config.tagId ?? ""} onChange={(e) => { const t = tags.find((x) => x.id === e.target.value); patch({ tagId: e.target.value, tagName: t?.name }); }} className={inp}>
            <option value="">Any tag (fires for all)</option>
            {tags.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
      )}

      {triggerType === "contact.stage_changed" && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={lbl}>From stage (optional)</label>
            <select value={config.fromStage ?? ""} onChange={(e) => patch({ fromStage: e.target.value || undefined })} className={inp}>
              <option value="">Any stage</option>
              {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className={lbl}>To stage</label>
            <select value={config.toStage ?? ""} onChange={(e) => patch({ toStage: e.target.value })} className={inp}>
              <option value="">Any stage</option>
              {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      )}

      {(triggerType === "opportunity.stage_changed" || triggerType === "opportunity.created") && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={lbl}>Pipeline</label>
            <select value={config.pipelineId ?? ""} onChange={(e) => patch({ pipelineId: e.target.value, stageId: "" })} className={inp}>
              <option value="">Any pipeline</option>
              {pipelines.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          {config.pipelineId && triggerType === "opportunity.stage_changed" && (
            <div>
              <label className={lbl}>Stage (optional)</label>
              <select value={config.stageId ?? ""} onChange={(e) => patch({ stageId: e.target.value })} className={inp}>
                <option value="">Any stage</option>
                {pipelines.find((p) => p.id === config.pipelineId)?.stages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          )}
        </div>
      )}

      {triggerType === "opportunity.stale" && (
        <div>
          <label className={lbl}>Days without movement</label>
          <input type="number" min={1} value={config.daysStale ?? 7} onChange={(e) => patch({ daysStale: Number(e.target.value) })} className={inp} />
        </div>
      )}

      {triggerType === "contact.custom_field_updated" && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={lbl}>Field</label>
            <select value={config.fieldId ?? ""} onChange={(e) => patch({ fieldId: e.target.value })} className={inp}>
              <option value="">Select field…</option>
              {customFields.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
          <div>
            <label className={lbl}>New value equals (optional)</label>
            <input value={config.fieldValue ?? ""} onChange={(e) => patch({ fieldValue: e.target.value })} className={inp} placeholder="Any value" />
          </div>
        </div>
      )}

      {triggerType === "system.scheduler" && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={lbl}>Frequency</label>
            <select value={config.scheduleType ?? "daily"} onChange={(e) => patch({ scheduleType: e.target.value as "daily" | "weekly" | "monthly" })} className={inp}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div>
            <label className={lbl}>Time</label>
            <input type="time" value={config.scheduleTime ?? "09:00"} onChange={(e) => patch({ scheduleTime: e.target.value })} className={inp} />
          </div>
          {config.scheduleType === "weekly" && (
            <div className="col-span-2">
              <label className={lbl}>Day of week</label>
              <select value={config.scheduleDayOfWeek ?? 1} onChange={(e) => patch({ scheduleDayOfWeek: Number(e.target.value) })} className={inp}>
                {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
            </div>
          )}
        </div>
      )}

      {triggerType === "system.webhook" && (
        <div>
          <label className={lbl}>Webhook secret (optional)</label>
          <input value={config.webhookSecret ?? ""} onChange={(e) => patch({ webhookSecret: e.target.value })} className={inp} placeholder="Random secret string" />
          <p className="mt-1 text-[10px] text-[var(--muted)]">Verified against x-amz-os-secret header on inbound requests.</p>
        </div>
      )}

      {/* Universal enrollment filters */}
      <div className="border-t border-[var(--border)] pt-3">
        <div className="mb-2 flex items-center justify-between">
          <label className="text-xs font-medium text-[var(--muted)]">Enrollment filters (optional)</label>
          <button onClick={addFilter} type="button" className="flex items-center gap-1 text-xs text-blue-500 hover:underline">
            <Plus size={11} /> Add filter
          </button>
        </div>
        <p className="mb-2 text-[10px] text-[var(--muted)]">Only enroll contacts matching ALL filters below.</p>
        {(config.filters ?? []).map((f, i) => (
          <div key={i} className="mb-2 flex items-center gap-1">
            <input value={f.field} onChange={(e) => updateFilter(i, { field: e.target.value })} className={inp + " flex-1"} placeholder="Field (stage, email…)" />
            <select value={f.operator} onChange={(e) => updateFilter(i, { operator: e.target.value as WorkflowFilter["operator"] })} className={inp + " w-32"}>
              {["equals", "not_equals", "contains", "not_contains", "is_empty", "is_not_empty"].map((op) => <option key={op} value={op}>{op}</option>)}
            </select>
            {!["is_empty", "is_not_empty"].includes(f.operator) && (
              <input value={f.value ?? ""} onChange={(e) => updateFilter(i, { value: e.target.value })} className={inp + " flex-1"} placeholder="Value" />
            )}
            <button onClick={() => removeFilter(i)} type="button" className="rounded p-1 text-red-400 hover:bg-red-500/10 shrink-0">
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
