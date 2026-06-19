"use client";

import { useState, useCallback, useRef } from "react";
import {
  ReactFlow, Background, Controls, MiniMap, addEdge,
  useNodesState, useEdgesState, BackgroundVariant, Panel,
} from "@xyflow/react";
import type { Node, Edge, Connection } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { WorkflowStep, STEP_TYPES, STEP_DISPLAY, StepType, TriggerType, TRIGGER_DISPLAY } from "@/lib/workflow-types";
import { updateWorkflow, toggleWorkflowStatus, manuallyEnroll } from "@/lib/actions/workflows";
import {
  Plus, Save, Play, Pause, ChevronRight, X, Trash2, Users,
  GitMerge, Clock, Zap, Mail, MessageSquare, Tag, CheckSquare,
  ArrowRight, Globe, Sparkles, Bell, FileText, Edit, Briefcase,
  GitBranch, Flag, StopCircle, UserX, CornerDownRight, Calendar,
} from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<{ size?: number }>> = {
  Mail, MessageSquare, Bell, Tag, Edit, FileText, CheckSquare,
  ArrowRight, Briefcase, GitBranch, Flag, Clock, GitMerge, Calendar,
  CornerDownRight, StopCircle, UserX, Globe, Sparkles, X,
};

// ── Custom Nodes ─────────────────────────────────────────────────────────────

function TriggerNode({ data }: { data: Record<string, unknown> }) {
  const meta = TRIGGER_DISPLAY[data.triggerType as TriggerType];
  return (
    <div style={{ minWidth: 220, borderRadius: 16, border: "2px solid #0E90C8", background: "#030A18", padding: 16, boxShadow: "0 0 24px #0E90C830" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: "#0E90C8", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Zap size={14} color="white" />
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#0E90C8" }}>Trigger</span>
      </div>
      <p style={{ fontSize: 14, fontWeight: 700, color: "white", lineHeight: 1.3 }}>{meta?.label ?? String(data.label ?? "")}</p>
      <p style={{ marginTop: 4, fontSize: 11, color: "#64748B", lineHeight: 1.4 }}>{meta?.description ?? ""}</p>
    </div>
  );
}

function ActionNode({ data, selected }: { data: Record<string, unknown>; selected: boolean }) {
  const step = data.step as WorkflowStep;
  const meta = STEP_DISPLAY[step.type];
  const Icon = meta ? ICON_MAP[meta.icon] : null;
  return (
    <div style={{ minWidth: 220, borderRadius: 12, border: `1px solid ${selected ? "#0E90C8" : "#1E3A5F"}`, background: "#0A1628", padding: 12, cursor: "pointer", boxShadow: selected ? "0 0 0 2px #0E90C820" : "none" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: `${meta?.color ?? "#64748B"}22`, color: meta?.color ?? "#64748B" }}>
          {Icon && <Icon size={14} />}
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{step.label || meta?.label}</p>
          <p style={{ fontSize: 10, color: "#475569" }}>{meta?.category}</p>
        </div>
      </div>
      {step.type === STEP_TYPES.WAIT && step.waitAmount && (
        <p style={{ marginTop: 8, fontSize: 11, color: "#94A3B8" }}>⏱ {step.waitAmount} {step.waitUnit}</p>
      )}
      {step.type === STEP_TYPES.SEND_EMAIL && step.emailSubject && (
        <p style={{ marginTop: 8, fontSize: 11, color: "#94A3B8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>📧 "{step.emailSubject}"</p>
      )}
      {step.type === STEP_TYPES.IF_ELSE && (
        <p style={{ marginTop: 8, fontSize: 11, color: "#94A3B8" }}>🔀 {step.conditions?.length ?? 0} condition(s)</p>
      )}
    </div>
  );
}

const NODE_TYPES = { trigger: TriggerNode, action: ActionNode };
const STEP_CATEGORIES = ["Communication", "Contact", "Pipeline", "Control", "External", "AI"] as const;

// ── Types ────────────────────────────────────────────────────────────────────

type WorkflowData = { id: string; name: string; status: string; triggerType: string; steps: unknown; nodes: unknown; edges: unknown };
type Tag = { id: string; name: string; color: string };
type Pipeline = { id: string; name: string; stages: { id: string; name: string }[] };
type CustomField = { id: string; name: string; type: string };
type Contact = { id: string; companyName: string; email: string | null };

type Props = { workflow: WorkflowData; tags: Tag[]; pipelines: Pipeline[]; customFields: CustomField[]; contacts: Contact[] };

// ── Main Component ───────────────────────────────────────────────────────────

export function WorkflowBuilderClient({ workflow, tags, pipelines, customFields, contacts }: Props) {
  const initSteps = (workflow.steps as WorkflowStep[]) ?? [];
  const savedPositions = (workflow.nodes as { id: string; position: { x: number; y: number } }[]) ?? [];

  const initNodes: Node[] = [
    { id: "trigger", type: "trigger", deletable: false, position: savedPositions.find(n => n.id === "trigger")?.position ?? { x: 300, y: 50 }, data: { triggerType: workflow.triggerType } },
    ...initSteps.map((step, i) => ({
      id: step.id, type: "action" as const,
      position: savedPositions.find(n => n.id === step.id)?.position ?? { x: 300, y: 170 + i * 130 },
      data: { step },
    })),
  ];
  const initEdges: Edge[] = (workflow.edges as Edge[]) ?? [];

  const [nodes, setNodes, onNodesChange] = useNodesState(initNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initEdges);
  const [steps, setSteps] = useState<WorkflowStep[]>(initSteps);
  const [selectedStep, setSelectedStep] = useState<WorkflowStep | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [showEnroll, setShowEnroll] = useState(false);
  const [enrollIds, setEnrollIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(workflow.status);
  const counter = useRef(steps.length);

  const onConnect = useCallback(
    (p: Connection) => setEdges(es => addEdge({ ...p, animated: true, style: { stroke: "#0E90C8", strokeWidth: 2 } }, es)),
    [setEdges]
  );

  function addStep(type: StepType) {
    const id = `step_${Date.now()}_${counter.current++}`;
    const step: WorkflowStep = { id, type, label: STEP_DISPLAY[type]?.label };
    setSteps(s => [...s, step]);
    const last = nodes[nodes.length - 1];
    const node: Node = { id, type: "action", position: { x: last?.position.x ?? 300, y: (last?.position.y ?? 50) + 130 }, data: { step } };
    setNodes(ns => [...ns, node]);
    if (last) setEdges(es => addEdge({ id: `e-${last.id}-${id}`, source: last.id, target: id, animated: true, style: { stroke: "#0E90C8", strokeWidth: 2 } }, es));
    setSelectedStep(step);
    setShowPicker(false);
  }

  function updateStep(updated: WorkflowStep) {
    setSteps(s => s.map(step => step.id === updated.id ? updated : step));
    setSelectedStep(updated);
    setNodes(ns => ns.map(n => n.id === updated.id ? { ...n, data: { step: updated } } : n));
  }

  function deleteStep(id: string) {
    setSteps(s => s.filter(step => step.id !== id));
    setNodes(ns => ns.filter(n => n.id !== id));
    setEdges(es => es.filter(e => e.source !== id && e.target !== id));
    if (selectedStep?.id === id) setSelectedStep(null);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateWorkflow(workflow.id, {
        steps,
        nodes: nodes.map(n => ({ id: n.id, position: n.position })),
        edges: edges.map(e => ({ id: e.id, source: e.source, target: e.target })),
      });
    } finally { setSaving(false); }
  }

  async function handleToggle() {
    await toggleWorkflowStatus(workflow.id);
    setStatus(s => s === "active" ? "paused" : "active");
  }

  async function handleEnroll() {
    await manuallyEnroll(workflow.id, [...enrollIds]);
    setShowEnroll(false); setEnrollIds(new Set());
  }

  const modalBackdrop: React.CSSProperties = { position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)", padding: 24 };
  const modalBox: React.CSSProperties = { background: "#0A1628", border: "1px solid #1E3A5F", borderRadius: 20, boxShadow: "0 25px 60px rgba(0,0,0,0.6)" };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#030A18" }}>

      {/* Top Bar */}
      <div style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #1E3A5F", background: "#0A1628", padding: "12px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <a href="/automations" style={{ fontSize: 13, color: "#64748B", textDecoration: "none" }}>← Automations</a>
          <ChevronRight size={14} color="#374151" />
          <span style={{ fontSize: 14, fontWeight: 600, color: "white" }}>{workflow.name}</span>
          <span style={{ borderRadius: 999, padding: "2px 10px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", background: status === "active" ? "#10B98120" : status === "paused" ? "#F59E0B20" : "#1E3A5F", color: status === "active" ? "#10B981" : status === "paused" ? "#F59E0B" : "#94A3B8" }}>{status}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={() => setShowEnroll(true)} style={{ display: "flex", alignItems: "center", gap: 6, borderRadius: 8, border: "1px solid #1E3A5F", padding: "6px 12px", fontSize: 12, color: "#94A3B8", background: "transparent", cursor: "pointer" }}>
            <Users size={13} /> Enroll Contacts
          </button>
          <button onClick={handleSave} disabled={saving} style={{ display: "flex", alignItems: "center", gap: 6, borderRadius: 8, border: "1px solid #1E3A5F", padding: "6px 12px", fontSize: 12, color: "#94A3B8", background: "transparent", cursor: "pointer" }}>
            <Save size={13} /> {saving ? "Saving…" : "Save"}
          </button>
          <button onClick={handleToggle} style={{ display: "flex", alignItems: "center", gap: 6, borderRadius: 8, border: "none", padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", background: status === "active" ? "#F59E0B20" : "#10B98120", color: status === "active" ? "#F59E0B" : "#10B981" }}>
            {status === "active" ? <><Pause size={13} /> Pause</> : <><Play size={13} /> Activate</>}
          </button>
        </div>
      </div>

      {/* Canvas + Sidebar */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <div style={{ flex: 1 }}>
          <ReactFlow
            nodes={nodes} edges={edges}
            onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect}
            nodeTypes={NODE_TYPES}
            onNodeClick={(_, node) => { if (node.type === "action") setSelectedStep((node.data as { step: WorkflowStep }).step); }}
            fitView style={{ background: "#030A18" }}
          >
            <Background color="#1E3A5F" variant={BackgroundVariant.Dots} gap={24} size={1} />
            <Controls style={{ background: "#0A1628", border: "1px solid #1E3A5F", borderRadius: 8 }} />
            <MiniMap style={{ background: "#0A1628", border: "1px solid #1E3A5F" }} nodeColor="#0E90C8" maskColor="rgba(3,10,24,0.85)" />
            <Panel position="bottom-center">
              <button onClick={() => setShowPicker(true)} style={{ display: "flex", alignItems: "center", gap: 8, borderRadius: 999, background: "linear-gradient(135deg, #0E90C8, #8B5CF6)", padding: "10px 24px", fontSize: 14, fontWeight: 700, color: "white", border: "none", cursor: "pointer", boxShadow: "0 4px 24px #0E90C840" }}>
                <Plus size={16} /> Add Step
              </button>
            </Panel>
          </ReactFlow>
        </div>

        {/* Step Editor */}
        {selectedStep && (
          <div style={{ width: 320, flexShrink: 0, borderLeft: "1px solid #1E3A5F", background: "#0A1628", overflowY: "auto", padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h3 style={{ color: "white", fontWeight: 600, fontSize: 14 }}>{STEP_DISPLAY[selectedStep.type]?.label}</h3>
              <div style={{ display: "flex", gap: 4 }}>
                <button onClick={() => deleteStep(selectedStep.id)} style={{ borderRadius: 6, padding: 6, background: "transparent", border: "none", color: "#EF4444", cursor: "pointer" }}><Trash2 size={14} /></button>
                <button onClick={() => setSelectedStep(null)} style={{ borderRadius: 6, padding: 6, background: "transparent", border: "none", color: "#64748B", cursor: "pointer" }}><X size={14} /></button>
              </div>
            </div>
            <StepEditor step={selectedStep} onChange={updateStep} tags={tags} pipelines={pipelines} customFields={customFields} />
          </div>
        )}
      </div>

      {/* Step Picker Modal */}
      {showPicker && (
        <div style={modalBackdrop}>
          <div style={{ ...modalBox, width: "100%", maxWidth: 680, maxHeight: "85vh", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #1E3A5F", padding: "16px 24px" }}>
              <h2 style={{ color: "white", fontWeight: 700, fontSize: 16 }}>Add a Step</h2>
              <button onClick={() => setShowPicker(false)} style={{ background: "transparent", border: "none", color: "#64748B", cursor: "pointer" }}><X size={18} /></button>
            </div>
            <div style={{ overflowY: "auto", padding: 24, display: "flex", flexDirection: "column", gap: 24 }}>
              {STEP_CATEGORIES.map(cat => {
                const items = Object.entries(STEP_DISPLAY).filter(([, m]) => m.category === cat);
                return (
                  <div key={cat}>
                    <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#475569", marginBottom: 8 }}>{cat}</p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {items.map(([type, meta]) => {
                        const Icon = ICON_MAP[meta.icon];
                        return (
                          <button key={type} onClick={() => addStep(type as StepType)}
                            style={{ display: "flex", alignItems: "flex-start", gap: 12, borderRadius: 12, border: "1px solid #1E3A5F", background: "#030A18", padding: 12, textAlign: "left", cursor: "pointer", transition: "border-color 0.15s" }}
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#0E90C8"; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#1E3A5F"; }}>
                            <div style={{ width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2, background: `${meta.color}22`, color: meta.color }}>
                              {Icon ? <Icon size={14} /> : null}
                            </div>
                            <div>
                              <p style={{ fontSize: 12, fontWeight: 600, color: "white", lineHeight: 1.3 }}>{meta.label}</p>
                              <p style={{ fontSize: 10, color: "#64748B", marginTop: 3, lineHeight: 1.4 }}>{meta.description}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Enroll Modal */}
      {showEnroll && (
        <div style={modalBackdrop}>
          <div style={{ ...modalBox, width: "100%", maxWidth: 460 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #1E3A5F", padding: "16px 24px" }}>
              <h2 style={{ color: "white", fontWeight: 700, fontSize: 16 }}>Manually Enroll Contacts</h2>
              <button onClick={() => setShowEnroll(false)} style={{ background: "transparent", border: "none", color: "#64748B", cursor: "pointer" }}><X size={18} /></button>
            </div>
            <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, color: "#94A3B8" }}>{enrollIds.size} selected</span>
                <button onClick={() => setEnrollIds(new Set(contacts.map(c => c.id)))} style={{ fontSize: 12, color: "#0E90C8", background: "transparent", border: "none", cursor: "pointer" }}>Select all</button>
              </div>
              <div style={{ maxHeight: 240, overflowY: "auto", borderRadius: 12, border: "1px solid #1E3A5F", padding: 8, display: "flex", flexDirection: "column", gap: 2 }}>
                {contacts.map(c => (
                  <label key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, borderRadius: 8, padding: "8px 10px", cursor: "pointer" }}>
                    <input type="checkbox" checked={enrollIds.has(c.id)} onChange={e => setEnrollIds(p => { const n = new Set(p); e.target.checked ? n.add(c.id) : n.delete(c.id); return n; })} />
                    <span style={{ flex: 1, fontSize: 13, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.companyName}</span>
                    <span style={{ fontSize: 11, color: "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.email}</span>
                  </label>
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, borderTop: "1px solid #1E3A5F", paddingTop: 16 }}>
                <button onClick={() => setShowEnroll(false)} style={{ borderRadius: 10, border: "1px solid #1E3A5F", padding: "8px 16px", fontSize: 13, color: "#94A3B8", background: "transparent", cursor: "pointer" }}>Cancel</button>
                <button onClick={handleEnroll} disabled={enrollIds.size === 0} style={{ display: "flex", alignItems: "center", gap: 6, borderRadius: 10, border: "none", padding: "8px 16px", fontSize: 13, fontWeight: 600, color: "white", background: "linear-gradient(135deg, #0E90C8, #6366F1)", cursor: enrollIds.size === 0 ? "not-allowed" : "pointer", opacity: enrollIds.size === 0 ? 0.4 : 1 }}>
                  <Play size={12} /> Enroll {enrollIds.size}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Step Editor Panel ─────────────────────────────────────────────────────────

function StepEditor({ step, onChange, tags, pipelines, customFields }: { step: WorkflowStep; onChange: (s: WorkflowStep) => void; tags: Tag[]; pipelines: Pipeline[]; customFields: CustomField[] }) {
  const patch = (u: Partial<WorkflowStep>) => onChange({ ...step, ...u });
  const inp: React.CSSProperties = { width: "100%", borderRadius: 8, border: "1px solid #1E3A5F", background: "#030A18", color: "white", padding: "8px 10px", fontSize: 13, outline: "none", boxSizing: "border-box" };
  const lbl: React.CSSProperties = { display: "block", fontSize: 11, fontWeight: 500, color: "#64748B", marginBottom: 4 };
  const wrap: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 12 };
  const F = ({ label, children }: { label: string; children: React.ReactNode }) => <div><label style={lbl}>{label}</label>{children}</div>;

  switch (step.type) {
    case STEP_TYPES.SEND_EMAIL: return (
      <div style={wrap}>
        <F label="Step label"><input value={step.label ?? ""} onChange={e => patch({ label: e.target.value })} style={inp} placeholder="e.g. Send Welcome Email" /></F>
        <F label="Subject"><input value={step.emailSubject ?? ""} onChange={e => patch({ emailSubject: e.target.value })} style={inp} placeholder="Subject (supports {{firstName}})" /></F>
        <F label="Body (HTML)"><textarea value={step.emailBody ?? ""} onChange={e => patch({ emailBody: e.target.value })} rows={7} style={{ ...inp, resize: "vertical" }} placeholder="<p>Hi {{firstName}},</p>" /></F>
        <p style={{ fontSize: 10, color: "#475569" }}>Vars: {"{{firstName}} {{companyName}} {{senderName}} {{email}}"}</p>
      </div>
    );
    case STEP_TYPES.SEND_SMS: return (
      <div style={wrap}>
        <F label="Step label"><input value={step.label ?? ""} onChange={e => patch({ label: e.target.value })} style={inp} placeholder="Send SMS" /></F>
        <F label="Message"><textarea value={step.smsBody ?? ""} onChange={e => patch({ smsBody: e.target.value })} rows={4} style={{ ...inp, resize: "vertical" }} placeholder="Hi {{firstName}}…" /></F>
        <p style={{ fontSize: 10, color: "#475569" }}>Requires SENDBLUE_API_KEY env var</p>
      </div>
    );
    case STEP_TYPES.WAIT: return (
      <div style={wrap}>
        <F label="Wait duration">
          <div style={{ display: "flex", gap: 8 }}>
            <input type="number" min={1} value={step.waitAmount ?? 1} onChange={e => patch({ waitAmount: Number(e.target.value) })} style={{ ...inp, width: 80 }} />
            <select value={step.waitUnit ?? "days"} onChange={e => patch({ waitUnit: e.target.value as "minutes" | "hours" | "days" })} style={{ ...inp, flex: 1 }}>
              <option value="minutes">Minutes</option><option value="hours">Hours</option><option value="days">Days</option>
            </select>
          </div>
        </F>
      </div>
    );
    case STEP_TYPES.ADD_TAG:
    case STEP_TYPES.REMOVE_TAG: return (
      <div style={wrap}>
        <F label={step.type === STEP_TYPES.ADD_TAG ? "Tag to add" : "Tag to remove"}>
          <select value={step.tagId ?? ""} onChange={e => { const t = tags.find(t => t.id === e.target.value); patch({ tagId: e.target.value, tagName: t?.name }); }} style={inp}>
            <option value="">Select tag…</option>
            {tags.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </F>
      </div>
    );
    case STEP_TYPES.UPDATE_CONTACT_FIELD: return (
      <div style={wrap}>
        <F label="Custom field">
          <select value={step.fieldId ?? ""} onChange={e => patch({ fieldId: e.target.value })} style={inp}>
            <option value="">Select field…</option>
            {customFields.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </F>
        <F label="New value"><input value={step.fieldValue ?? ""} onChange={e => patch({ fieldValue: e.target.value })} style={inp} placeholder="Value (supports merge vars)" /></F>
      </div>
    );
    case STEP_TYPES.ADD_NOTE: return (
      <div style={wrap}><F label="Note content"><textarea value={step.noteContent ?? ""} onChange={e => patch({ noteContent: e.target.value })} rows={4} style={{ ...inp, resize: "vertical" }} /></F></div>
    );
    case STEP_TYPES.ADD_TASK: return (
      <div style={wrap}>
        <F label="Task title"><input value={step.taskTitle ?? ""} onChange={e => patch({ taskTitle: e.target.value })} style={inp} placeholder="Follow up with {{companyName}}" /></F>
        <F label="Due in (days)"><input type="number" min={0} value={step.taskDueDays ?? 1} onChange={e => patch({ taskDueDays: Number(e.target.value) })} style={inp} /></F>
      </div>
    );
    case STEP_TYPES.UPDATE_STAGE: return (
      <div style={wrap}>
        <F label="New outreach stage">
          <select value={step.newStage ?? ""} onChange={e => patch({ newStage: e.target.value })} style={inp}>
            <option value="">Select stage…</option>
            {["RESEARCHING","CONTACTED","FOLLOWED_UP","NEGOTIATING","APPROVED","REJECTED","ONBOARDED"].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </F>
      </div>
    );
    case STEP_TYPES.CREATE_OPPORTUNITY:
    case STEP_TYPES.MOVE_OPPORTUNITY: return (
      <div style={wrap}>
        <F label="Pipeline">
          <select value={step.pipelineId ?? ""} onChange={e => patch({ pipelineId: e.target.value, stageId: "" })} style={inp}>
            <option value="">Select pipeline…</option>
            {pipelines.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </F>
        {step.pipelineId && (
          <F label="Stage">
            <select value={step.stageId ?? ""} onChange={e => patch({ stageId: e.target.value })} style={inp}>
              <option value="">Select stage…</option>
              {pipelines.find(p => p.id === step.pipelineId)?.stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </F>
        )}
        {step.type === STEP_TYPES.CREATE_OPPORTUNITY && (
          <F label="Opportunity name"><input value={step.opportunityName ?? ""} onChange={e => patch({ opportunityName: e.target.value })} style={inp} placeholder="{{companyName}} – Deal" /></F>
        )}
      </div>
    );
    case STEP_TYPES.SEND_INTERNAL_NOTIFY: return (
      <div style={wrap}>
        <F label="Notify email"><input value={step.notifyTo ?? ""} onChange={e => patch({ notifyTo: e.target.value })} style={inp} placeholder="team@example.com" /></F>
        <F label="Subject"><input value={step.notifySubject ?? ""} onChange={e => patch({ notifySubject: e.target.value })} style={inp} placeholder="New lead: {{companyName}}" /></F>
        <F label="Message"><textarea value={step.notifyBody ?? ""} onChange={e => patch({ notifyBody: e.target.value })} rows={3} style={{ ...inp, resize: "vertical" }} /></F>
      </div>
    );
    case STEP_TYPES.WEBHOOK: return (
      <div style={wrap}>
        <F label="URL"><input value={step.webhookUrl ?? ""} onChange={e => patch({ webhookUrl: e.target.value })} style={inp} placeholder="https://…" /></F>
        <F label="Method">
          <select value={step.webhookMethod ?? "POST"} onChange={e => patch({ webhookMethod: e.target.value as "POST" | "GET" | "PUT" })} style={inp}>
            <option>POST</option><option>GET</option><option>PUT</option>
          </select>
        </F>
        <F label="Body (JSON)"><textarea value={step.webhookBody ?? ""} onChange={e => patch({ webhookBody: e.target.value })} rows={4} style={{ ...inp, fontFamily: "monospace", fontSize: 11, resize: "vertical" }} placeholder={'{"contact": "{{companyName}}"}'} /></F>
      </div>
    );
    case STEP_TYPES.AI_ACTION: return (
      <div style={wrap}>
        <F label="AI prompt"><textarea value={step.aiPrompt ?? ""} onChange={e => patch({ aiPrompt: e.target.value })} rows={5} style={{ ...inp, resize: "vertical" }} placeholder="Write an outreach email for {{companyName}}…" /></F>
        <p style={{ fontSize: 10, color: "#475569" }}>Requires OPENAI_API_KEY. Output saved as contact note.</p>
      </div>
    );
    case STEP_TYPES.IF_ELSE: return (
      <div style={wrap}>
        <p style={{ fontSize: 11, color: "#64748B" }}>Contacts matching ALL conditions → Yes branch:</p>
        {(step.conditions ?? []).map((c, i) => (
          <div key={i} style={{ borderRadius: 10, border: "1px solid #1E3A5F", padding: 10, display: "flex", flexDirection: "column", gap: 6 }}>
            <input value={c.field} onChange={e => { const cs = [...(step.conditions ?? [])]; cs[i] = { ...cs[i], field: e.target.value }; patch({ conditions: cs }); }} style={inp} placeholder="Field (stage, email, tag…)" />
            <select value={c.operator} onChange={e => { const cs = [...(step.conditions ?? [])]; cs[i] = { ...cs[i], operator: e.target.value as "equals" }; patch({ conditions: cs }); }} style={inp}>
              {["equals","not_equals","contains","not_contains","is_empty","is_not_empty","greater_than","less_than"].map(op => <option key={op} value={op}>{op}</option>)}
            </select>
            <input value={c.value ?? ""} onChange={e => { const cs = [...(step.conditions ?? [])]; cs[i] = { ...cs[i], value: e.target.value }; patch({ conditions: cs }); }} style={inp} placeholder="Value" />
            <button onClick={() => patch({ conditions: (step.conditions ?? []).filter((_, j) => j !== i) })} style={{ fontSize: 10, color: "#EF4444", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}>Remove</button>
          </div>
        ))}
        <button onClick={() => patch({ conditions: [...(step.conditions ?? []), { field: "", operator: "equals" as const, value: "" }] })} style={{ fontSize: 12, color: "#0E90C8", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}>+ Add condition</button>
      </div>
    );
    default: return (
      <div style={wrap}><F label="Step label"><input value={step.label ?? ""} onChange={e => patch({ label: e.target.value })} style={inp} placeholder="Label this step…" /></F></div>
    );
  }
}
