"use client";

import { useState } from "react";
import { updateWorkflow } from "@/lib/actions/workflows";

interface Props {
  workflowId: string;
  name: string;
  description: string;
  builderMode: string;
  onBuilderModeChange: (mode: string) => void;
}

const inp: React.CSSProperties = {
  width: "100%", borderRadius: 8, border: "1px solid #1E3A5F",
  background: "#030A18", color: "#E2E8F0", padding: "8px 12px",
  fontSize: 13, outline: "none", boxSizing: "border-box",
};
const lbl: React.CSSProperties = {
  display: "block", fontSize: 11, fontWeight: 600, color: "#64748B",
  marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em",
};

export function WorkflowSettingsTab({ workflowId, name: initName, description: initDesc, builderMode, onBuilderModeChange }: Props) {
  const [name, setName] = useState(initName);
  const [description, setDescription] = useState(initDesc);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    await updateWorkflow(workflowId, { name, description });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div style={{ maxWidth: 560, padding: 32, display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "#E2E8F0", margin: 0, marginBottom: 4 }}>Workflow Settings</h2>
        <p style={{ fontSize: 12, color: "#64748B", margin: 0 }}>Configure basic settings for this workflow.</p>
      </div>
      <div>
        <label style={lbl}>Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} style={inp} />
      </div>
      <div>
        <label style={lbl}>Description (optional)</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} style={{ ...inp, resize: "vertical" }} placeholder="What does this workflow do?" />
      </div>
      <div>
        <label style={lbl}>Builder mode</label>
        <select value={builderMode} onChange={(e) => { onBuilderModeChange(e.target.value); updateWorkflow(workflowId, { builderMode: e.target.value }); }} style={inp}>
          <option value="standard">Standard</option>
          <option value="advanced">Advanced</option>
        </select>
      </div>
      <button onClick={save} disabled={saving}
        style={{ alignSelf: "flex-start", borderRadius: 8, border: "none", background: "#0E90C8", color: "white", padding: "8px 20px", fontSize: 13, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
        {saved ? "Saved!" : saving ? "Saving…" : "Save Settings"}
      </button>
    </div>
  );
}
