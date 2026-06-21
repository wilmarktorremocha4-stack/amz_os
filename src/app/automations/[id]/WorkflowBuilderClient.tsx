"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  X, Plus, ChevronDown, Search,
  History, FileText, Puzzle,
  Zap, Mail, Bell, Tag, Edit3, CheckSquare, ArrowRight,
  Briefcase, GitBranch, Flag, GitMerge, Calendar,
  CornerDownRight, StopCircle, UserX, Globe, Sparkles,
  UserPlus, Send, MousePointer, AlertCircle, UserMinus,
  BadgeCheck, Store, ArrowRightCircle, CheckCircle2,
  Trash2, Save, ChevronRight, Move, MessageSquare, Clock,
} from "lucide-react";
import {
  TRIGGER_DISPLAY, TriggerType, TriggerConfig,
  STEP_DISPLAY, STEP_TYPES, StepType, WorkflowStep,
} from "@/lib/workflow-types";
import {
  updateWorkflow, testWorkflowStep, listWorkflowsForPicker,
} from "@/lib/actions/workflows";
import { TriggerConfigPanel } from "@/components/workflow/TriggerConfigPanel";
import { WorkflowSettingsTab } from "@/components/workflow/WorkflowSettingsTab";
import { WorkflowEnrollmentsTab } from "@/components/workflow/WorkflowEnrollmentsTab";
import { WorkflowLogsTab } from "@/components/workflow/WorkflowLogsTab";
import { WorkflowNotesPanel } from "@/components/workflow/WorkflowNotesPanel";
import { WorkflowVersionPanel } from "@/components/workflow/WorkflowVersionPanel";
import { WorkflowIntegrationsPanel } from "@/components/workflow/WorkflowIntegrationsPanel";

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; style?: React.CSSProperties }>> = {
  Mail, MessageSquare, Bell, Tag, Edit3, FileText, CheckSquare,
  ArrowRight, Briefcase, GitBranch, Flag, Clock, GitMerge, Calendar,
  CornerDownRight, StopCircle, UserX, Globe, Sparkles, X,
  UserPlus, Send, MousePointer, AlertCircle, UserMinus,
  BadgeCheck, Store, ArrowRightCircle, CheckCircle2,
  CheckCircle: CheckCircle2,
};
function Icon({ name, size = 14, style }: { name: string; size?: number; style?: React.CSSProperties }) {
  const C = ICON_MAP[name] ?? Zap;
  return <C size={size} style={style} />;
}

type WorkflowData = {
  id: string; name: string; status: string; triggerType: string; triggerConfig: unknown;
  steps: unknown; description: string | null;
};
type TagItem = { id: string; name: string; color: string };
type Pipeline = { id: string; name: string; stages: { id: string; name: string }[] };
type CustomField = { id: string; name: string; type: string };
type Contact = { id: string; companyName: string; email: string | null };
type Props = { workflow: WorkflowData; tags: TagItem[]; pipelines: Pipeline[]; customFields: CustomField[]; contacts: Contact[] };
type PanelMode = "trigger-picker" | "trigger-config" | "step-picker" | "step-editor" | null;
type SidePanel = "notes" | "versions" | "integrations" | null;
type Tool = "pointer" | "hand";
type TestLog = { id: string; stepLabel: string | null; stepType: string | null; status: string; message: string | null; errorDetail: string | null; durationMs: number | null };

const TRIGGER_CATS = ["Contact", "Email", "Pipeline", "Sourcing", "System"] as const;
const STEP_CATS = ["Communication", "Contact", "Pipeline", "Control", "External", "AI"] as const;

function catColor(cat: string) {
  const m: Record<string, string> = { Communication: "#0E90C8", Contact: "#F59E0B", Pipeline: "#8B5CF6", Control: "#64748B", External: "#10B981", AI: "#EC4899" };
  return m[cat] ?? "#64748B";
}

export function WorkflowBuilderClient({ workflow, tags, pipelines, customFields, contacts }: Props) {
  const initSteps = (workflow.steps as WorkflowStep[]) ?? [];
  const [name, setName] = useState(workflow.name);
  const [editingName, setEditingName] = useState(false);
  const [triggerType, setTriggerType] = useState<TriggerType | "">(workflow.triggerType as TriggerType | "");
  const [triggerConfig, setTriggerConfig] = useState<TriggerConfig>((workflow.triggerConfig as TriggerConfig) ?? {});
  const [steps, setSteps] = useState<WorkflowStep[]>(initSteps);
  const [status, setStatus] = useState(workflow.status);
  const [builderMode, setBuilderMode] = useState(() => {
    if (typeof window === "undefined") return "standard";
    return localStorage.getItem(`wf_mode_${workflow.id}`) ?? "standard";
  });
  const [panelMode, setPanelMode] = useState<PanelMode>(null);
  const [sidePanel, setSidePanel] = useState<SidePanel>(null);
  const [insertAfterIdx, setInsertAfterIdx] = useState(-1);
  const [activeStepId, setActiveStepId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveOk, setSaveOk] = useState(false);
  const [activeTab, setActiveTab] = useState<"builder" | "settings" | "enrollments" | "logs">("builder");
  const [tool, setTool] = useState<Tool>("pointer");
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [showTestModal, setShowTestModal] = useState(false);
  const [testContactId, setTestContactId] = useState(contacts[0]?.id ?? "");
  const [testRunning, setTestRunning] = useState(false);
  const [testLogs, setTestLogs] = useState<TestLog[] | null>(null);
  const [otherWorkflows, setOtherWorkflows] = useState<{ id: string; name: string }[]>([]);

  const isPanning = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const counter = useRef(initSteps.length);
  const canvasRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeStep = steps.find((s) => s.id === activeStepId) ?? null;
  const triggerMeta = triggerType ? TRIGGER_DISPLAY[triggerType as TriggerType] : null;

  // Keyboard shortcut
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "h" || e.key === "H") setTool("hand");
      if (e.key === "v" || e.key === "V") setTool("pointer");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const save = useCallback(async (overrides?: Partial<{
    name: string; triggerType: TriggerType | ""; triggerConfig: TriggerConfig;
    steps: WorkflowStep[]; status: string;
  }>) => {
    setSaving(true);
    try {
      await updateWorkflow(workflow.id, {
        name: overrides?.name ?? name,
        triggerType: (overrides?.triggerType ?? triggerType) as TriggerType,
        triggerConfig: overrides?.triggerConfig ?? triggerConfig,
        steps: overrides?.steps ?? steps,
        status: (overrides?.status ?? status) as "draft" | "active" | "paused",
      });
      setSaveOk(true);
      setTimeout(() => setSaveOk(false), 1500);
    } finally { setSaving(false); }
  }, [workflow.id, name, triggerType, triggerConfig, steps, status, builderMode]);

  const saveRef = useRef(save);
  useEffect(() => { saveRef.current = save; }, [save]);

  function scheduleAutoSave(overrides?: Parameters<typeof save>[0]) {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => saveRef.current(overrides), 2000);
  }

  function selectTrigger(t: TriggerType) { setTriggerType(t); setPanelMode("trigger-config"); scheduleAutoSave({ triggerType: t }); }
  function removeTrigger() { setTriggerType(""); setTriggerConfig({}); save({ triggerType: "", triggerConfig: {} }); }
  function openStepPicker(afterIdx: number) { setInsertAfterIdx(afterIdx); setSearch(""); setPanelMode("step-picker"); setActiveStepId(null); setSidePanel(null); }

  function addStep(type: StepType) {
    const id = `step_${Date.now()}_${counter.current++}`;
    const step: WorkflowStep = { id, type, label: STEP_DISPLAY[type]?.label };
    const newSteps = insertAfterIdx === -1 || insertAfterIdx >= steps.length - 1
      ? [...steps, step]
      : [...steps.slice(0, insertAfterIdx + 1), step, ...steps.slice(insertAfterIdx + 1)];
    setSteps(newSteps); setActiveStepId(id); setPanelMode("step-editor");
    scheduleAutoSave({ steps: newSteps });
    if (type === STEP_TYPES.ENROLL_IN_WORKFLOW && otherWorkflows.length === 0) {
      listWorkflowsForPicker(workflow.id).then(setOtherWorkflows);
    }
  }

  function updateStep(updated: WorkflowStep) {
    const n = steps.map((s) => s.id === updated.id ? updated : s);
    setSteps(n);
    scheduleAutoSave({ steps: n });
  }

  function deleteStep(id: string) {
    const n = steps.filter((s) => s.id !== id); setSteps(n);
    if (activeStepId === id) { setActiveStepId(null); setPanelMode(null); }
    scheduleAutoSave({ steps: n });
  }

  function openStepEditor(id: string) {
    setActiveStepId(id); setPanelMode("step-editor"); setSidePanel(null);
    const step = steps.find((s) => s.id === id);
    if (step?.type === STEP_TYPES.ENROLL_IN_WORKFLOW && otherWorkflows.length === 0) {
      listWorkflowsForPicker(workflow.id).then(setOtherWorkflows);
    }
  }

  async function handlePublishToggle() {
    if (status !== "active" && steps.length === 0) return;
    const next = status === "active" ? "draft" : "active";
    setStatus(next);
    await save({ status: next });
  }

  function commitName() { setEditingName(false); scheduleAutoSave({ name }); }

  function toggleSidePanel(panel: SidePanel) {
    setSidePanel((prev) => prev === panel ? null : panel);
    if (panel !== null) { setPanelMode(null); setActiveStepId(null); }
  }

  async function runTest() {
    if (!testContactId) return;
    setTestRunning(true);
    setTestLogs(null);
    try {
      const logs = await testWorkflowStep(workflow.id, testContactId);
      setTestLogs(logs as unknown as TestLog[]);
    } catch (e) {
      setTestLogs([{ id: "err", stepLabel: "Error", stepType: null, status: "failed", message: null, errorDetail: e instanceof Error ? e.message : String(e), durationMs: null }]);
    } finally { setTestRunning(false); }
  }

  function handleTriggerConfigChange(cfg: TriggerConfig) {
    setTriggerConfig(cfg);
    scheduleAutoSave({ triggerConfig: cfg });
  }

  // Pan handlers
  function onMouseDown(e: React.MouseEvent) {
    if (tool !== "hand") return;
    isPanning.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
  }
  function onMouseMove(e: React.MouseEvent) {
    if (!isPanning.current) return;
    setPanX((p) => p + e.clientX - lastPos.current.x);
    setPanY((p) => p + e.clientY - lastPos.current.y);
    lastPos.current = { x: e.clientX, y: e.clientY };
  }
  function onMouseUp() { isPanning.current = false; }

  const TAB_LABELS = { builder: "Builder", settings: "Settings", enrollments: "Enrollment History", logs: "Execution Logs" } as const;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", flexDirection: "column", background: "var(--background)" }}>
      {/* Top bar */}
      <div style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border)", background: "var(--surface)", padding: "0 16px", height: 50, gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
          <Link href="/automations" style={{ fontSize: 12, color: "var(--muted)", textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0 }}>
            ← Workflows list
          </Link>
          <span style={{ color: "var(--border)", flexShrink: 0 }}>│</span>
          {editingName ? (
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)}
              onBlur={commitName} onKeyDown={(e) => { if (e.key === "Enter") commitName(); if (e.key === "Escape") setEditingName(false); }}
              style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)", background: "transparent", border: "none", borderBottom: "2px solid #3B82F6", outline: "none", minWidth: 120, maxWidth: 260 }} />
          ) : (
            <span onClick={() => setEditingName(true)} title="Click to rename"
              style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)", cursor: "text", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 260 }}>
              {name}
            </span>
          )}
          {builderMode === "advanced" && (
            <span style={{ fontSize: 10, background: "#8B5CF620", color: "#8B5CF6", border: "1px solid #8B5CF630", borderRadius: 999, padding: "1px 7px", fontWeight: 600 }}>Advanced</span>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", alignItems: "stretch", height: "100%", flexShrink: 0 }}>
          {(["builder", "settings", "enrollments", "logs"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{ padding: "0 14px", fontSize: 12, fontWeight: activeTab === tab ? 600 : 400, color: activeTab === tab ? "#3B82F6" : "var(--muted)", background: "transparent", border: "none", borderBottom: activeTab === tab ? "2px solid #3B82F6" : "2px solid transparent", cursor: "pointer" }}>
              {TAB_LABELS[tab]}
            </button>
          ))}
        </div>

        {/* Right actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <select value={builderMode} onChange={(e) => { setBuilderMode(e.target.value); localStorage.setItem(`wf_mode_${workflow.id}`, e.target.value); }}
            style={{ borderRadius: 7, border: "1px solid var(--border)", padding: "5px 10px", fontSize: 12, color: "var(--muted)", background: "var(--surface)", cursor: "pointer" }}>
            <option value="standard">Standard builder</option>
            <option value="advanced">Advanced builder</option>
          </select>
          <button onClick={() => setShowTestModal(true)}
            style={{ borderRadius: 7, border: "1px solid var(--border)", padding: "5px 10px", fontSize: 12, color: "var(--muted)", background: "transparent", cursor: "pointer" }}>
            Test workflow
          </button>
          <button onClick={() => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); save(); }} disabled={saving}
            style={{ display: "flex", alignItems: "center", gap: 4, borderRadius: 7, border: "1px solid var(--border)", padding: "5px 10px", fontSize: 12, color: saveOk ? "#10B981" : "var(--muted)", background: "transparent", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1 }}>
            <Save size={12} /> {saving ? "Saving…" : saveOk ? "Saved!" : "Save"}
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 6, paddingLeft: 4, borderLeft: "1px solid var(--border)" }} title={steps.length === 0 && status !== "active" ? "Add steps before publishing" : undefined}>
            <span style={{ fontSize: 12, color: status !== "active" ? "var(--foreground)" : "var(--muted)", fontWeight: status !== "active" ? 600 : 400 }}>Draft</span>
            <button
              onClick={handlePublishToggle}
              title={steps.length === 0 && status !== "active" ? "Add at least one step before publishing" : undefined}
              style={{ width: 36, height: 20, borderRadius: 999, border: "none", cursor: steps.length === 0 && status !== "active" ? "not-allowed" : "pointer", background: status === "active" ? "#3B82F6" : "#CBD5E1", position: "relative", transition: "background 0.2s", flexShrink: 0, opacity: steps.length === 0 && status !== "active" ? 0.5 : 1 }}>
              <span style={{ position: "absolute", top: 2, left: status === "active" ? 18 : 2, width: 16, height: 16, borderRadius: "50%", background: "white", transition: "left 0.2s", display: "block", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
            </button>
            <span style={{ fontSize: 12, color: status === "active" ? "#3B82F6" : "var(--muted)", fontWeight: status === "active" ? 600 : 400 }}>Published</span>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      {activeTab !== "builder" ? (
        <div style={{ flex: 1, overflow: "auto" }}>
          {activeTab === "settings" && <WorkflowSettingsTab workflowId={workflow.id} initialName={name} initialDescription={workflow.description ?? ""} initialBuilderMode={builderMode} />}
          {activeTab === "enrollments" && <WorkflowEnrollmentsTab workflowId={workflow.id} totalSteps={steps.length} />}
          {activeTab === "logs" && <WorkflowLogsTab workflowId={workflow.id} />}
        </div>
      ) : (
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {/* Left icon sidebar */}
          <div style={{ width: 44, flexShrink: 0, borderRight: "1px solid var(--border)", background: "var(--surface)", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 10, gap: 2 }}>
            <button onClick={() => setTool("pointer")} title="Select (V)"
              style={{ width: 34, height: 34, borderRadius: 7, border: `1px solid ${tool === "pointer" ? "#3B82F6" : "transparent"}`, background: tool === "pointer" ? "#EFF6FF" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: tool === "pointer" ? "#3B82F6" : "var(--muted)" }}>
              <MousePointer size={15} />
            </button>
            <button onClick={() => setTool("hand")} title="Pan (H)"
              style={{ width: 34, height: 34, borderRadius: 7, border: `1px solid ${tool === "hand" ? "#3B82F6" : "transparent"}`, background: tool === "hand" ? "#EFF6FF" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: tool === "hand" ? "#3B82F6" : "var(--muted)" }}>
              <Move size={15} />
            </button>
            <div style={{ width: 28, height: 1, background: "var(--border)", margin: "4px 0" }} />
            {([
              { icon: FileText, key: "notes" as SidePanel, title: "Notes" },
              { icon: History, key: "versions" as SidePanel, title: "Version History" },
              { icon: Puzzle, key: "integrations" as SidePanel, title: "Integrations" },
            ]).map(({ icon: IC, key, title }) => (
              <button key={key} onClick={() => toggleSidePanel(key)} title={title}
                style={{ width: 34, height: 34, borderRadius: 7, border: `1px solid ${sidePanel === key ? "#3B82F6" : "transparent"}`, background: sidePanel === key ? "#EFF6FF" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: sidePanel === key ? "#3B82F6" : "var(--muted)" }}>
                <IC size={15} />
              </button>
            ))}
          </div>

          {/* Canvas */}
          <div
            ref={canvasRef}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            style={{
              flex: 1, overflow: "hidden",
              background: "#F0F2F7",
              backgroundImage: "radial-gradient(circle, #C8CDD8 1px, transparent 1px)",
              backgroundSize: "24px 24px",
              cursor: tool === "hand" ? (isPanning.current ? "grabbing" : "grab") : "default",
              userSelect: "none",
            }}>
            <div style={{ transform: `translate(${panX}px, ${panY}px)`, paddingTop: 48, paddingBottom: 80, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: 480, display: "flex", flexDirection: "column", alignItems: "center" }}>
                {/* Trigger node */}
                <TriggerCard
                  triggerMeta={triggerMeta}
                  triggerType={triggerType}
                  onClickEmpty={() => { if (tool !== "hand") { setSearch(""); setPanelMode("trigger-picker"); setSidePanel(null); } }}
                  onEdit={() => { if (tool !== "hand") { setPanelMode(triggerType ? "trigger-config" : "trigger-picker"); setSidePanel(null); } }}
                  onRemove={removeTrigger}
                  disabled={tool === "hand"}
                />
                <NodeConnector onAdd={() => { if (tool !== "hand") openStepPicker(-1); }} />
                {steps.map((step, idx) => {
                  const meta = STEP_DISPLAY[step.type];
                  const color = meta ? catColor(meta.category) : "#64748B";
                  return (
                    <div key={step.id} style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <StepCard step={step} meta={meta} color={color} isActive={activeStepId === step.id}
                        onClick={() => { if (tool !== "hand") openStepEditor(step.id); }}
                        onDelete={() => deleteStep(step.id)} />
                      <NodeConnector onAdd={() => { if (tool !== "hand") openStepPicker(idx); }} />
                    </div>
                  );
                })}
                <div style={{ borderRadius: 999, border: "1px solid #CBD5E1", background: "white", padding: "6px 28px", fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.08em", textTransform: "uppercase", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                  END
                </div>
              </div>
            </div>
          </div>

          {/* Right slide-in panel (step/trigger editing) */}
          {panelMode && !sidePanel && (
            <div style={{ width: 360, flexShrink: 0, borderLeft: "1px solid var(--border)", background: "var(--surface)", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "-4px 0 16px rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--foreground)" }}>
                  {panelMode === "trigger-picker" ? "Choose a Trigger" : panelMode === "trigger-config" ? "Configure Trigger" : panelMode === "step-picker" ? "Add an Action" : "Edit Step"}
                </span>
                <button onClick={() => { setPanelMode(null); setActiveStepId(null); }}
                  style={{ width: 26, height: 26, borderRadius: 6, border: "none", background: "var(--accent-soft)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)" }}>
                  <X size={14} />
                </button>
              </div>
              {(panelMode === "trigger-picker" || panelMode === "step-picker") && (
                <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, borderRadius: 8, border: "1px solid var(--border)", padding: "7px 10px", background: "var(--background)" }}>
                    <Search size={13} style={{ color: "var(--muted)", flexShrink: 0 }} />
                    <input autoFocus value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…"
                      style={{ border: "none", background: "transparent", fontSize: 13, color: "var(--foreground)", outline: "none", width: "100%" }} />
                  </div>
                </div>
              )}
              <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px" }}>
                {panelMode === "trigger-picker" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                    {TRIGGER_CATS.map((cat) => {
                      const items = Object.entries(TRIGGER_DISPLAY).filter(([, m]) => m.category === cat && (!search || m.label.toLowerCase().includes(search.toLowerCase()) || m.description.toLowerCase().includes(search.toLowerCase())));
                      if (!items.length) return null;
                      return (
                        <div key={cat}>
                          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", marginBottom: 6 }}>{cat}</div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                            {items.map(([type, meta]) => (
                              <PickerItem key={type} icon={meta.icon} iconColor="#3B82F6" label={meta.label} desc={meta.description} onClick={() => selectTrigger(type as TriggerType)} />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {panelMode === "trigger-config" && triggerType && (
                  <TriggerConfigPanel
                    triggerType={triggerType as TriggerType}
                    config={triggerConfig}
                    onChange={(cfg) => { setTriggerConfig(cfg); scheduleAutoSave({ triggerConfig: cfg }); }}
                    tags={tags}
                    pipelines={pipelines}
                    customFields={customFields}
                  />
                )}
                {panelMode === "step-picker" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                    {STEP_CATS.map((cat) => {
                      const items = Object.entries(STEP_DISPLAY).filter(([, m]) => m.category === cat && (!search || m.label.toLowerCase().includes(search.toLowerCase()) || m.description.toLowerCase().includes(search.toLowerCase())));
                      if (!items.length) return null;
                      return (
                        <div key={cat}>
                          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", marginBottom: 6 }}>{cat}</div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                            {items.map(([type, meta]) => (
                              <PickerItem key={type} icon={meta.icon} iconColor={meta.color} label={meta.label} desc={meta.description} onClick={() => addStep(type as StepType)} />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {panelMode === "step-editor" && activeStep && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, padding: "10px 12px", borderRadius: 10, background: `${catColor(STEP_DISPLAY[activeStep.type]?.category ?? "")}10`, border: `1px solid ${catColor(STEP_DISPLAY[activeStep.type]?.category ?? "")}25` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 7, background: `${catColor(STEP_DISPLAY[activeStep.type]?.category ?? "")}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Icon name={STEP_DISPLAY[activeStep.type]?.icon ?? "Zap"} size={13} style={{ color: catColor(STEP_DISPLAY[activeStep.type]?.category ?? "") }} />
                        </div>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--foreground)" }}>{STEP_DISPLAY[activeStep.type]?.label}</div>
                          <div style={{ fontSize: 10, color: "var(--muted)" }}>{STEP_DISPLAY[activeStep.type]?.category}</div>
                        </div>
                      </div>
                      <button onClick={() => deleteStep(activeStep.id)}
                        style={{ width: 26, height: 26, borderRadius: 6, border: "1px solid #FCA5A5", background: "#FEF2F2", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#EF4444" }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <StepEditor step={activeStep} onChange={updateStep} tags={tags} pipelines={pipelines} customFields={customFields} otherWorkflows={otherWorkflows} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Side panels (Notes / Versions / Integrations) */}
          {sidePanel === "notes" && <WorkflowNotesPanel workflowId={workflow.id} onClose={() => setSidePanel(null)} />}
          {sidePanel === "versions" && <WorkflowVersionPanel workflowId={workflow.id} onClose={() => setSidePanel(null)} />}
          {sidePanel === "integrations" && <WorkflowIntegrationsPanel steps={steps} onClose={() => setSidePanel(null)} />}
        </div>
      )}

      {/* Tool hint */}
      {activeTab === "builder" && (
        <div style={{ position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,0.6)", color: "white", fontSize: 11, padding: "4px 10px", borderRadius: 6, pointerEvents: "none" }}>
          {tool === "hand" ? "Pan mode — drag to move canvas · Press V for select" : "Select mode · Press H to pan · Auto-saves 2s after edits"}
        </div>
      )}

      {/* Test Workflow Modal */}
      {showTestModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
          <div style={{ width: 480, maxHeight: "80vh", borderRadius: 16, border: "1px solid var(--border)", background: "var(--surface)", display: "flex", flexDirection: "column", boxShadow: "0 24px 64px rgba(0,0,0,0.25)", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "var(--foreground)" }}>Test Workflow</div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>Pick a contact to run through this workflow right now.</div>
              </div>
              <button onClick={() => { setShowTestModal(false); setTestLogs(null); }} style={{ color: "var(--muted)", background: "transparent", border: "none", cursor: "pointer" }}><X size={16} /></button>
            </div>
            <div style={{ padding: 20, overflowY: "auto", flex: 1 }}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em" }}>Contact</label>
                <select value={testContactId} onChange={(e) => setTestContactId(e.target.value)}
                  style={{ width: "100%", borderRadius: 8, border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground)", padding: "8px 10px", fontSize: 13, outline: "none" }}>
                  {contacts.map((c) => <option key={c.id} value={c.id}>{c.companyName}{c.email ? ` — ${c.email}` : ""}</option>)}
                </select>
              </div>
              {testLogs && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Results</div>
                  {testLogs.map((log) => (
                    <div key={log.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--background)" }}>
                      <span style={{ fontSize: 16, marginTop: -1 }}>{log.status === "success" ? "✅" : log.status === "failed" ? "❌" : "⏭"}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>{log.stepLabel ?? log.stepType}</div>
                        {log.message && <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{log.message}</div>}
                        {log.errorDetail && <div style={{ fontSize: 11, color: "#EF4444", fontFamily: "monospace", marginTop: 2 }}>{log.errorDetail}</div>}
                        {log.durationMs !== null && <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>{log.durationMs}ms</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <button onClick={runTest} disabled={testRunning || !testContactId || steps.length === 0}
                style={{ width: "100%", borderRadius: 10, border: "none", padding: "10px", fontSize: 13, fontWeight: 600, color: "white", background: testRunning ? "#6B7280" : "#3B82F6", cursor: testRunning || !testContactId || steps.length === 0 ? "not-allowed" : "pointer", opacity: steps.length === 0 ? 0.5 : 1 }}>
                {testRunning ? "Running test…" : steps.length === 0 ? "Add steps first" : testLogs ? "Run Again" : "Run Test"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* Sub-components */

function TriggerCard({ triggerMeta, triggerType, onClickEmpty, onEdit, onRemove, disabled }: {
  triggerMeta: typeof TRIGGER_DISPLAY[TriggerType] | null;
  triggerType: TriggerType | ""; onClickEmpty: () => void; onEdit: () => void; onRemove: () => void; disabled?: boolean;
}) {
  const [hov, setHov] = useState(false);
  if (triggerType && triggerMeta) {
    return (
      <div onClick={disabled ? undefined : onEdit} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
        style={{ width: "100%", borderRadius: 10, border: `2px solid ${hov && !disabled ? "#2563EB" : "#3B82F6"}`, background: "white", padding: "10px 14px", boxShadow: "0 2px 8px rgba(59,130,246,0.12)", cursor: disabled ? "default" : "pointer" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon name={triggerMeta.icon} size={15} style={{ color: "#3B82F6" }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#3B82F6", marginBottom: 1 }}>Trigger</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{triggerMeta.label}</div>
            <div style={{ fontSize: 11, color: "#6B7280", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{triggerMeta.description}</div>
          </div>
          {!disabled && (
            <div style={{ display: "flex", gap: 4 }}>
              <button onClick={(e) => { e.stopPropagation(); onEdit(); }}
                style={{ width: 26, height: 26, borderRadius: 6, border: "1px solid #E5E7EB", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#6B7280" }}>
                <Edit3 size={11} />
              </button>
              <button onClick={(e) => { e.stopPropagation(); onRemove(); }}
                style={{ width: 26, height: 26, borderRadius: 6, border: "1px solid #FECACA", background: "#FEF2F2", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#EF4444" }}>
                <X size={11} />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }
  return (
    <button onClick={disabled ? undefined : onClickEmpty}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ width: "100%", borderRadius: 10, border: `2px dashed ${hov && !disabled ? "#3B82F6" : "#CBD5E1"}`, background: hov && !disabled ? "#EFF6FF" : "white", padding: "14px", cursor: disabled ? "default" : "pointer", display: "flex", alignItems: "center", gap: 12, transition: "all 0.15s" }}>
      <div style={{ width: 36, height: 36, borderRadius: 9, background: hov && !disabled ? "#DBEAFE" : "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Zap size={16} style={{ color: hov && !disabled ? "#3B82F6" : "#94A3B8" }} />
      </div>
      <div style={{ textAlign: "left" }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: hov && !disabled ? "#3B82F6" : "#374151" }}>Add a Trigger</div>
        <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>Choose what starts this workflow</div>
      </div>
      <ChevronRight size={14} style={{ color: "#9CA3AF", marginLeft: "auto" }} />
    </button>
  );
}

function StepCard({ step, meta, color, isActive, onClick, onDelete }: {
  step: WorkflowStep; meta: typeof STEP_DISPLAY[StepType] | undefined;
  color: string; isActive: boolean; onClick: () => void; onDelete: () => void;
}) {
  const [hov, setHov] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ width: "100%", borderRadius: 10, border: `1px solid ${isActive ? color : hov ? "#CBD5E1" : "#E5E7EB"}`, borderLeft: `3px solid ${color}`, background: "white", padding: "9px 12px", cursor: "pointer", boxShadow: isActive ? `0 0 0 3px ${color}20` : hov ? "0 2px 8px rgba(0,0,0,0.07)" : "0 1px 3px rgba(0,0,0,0.05)", transition: "all 0.12s" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 30, height: 30, borderRadius: 7, background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon name={meta?.icon ?? "Zap"} size={13} style={{ color }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{step.label || meta?.label}</div>
          <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 1 }}>{meta?.category}</div>
        </div>
        {(hov || isActive) && (
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }}
            style={{ width: 24, height: 24, borderRadius: 5, border: "none", background: "#FEF2F2", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#EF4444", flexShrink: 0 }}>
            <X size={11} />
          </button>
        )}
      </div>
      {step.type === STEP_TYPES.WAIT && step.waitAmount && (
        <div style={{ marginTop: 5, fontSize: 11, color: "#6B7280", paddingLeft: 40 }}>Wait {step.waitAmount} {step.waitUnit}</div>
      )}
      {step.type === STEP_TYPES.SEND_EMAIL && step.emailSubject && (
        <div style={{ marginTop: 5, fontSize: 11, color: "#6B7280", paddingLeft: 40, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Subject: {step.emailSubject}</div>
      )}
      {step.type === STEP_TYPES.IF_ELSE && (
        <div style={{ marginTop: 5, fontSize: 11, color: "#6B7280", paddingLeft: 40 }}>{step.conditions?.length ?? 0} condition{(step.conditions?.length ?? 0) !== 1 ? "s" : ""}</div>
      )}
    </div>
  );
}

function NodeConnector({ onAdd }: { onAdd: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative", width: "100%", height: 44 }}>
      <div style={{ width: 1, height: "100%", background: "#CBD5E1", position: "absolute", left: "50%", top: 0 }} />
      <button onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} onClick={onAdd}
        style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 20, height: 20, borderRadius: "50%", border: `1.5px solid ${hov ? "#3B82F6" : "#CBD5E1"}`, background: hov ? "#3B82F6" : "white", color: hov ? "white" : "#94A3B8", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.12s", zIndex: 1, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        <Plus size={10} />
      </button>
    </div>
  );
}

function PickerItem({ icon, iconColor, label, desc, onClick, beta }: { icon: string; iconColor: string; label: string; desc: string; onClick: () => void; beta?: boolean }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: "flex", alignItems: "center", gap: 10, borderRadius: 8, border: `1px solid ${hov ? "#E5E7EB" : "transparent"}`, padding: "8px 8px", textAlign: "left", cursor: "pointer", background: hov ? "var(--accent-soft)" : "transparent", transition: "all 0.1s", width: "100%" }}>
      <div style={{ width: 28, height: 28, borderRadius: 7, background: `${iconColor}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon name={icon} size={13} style={{ color: iconColor }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--foreground)", lineHeight: 1.3, display: "flex", alignItems: "center", gap: 6 }}>
          {label}
          {beta && <span style={{ fontSize: 9, fontWeight: 700, background: "#8B5CF620", color: "#8B5CF6", borderRadius: 4, padding: "1px 5px", letterSpacing: "0.05em" }}>BETA</span>}
        </div>
        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 1, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{desc}</div>
      </div>
      <ChevronRight size={12} style={{ color: "#CBD5E1", flexShrink: 0 }} />
    </button>
  );
}

/* ── Step Editor ── */
function StepEditor({ step, onChange, tags, pipelines, customFields, otherWorkflows }: {
  step: WorkflowStep; onChange: (s: WorkflowStep) => void;
  tags: TagItem[]; pipelines: Pipeline[]; customFields: CustomField[];
  otherWorkflows: { id: string; name: string }[];
}) {
  const patch = (u: Partial<WorkflowStep>) => onChange({ ...step, ...u });
  const inp: React.CSSProperties = { width: "100%", borderRadius: 8, border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground)", padding: "7px 10px", fontSize: 12, outline: "none", boxSizing: "border-box" };
  const lbl: React.CSSProperties = { display: "block", fontSize: 11, fontWeight: 600, color: "var(--muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" };
  const wrap: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 14 };
  function F({ label, children }: { label: string; children: React.ReactNode }) { return <div><label style={lbl}>{label}</label>{children}</div>; }
  const LabelField = <F label="Step label"><input value={step.label ?? ""} onChange={(e) => patch({ label: e.target.value })} style={inp} placeholder="Label this step…" /></F>;

  switch (step.type) {
    case STEP_TYPES.SEND_EMAIL: return (
      <div style={wrap}>
        {LabelField}
        <F label="Subject"><input value={step.emailSubject ?? ""} onChange={(e) => patch({ emailSubject: e.target.value })} style={inp} placeholder="Subject line…" /></F>
        <F label="Body (HTML)"><textarea value={step.emailBody ?? ""} onChange={(e) => patch({ emailBody: e.target.value })} rows={8} style={{ ...inp, resize: "vertical" }} placeholder={"<p>Hi {{firstName}},</p>"} /></F>
        <p style={{ fontSize: 10, color: "var(--muted)", margin: 0 }}>{"{{firstName}} {{companyName}} {{email}} {{senderName}}"}</p>
      </div>
    );
    case STEP_TYPES.SEND_SMS: return (
      <div style={wrap}>{LabelField}<F label="Message"><textarea value={step.smsBody ?? ""} onChange={(e) => patch({ smsBody: e.target.value })} rows={5} style={{ ...inp, resize: "vertical" }} placeholder={"Hi {{firstName}}…"} /></F></div>
    );
    case STEP_TYPES.WAIT: return (
      <div style={wrap}>
        <F label="Wait duration">
          <div style={{ display: "flex", gap: 8 }}>
            <input type="number" min={1} value={step.waitAmount ?? 1} onChange={(e) => patch({ waitAmount: Number(e.target.value) })} style={{ ...inp, width: 90 }} />
            <select value={step.waitUnit ?? "days"} onChange={(e) => patch({ waitUnit: e.target.value as "minutes" | "hours" | "days" })} style={{ ...inp, flex: 1 }}>
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
          <select value={step.tagId ?? ""} onChange={(e) => { const t = tags.find((x) => x.id === e.target.value); patch({ tagId: e.target.value, tagName: t?.name }); }} style={inp}>
            <option value="">Select tag…</option>
            {tags.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </F>
      </div>
    );
    case STEP_TYPES.UPDATE_CONTACT_FIELD: return (
      <div style={wrap}>
        <F label="Custom field"><select value={step.fieldId ?? ""} onChange={(e) => patch({ fieldId: e.target.value })} style={inp}><option value="">Select field…</option>{customFields.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}</select></F>
        <F label="New value"><input value={step.fieldValue ?? ""} onChange={(e) => patch({ fieldValue: e.target.value })} style={inp} placeholder="Value (supports merge vars)" /></F>
      </div>
    );
    case STEP_TYPES.ADD_NOTE: return <div style={wrap}><F label="Note content"><textarea value={step.noteContent ?? ""} onChange={(e) => patch({ noteContent: e.target.value })} rows={5} style={{ ...inp, resize: "vertical" }} /></F></div>;
    case STEP_TYPES.ADD_TASK: return (
      <div style={wrap}>
        <F label="Task title"><input value={step.taskTitle ?? ""} onChange={(e) => patch({ taskTitle: e.target.value })} style={inp} placeholder={"Follow up with {{companyName}}"} /></F>
        <F label="Due in (days)"><input type="number" min={0} value={step.taskDueDays ?? 1} onChange={(e) => patch({ taskDueDays: Number(e.target.value) })} style={inp} /></F>
      </div>
    );
    case STEP_TYPES.UPDATE_STAGE: return (
      <div style={wrap}><F label="New outreach stage"><select value={step.newStage ?? ""} onChange={(e) => patch({ newStage: e.target.value })} style={inp}><option value="">Select stage…</option>{["RESEARCHING","CONTACTED","FOLLOWED_UP","NEGOTIATING","APPROVED","REJECTED","ONBOARDED"].map((s) => <option key={s} value={s}>{s}</option>)}</select></F></div>
    );
    case STEP_TYPES.CREATE_OPPORTUNITY:
    case STEP_TYPES.MOVE_OPPORTUNITY: return (
      <div style={wrap}>
        <F label="Pipeline"><select value={step.pipelineId ?? ""} onChange={(e) => patch({ pipelineId: e.target.value, stageId: "" })} style={inp}><option value="">Select pipeline…</option>{pipelines.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></F>
        {step.pipelineId && <F label="Stage"><select value={step.stageId ?? ""} onChange={(e) => patch({ stageId: e.target.value })} style={inp}><option value="">Select stage…</option>{pipelines.find((p) => p.id === step.pipelineId)?.stages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></F>}
        {step.type === STEP_TYPES.CREATE_OPPORTUNITY && <F label="Opportunity name"><input value={step.opportunityName ?? ""} onChange={(e) => patch({ opportunityName: e.target.value })} style={inp} placeholder={"{{companyName}} – Deal"} /></F>}
      </div>
    );
    case STEP_TYPES.SEND_INTERNAL_NOTIFY: return (
      <div style={wrap}>
        <F label="Notify email"><input value={step.notifyTo ?? ""} onChange={(e) => patch({ notifyTo: e.target.value })} style={inp} placeholder="team@example.com" /></F>
        <F label="Subject"><input value={step.notifySubject ?? ""} onChange={(e) => patch({ notifySubject: e.target.value })} style={inp} placeholder={"New lead: {{companyName}}"} /></F>
        <F label="Message"><textarea value={step.notifyBody ?? ""} onChange={(e) => patch({ notifyBody: e.target.value })} rows={3} style={{ ...inp, resize: "vertical" }} /></F>
      </div>
    );
    case STEP_TYPES.WEBHOOK: return (
      <div style={wrap}>
        <F label="URL"><input value={step.webhookUrl ?? ""} onChange={(e) => patch({ webhookUrl: e.target.value })} style={inp} placeholder="https://…" /></F>
        <F label="Method"><select value={step.webhookMethod ?? "POST"} onChange={(e) => patch({ webhookMethod: e.target.value as "POST" | "GET" | "PUT" })} style={inp}><option>POST</option><option>GET</option><option>PUT</option></select></F>
        <F label="Body (JSON)"><textarea value={step.webhookBody ?? ""} onChange={(e) => patch({ webhookBody: e.target.value })} rows={4} style={{ ...inp, fontFamily: "monospace", fontSize: 11, resize: "vertical" }} placeholder={'{"contact": "{{companyName}}"}'} /></F>
      </div>
    );
    case STEP_TYPES.AI_ACTION: return (
      <div style={wrap}>
        <F label="AI prompt"><textarea value={step.aiPrompt ?? ""} onChange={(e) => patch({ aiPrompt: e.target.value })} rows={6} style={{ ...inp, resize: "vertical" }} placeholder={"Write an outreach email for {{companyName}}…"} /></F>
        <p style={{ fontSize: 10, color: "var(--muted)", margin: 0 }}>Output saved as contact note. Requires OPENAI_API_KEY.</p>
      </div>
    );
    case STEP_TYPES.ENROLL_IN_WORKFLOW: return (
      <div style={wrap}>
        {LabelField}
        <F label="Target workflow">
          <select value={step.targetWorkflowId ?? ""} onChange={(e) => patch({ targetWorkflowId: e.target.value })} style={inp}>
            <option value="">Select workflow…</option>
            {otherWorkflows.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </F>
        <p style={{ fontSize: 10, color: "var(--muted)", margin: 0 }}>The contact will be enrolled in the selected workflow when this step runs.</p>
      </div>
    );
    case STEP_TYPES.IF_ELSE: return (
      <div style={wrap}>
        <p style={{ fontSize: 11, color: "var(--muted)", margin: 0 }}>Contacts matching ALL conditions go to the Yes branch.</p>
        {(step.conditions ?? []).map((c, i) => (
          <div key={i} style={{ borderRadius: 9, border: "1px solid var(--border)", padding: 10, display: "flex", flexDirection: "column", gap: 6 }}>
            <input value={c.field} onChange={(e) => { const cs = [...(step.conditions ?? [])]; cs[i] = { ...cs[i], field: e.target.value }; patch({ conditions: cs }); }} style={inp} placeholder="Field (stage, email, tag…)" />
            <select value={c.operator} onChange={(e) => { const cs = [...(step.conditions ?? [])]; cs[i] = { ...cs[i], operator: e.target.value as "equals" }; patch({ conditions: cs }); }} style={inp}>
              {["equals","not_equals","contains","not_contains","is_empty","is_not_empty","greater_than","less_than"].map((op) => <option key={op} value={op}>{op}</option>)}
            </select>
            <input value={c.value ?? ""} onChange={(e) => { const cs = [...(step.conditions ?? [])]; cs[i] = { ...cs[i], value: e.target.value }; patch({ conditions: cs }); }} style={inp} placeholder="Value" />
            <button onClick={() => patch({ conditions: (step.conditions ?? []).filter((_, j) => j !== i) })} style={{ fontSize: 11, color: "#EF4444", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}>Remove</button>
          </div>
        ))}
        <button onClick={() => patch({ conditions: [...(step.conditions ?? []), { field: "", operator: "equals" as const, value: "" }] })} style={{ fontSize: 12, color: "#3B82F6", background: "transparent", border: "none", cursor: "pointer", textAlign: "left", padding: 0 }}>+ Add condition</button>
      </div>
    );
    case STEP_TYPES.ENROLL_IN_WORKFLOW: return (
      <div style={wrap}>
        {LabelField}
        <F label="Target workflow">
          <select value={step.targetWorkflowId ?? ""} onChange={(e) => patch({ targetWorkflowId: e.target.value })} style={inp}>
            <option value="">Select workflow…</option>
            {otherWorkflows.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </F>
      </div>
    );
    default: return <div style={wrap}>{LabelField}</div>;
  }
}
