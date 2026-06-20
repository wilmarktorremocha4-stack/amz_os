"use client";

import { TriggerType, TriggerConfig } from "@/lib/workflow-types";

type Tag = { id: string; name: string; color: string };
type Pipeline = { id: string; name: string; stages: { id: string; name: string }[] };
type CustomField = { id: string; name: string; type: string };

interface Props {
  triggerType: TriggerType | "";
  config: TriggerConfig;
  onChange: (config: TriggerConfig) => void;
  tags: Tag[];
  pipelines: Pipeline[];
  customFields: CustomField[];
}

const inp: React.CSSProperties = {
  width: "100%", borderRadius: 8, border: "1px solid #1E3A5F",
  background: "#030A18", color: "#E2E8F0", padding: "7px 10px",
  fontSize: 12, outline: "none", boxSizing: "border-box",
};
const lbl: React.CSSProperties = {
  display: "block", fontSize: 11, fontWeight: 600, color: "#64748B",
  marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em",
};

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label style={lbl}>{label}</label>{children}</div>;
}

export function TriggerConfigPanel({ triggerType, config, onChange, tags, pipelines, customFields }: Props) {
  const patch = (u: Partial<TriggerConfig>) => onChange({ ...config, ...u });
  const wrap: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 14 };

  if (!triggerType) {
    return (
      <div style={{ padding: 16, color: "#64748B", fontSize: 13 }}>
        Select a trigger first to configure it.
      </div>
    );
  }

  if (triggerType === "contact.tag_added" || triggerType === "contact.tag_removed") {
    return (
      <div style={wrap}>
        <F label="Tag">
          <select value={config.tagId ?? ""} onChange={(e) => { const t = tags.find(x => x.id === e.target.value); patch({ tagId: e.target.value, tagName: t?.name }); }} style={inp}>
            <option value="">Any tag</option>
            {tags.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </F>
      </div>
    );
  }

  if (triggerType === "contact.stage_changed") {
    const stages = ["RESEARCHING", "CONTACTED", "FOLLOWED_UP", "NEGOTIATING", "APPROVED", "REJECTED", "ONBOARDED"];
    return (
      <div style={wrap}>
        <F label="From stage (optional)">
          <select value={config.fromStage ?? ""} onChange={(e) => patch({ fromStage: e.target.value || undefined })} style={inp}>
            <option value="">Any stage</option>
            {stages.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </F>
        <F label="To stage (optional)">
          <select value={config.toStage ?? ""} onChange={(e) => patch({ toStage: e.target.value || undefined })} style={inp}>
            <option value="">Any stage</option>
            {stages.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </F>
      </div>
    );
  }

  if (triggerType === "opportunity.stage_changed") {
    return (
      <div style={wrap}>
        <F label="Pipeline">
          <select value={config.pipelineId ?? ""} onChange={(e) => patch({ pipelineId: e.target.value || undefined, stageId: undefined })} style={inp}>
            <option value="">Any pipeline</option>
            {pipelines.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </F>
        {config.pipelineId && (
          <F label="Stage">
            <select value={config.stageId ?? ""} onChange={(e) => patch({ stageId: e.target.value || undefined })} style={inp}>
              <option value="">Any stage</option>
              {pipelines.find(p => p.id === config.pipelineId)?.stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </F>
        )}
      </div>
    );
  }

  if (triggerType === "opportunity.stale") {
    return (
      <div style={wrap}>
        <F label="Days without movement">
          <input type="number" min={1} value={config.daysStale ?? 7} onChange={(e) => patch({ daysStale: Number(e.target.value) })} style={inp} />
        </F>
      </div>
    );
  }

  if (triggerType === "contact.custom_field_updated") {
    return (
      <div style={wrap}>
        <F label="Custom field">
          <select value={config.fieldId ?? ""} onChange={(e) => patch({ fieldId: e.target.value || undefined })} style={inp}>
            <option value="">Any field</option>
            {customFields.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </F>
        <F label="New value (optional)">
          <input value={config.fieldValue ?? ""} onChange={(e) => patch({ fieldValue: e.target.value || undefined })} style={inp} placeholder="Leave blank to match any value" />
        </F>
      </div>
    );
  }

  if (triggerType === "system.scheduler") {
    return (
      <div style={wrap}>
        <F label="Schedule type">
          <select value={config.scheduleType ?? "daily"} onChange={(e) => patch({ scheduleType: e.target.value as "daily" | "weekly" | "monthly" })} style={inp}>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </F>
        <F label="Time (HH:MM)">
          <input value={config.scheduleTime ?? "09:00"} onChange={(e) => patch({ scheduleTime: e.target.value })} style={inp} type="time" />
        </F>
        {config.scheduleType === "weekly" && (
          <F label="Day of week">
            <select value={config.scheduleDayOfWeek ?? 1} onChange={(e) => patch({ scheduleDayOfWeek: Number(e.target.value) })} style={inp}>
              {["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"].map((d, i) => <option key={i} value={i}>{d}</option>)}
            </select>
          </F>
        )}
      </div>
    );
  }

  if (triggerType === "system.webhook") {
    return (
      <div style={wrap}>
        <F label="Webhook secret (optional)">
          <input value={config.webhookSecret ?? ""} onChange={(e) => patch({ webhookSecret: e.target.value || undefined })} style={inp} placeholder="Validate incoming requests" />
        </F>
      </div>
    );
  }

  return (
    <div style={{ padding: "12px 0", color: "#64748B", fontSize: 12 }}>
      No additional configuration needed for this trigger.
    </div>
  );
}
