"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import {
  X, Plus, ChevronDown, Search,
  MessageSquare, Clock, History, FileText, Share2, Puzzle,
  Zap, Mail, Bell, Tag, Edit, CheckSquare, ArrowRight,
  Briefcase, GitBranch, Flag, GitMerge, Calendar,
  CornerDownRight, StopCircle, UserX, Globe, Sparkles,
  UserPlus, Send, MousePointer, AlertCircle, UserMinus,
  BadgeCheck, Store, Edit3, ArrowRightCircle, CheckCircle2,
  Trash2, Save,
} from "lucide-react";
import {
  TRIGGER_DISPLAY,
  TriggerType,
  STEP_DISPLAY,
  STEP_TYPES,
  StepType,
  WorkflowStep,
} from "@/lib/workflow-types";
import { updateWorkflow, manuallyEnroll } from "@/lib/actions/workflows";

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; style?: React.CSSProperties }>> = {
  Mail, MessageSquare, Bell, Tag, Edit, FileText, CheckSquare,
  ArrowRight, Briefcase, GitBranch, Flag, Clock, GitMerge, Calendar,
  CornerDownRight, StopCircle, UserX, Globe, Sparkles, X,
  UserPlus, Send, MousePointer, AlertCircle, UserMinus,
  BadgeCheck, Store, Edit3, ArrowRightCircle, CheckCircle2,
};

function Icon({ name, size = 14, style }: { name: string; size?: number; style?: React.CSSProperties }) {
  const C = ICON_MAP[name];
  return C ? <C size={size} style={style} /> : <Zap size={size} style={style} />;
}

type WorkflowData = {
  id: string;
  name: string;
  status: string;
  triggerType: string;
  triggerConfig: unknown;
  steps: unknown;
  nodes: unknown;
  edges: unknown;
};
type Tag = { id: string; name: string; color: string };
type Pipeline = { id: string; name: string; stages: { id: string; name: string }[] };
type CustomField = { id: string; name: string; type: string };
type Contact = { id: string; companyName: string; email: string | null };
type Props = { workflow: WorkflowData; tags: Tag[]; pipelines: Pipeline[]; customFields: CustomField[]; contacts: Contact[] };
type PanelMode = "trigger-picker" | "step-picker" | "step-editor" | null;

const TRIGGER_CATEGORIES = ["Contact", "Email", "Pipeline", "Sourcing", "System"] as const;
const STEP_CATEGORIES = ["Communication", "Contact", "Pipeline", "Control", "External", "AI"] as const;

function stepBorderColor(category: string) {
  switch (category) {
    case "Communication": return "#0E90C8";
    case "Contact": return "#F59E0B";
    case "Pipeline": return "#8B5CF6";
    case "Control": return "#64748B";
    case "External": return "#10B981";
    case "AI": return "#EC4899";
    default: return "#64748B";
  }
}

export function WorkflowBuilderClient({ workflow, tags, pipelines, customFields, contacts }: Props) {
  const initSteps = (workflow.steps as WorkflowStep[]) ?? [];

  const [name, setName] = useState(workflow.name);
  const [editingName, setEditingName] = useState(false);
  const [triggerType, setTriggerType] = useState<TriggerType | "">(workflow.triggerType as TriggerType | "");
  const [steps, setSteps] = useState<WorkflowStep[]>(initSteps);
  const [status, setStatus] = useState(workflow.status);
  const [panelMode, setPanelMode] = useState<PanelMode>(null);
  const [insertAfterIdx, setInsertAfterIdx] = useState<number>(-1);
  const [activeStepId, setActiveStepId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [activeBuilderTab, setActiveBuilderTab] = useState<"builder" | "settings" | "history" | "logs">("builder");
  const counterRef = useRef(initSteps.length);

  const activeStep = steps.find((s) => s.id === activeStepId) ?? null;

  const save = useCallback(async (overrides?: Partial<{ name: string; triggerType: TriggerType | ""; steps: WorkflowStep[]; status: string }>) => {
    setSaving(true);
    try {
      await updateWorkflow(workflow.id, {
        name: overrides?.name ?? name,
        triggerType: (overrides?.triggerType ?? triggerType) as TriggerType,
        steps: overrides?.steps ?? steps,
        status: (overrides?.status ?? status) as "draft" | "active" | "paused",
      });
    } finally {
      setSaving(false);
    }
  }, [workflow.id, name, triggerType, steps, status]);

  function selectTrigger(t: TriggerType) {
    setTriggerType(t);
    setPanelMode(null);
    save({ triggerType: t });
  }

  function removeTrigger() {
    setTriggerType("");
    save({ triggerType: "" });
  }

  function openStepPicker(afterIdx: number) {
    setInsertAfterIdx(afterIdx);
    setSearch("");
    setPanelMode("step-picker");
    setActiveStepId(null);
  }

  function addStep(type: StepType) {
    const id = `step_${Date.now()}_${counterRef.current++}`;
    const step: WorkflowStep = { id, type, label: STEP_DISPLAY[type]?.label };
    let newSteps: WorkflowStep[];
    if (insertAfterIdx === -1 || insertAfterIdx >= steps.length - 1) {
      newSteps = [...steps, step];
    } else {
      newSteps = [...steps.slice(0, insertAfterIdx + 1), step, ...steps.slice(insertAfterIdx + 1)];
    }
    setSteps(newSteps);
    setActiveStepId(id);
    setPanelMode("step-editor");
    save({ steps: newSteps });
  }

  function updateStep(updated: WorkflowStep) {
    const newSteps = steps.map((s) => (s.id === updated.id ? updated : s));
    setSteps(newSteps);
    save({ steps: newSteps });
  }

  function deleteStep(id: string) {
    const newSteps = steps.filter((s) => s.id !== id);
    setSteps(newSteps);
    if (activeStepId === id) { setActiveStepId(null); setPanelMode(null); }
    save({ steps: newSteps });
  }

  function openStepEditor(id: string) {
    setActiveStepId(id);
    setPanelMode("step-editor");
  }

  async function togglePublish() {
    const next = status === "active" ? "draft" : "active";
    setStatus(next);
    await save({ status: next });
  }

  function commitName() {
    setEditingName(false);
    save({ name });
  }

  const triggerMeta = triggerType ? TRIGGER_DISPLAY[triggerType] : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "var(--background)", overflow: "hidden" }}>
      {/* Top bar */}
      <div style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border)", background: "var(--surface)", padding: "0 16px", height: 52 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          <Link href="/automations" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--muted)", textDecoration: "none", whiteSpace: "nowrap" }}>
            ← Workflows list
          </Link>
          <span style={{ color: "var(--border)" }}>|</span>
          {editingName ? (
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)} onBlur={commitName} onKeyDown={(e) => { if (e.key === "Enter") commitName(); }}
              style={{ fontSize: 14, fontWeight: 600, color: "var(--foreground)", background: "transparent", border: "none", borderBottom: "2px solid #3B82F6", outline: "none", minWidth: 160 }} />
          ) : (
            <span onClick={() => setEditingName(true)} style={{ fontSize: 14, fontWeight: 600, color: "var(--foreground)", cursor: "text" }} title="Click to rename">{name}</span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
          {(["builder", "settings", "history", "logs"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveBuilderTab(tab)}
              style={{ padding: "14px 14px", fontSize: 13, fontWeight: activeBuilderTab === tab ? 600 : 400, color: activeBuilderTab === tab ? "var(--foreground)" : "var(--muted)", background: "transparent", border: "none", borderBottom: activeBuilderTab === tab ? "2px solid #3B82F6" : "2px solid transparent", cursor: "pointer", textTransform: "capitalize" }}>
              {tab === "builder" ? "Builder" : tab === "settings" ? "Settings" : tab === "history" ? "Enrollment history" : "Execution logs"}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button style={{ display: "flex", alignItems: "center", gap: 4, borderRadius: 8, border: "1px solid var(--border)", padding: "6px 12px", fontSize: 12, color: "var(--muted)", background: "transparent", cursor: "pointer" }}>
            Standard builder <ChevronDown size={12} />
          </button>
          <button style={{ borderRadius: 8, border: "1px solid var(--border)", padding: "6px 12px", fontSize: 12, color: "var(--muted)", background: "transparent", cursor: "pointer" }}>
            Test workflow
          </button>
          <button onClick={() => save()} disabled={saving}
            style={{ display: "flex", alignItems: "center", gap: 4, borderRadius: 8, border: "1px solid var(--border)", padding: "6px 12px", fontSize: 12, color: "var(--muted)", background: "transparent", cursor: saving ? "not-allowed" : "pointer" }}>
            <Save size={12} /> {saving ? "Saving…" : "Save"}
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 4px" }}>
            <span style={{ fontSize: 12, color: status !== "active" ? "var(--foreground)" : "var(--muted)", fontWeight: status !== "active" ? 600 : 400 }}>Draft</span>
            <button onClick={togglePublish}
              style={{ width: 40, height: 22, borderRadius: 999, border: "none", cursor: "pointer", background: status === "active" ? "#3B82F6" : "var(--border)", position: "relative", transition: "background 0.2s" }}>
              <span style={{ position: "absolute", top: 3, left: status === "active" ? 21 : 3, width: 16, height: 16, borderRadius: "50%", background: "white", transition: "left 0.2s", display: "block" }} />
            </button>
            <span style={{ fontSize: 12, color: status === "active" ? "var(--foreground)" : "var(--muted)", fontWeight: status === "active" ? 600 : 400 }}>Publish</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Left icon sidebar */}
        <div style={{ width: 48, flexShrink: 0, borderRight: "1px solid var(--border)", background: "var(--surface)", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 12, gap: 4 }}>
          {[MessageSquare, Clock, History, FileText, Share2, Puzzle].map((IconC, i) => (
            <button key={i} style={{ width: 36, height: 36, borderRadius: 8, border: "none", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--muted)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--accent-soft)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}>
              <IconC size={16} />
            </button>
          ))}
        </div>

        {/* Canvas */}
        <div style={{ flex: 1, overflowY: "auto", background: "var(--background)", padding: "32px 0" }}>
          <div style={{ maxWidth: 600, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
            {/* Trigger node */}
            <div
              onClick={() => { if (!triggerType) { setSearch(""); setPanelMode("trigger-picker"); } }}
              style={{ width: "100%", borderRadius: 12, border: triggerType ? "2px solid #3B82F6" : "2px dashed var(--border)", background: "var(--surface)", padding: 16, cursor: triggerType ? "default" : "pointer", boxShadow: triggerType ? "0 0 0 4px #3B82F610" : "none", transition: "all 0.15s" }}>
              {triggerType && triggerMeta ? (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: "#3B82F615", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon name={triggerMeta.icon} size={16} style={{ color: "#3B82F6" }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#3B82F6", marginBottom: 2 }}>Trigger</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--foreground)" }}>{triggerMeta.label}</div>
                    <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 1 }}>{triggerMeta.description}</div>
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button onClick={(e) => { e.stopPropagation(); setSearch(""); setPanelMode("trigger-picker"); }}
                      style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid var(--border)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)" }}>
                      <Edit size={12} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); removeTrigger(); }}
                      style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid var(--border)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#EF4444" }}>
                      <X size={12} />
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--accent-soft)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Zap size={16} style={{ color: "var(--muted)" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>⚡ Add new trigger</div>
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>Choose what starts this workflow</div>
                  </div>
                </div>
              )}
            </div>

            <Connector onAdd={() => openStepPicker(-1)} />

            {steps.map((step, idx) => {
              const meta = STEP_DISPLAY[step.type];
              const isActive = activeStepId === step.id;
              const borderColor = meta ? stepBorderColor(meta.category) : "#64748B";
              return (
                <div key={step.id} style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div onClick={() => openStepEditor(step.id)}
                    style={{ width: "100%", borderRadius: 10, border: `1px solid ${isActive ? borderColor : "var(--border)"}`, borderLeft: `4px solid ${borderColor}`, background: "var(--surface)", padding: "12px 14px", cursor: "pointer", boxShadow: isActive ? `0 0 0 3px ${borderColor}20` : "none", transition: "all 0.15s" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 30, height: 30, borderRadius: 8, background: `${meta?.color ?? "#64748B"}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Icon name={meta?.icon ?? "Zap"} size={14} style={{ color: meta?.color ?? "#64748B" }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{step.label || meta?.label}</div>
                        <div style={{ fontSize: 11, color: "var(--muted)" }}>{meta?.category}</div>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); deleteStep(step.id); }}
                        style={{ width: 26, height: 26, borderRadius: 6, border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#EF4444"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--muted)"; }}>
                        <X size={12} />
                      </button>
                    </div>
                    {step.type === STEP_TYPES.WAIT && step.waitAmount && (
                      <div style={{ marginTop: 6, fontSize: 11, color: "var(--muted)" }}>⏱ Wait {step.waitAmount} {step.waitUnit}</div>
                    )}
                    {step.type === STEP_TYPES.SEND_EMAIL && step.emailSubject && (
                      <div style={{ marginTop: 6, fontSize: 11, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>📧 &quot;{step.emailSubject}&quot;</div>
                    )}
                    {step.type === STEP_TYPES.IF_ELSE && (
                      <div style={{ marginTop: 6, fontSize: 11, color: "var(--muted)" }}>🔀 {step.conditions?.length ?? 0} condition(s)</div>
                    )}
                  </div>
                  <Connector onAdd={() => openStepPicker(idx)} />
                </div>
              );
            })}

            <div style={{ borderRadius: 999, border: "1px solid var(--border)", background: "var(--surface)", padding: "8px 24px", fontSize: 12, fontWeight: 600, color: "var(--muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              End
            </div>
          </div>
        </div>

        {/* Right panel */}
        {panelMode && (
          <div style={{ width: 340, flexShrink: 0, borderLeft: "1px solid var(--border)", background: "var(--surface)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--foreground)" }}>
                {panelMode === "trigger-picker" ? "Choose a Trigger" : panelMode === "step-picker" ? "Add a Step" : "Edit Step"}
              </span>
              <button onClick={() => { setPanelMode(null); setActiveStepId(null); }} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--muted)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={16} />
              </button>
            </div>
            {(panelMode === "trigger-picker" || panelMode === "step-picker") && (
              <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, borderRadius: 8, border: "1px solid var(--border)", padding: "7px 10px", background: "var(--background)" }}>
                  <Search size={13} style={{ color: "var(--muted)", flexShrink: 0 }} />
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" style={{ border: "none", background: "transparent", fontSize: 13, color: "var(--foreground)", outline: "none", width: "100%" }} />
                </div>
              </div>
            )}
            <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
              {panelMode === "trigger-picker" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {TRIGGER_CATEGORIES.map((cat) => {
                    const items = Object.entries(TRIGGER_DISPLAY).filter(([, m]) => m.category === cat && (!search || m.label.toLowerCase().includes(search.toLowerCase()) || m.description.toLowerCase().includes(search.toLowerCase())));
                    if (!items.length) return null;
                    return (
                      <div key={cat}>
                        <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", marginBottom: 8 }}>{cat}</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          {items.map(([type, meta]) => (
                            <button key={type} onClick={() => selectTrigger(type as TriggerType)}
                              style={{ display: "flex", alignItems: "flex-start", gap: 10, borderRadius: 8, border: "1px solid transparent", padding: "10px 10px", textAlign: "left", cursor: "pointer", background: "transparent", transition: "background 0.1s" }}
                              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--accent-soft)"; }}
                              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}>
                              <div style={{ width: 30, height: 30, borderRadius: 7, background: "#3B82F618", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                                <Icon name={meta.icon} size={13} style={{ color: "#3B82F6" }} />
                              </div>
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)", lineHeight: 1.3 }}>{meta.label}</div>
                                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2, lineHeight: 1.4 }}>{meta.description}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {panelMode === "step-picker" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {STEP_CATEGORIES.map((cat) => {
                    const items = Object.entries(STEP_DISPLAY).filter(([, m]) => m.category === cat && (!search || m.label.toLowerCase().includes(search.toLowerCase()) || m.description.toLowerCase().includes(search.toLowerCase())));
                    if (!items.length) return null;
                    return (
                      <div key={cat}>
                        <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", marginBottom: 8 }}>{cat}</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          {items.map(([type, meta]) => (
                            <button key={type} onClick={() => addStep(type as StepType)}
                              style={{ display: "flex", alignItems: "flex-start", gap: 10, borderRadius: 8, padding: "10px 10px", textAlign: "left", cursor: "pointer", background: "transparent", border: "1px solid transparent", transition: "background 0.1s" }}
                              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--accent-soft)"; }}
                              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}>
                              <div style={{ width: 30, height: 30, borderRadius: 7, background: `${meta.color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                                <Icon name={meta.icon} size={13} style={{ color: meta.color }} />
                              </div>
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)", lineHeight: 1.3 }}>{meta.label}</div>
                                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2, lineHeight: 1.4 }}>{meta.description}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {panelMode === "step-editor" && activeStep && (
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 7, background: `${STEP_DISPLAY[activeStep.type]?.color ?? "#64748B"}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon name={STEP_DISPLAY[activeStep.type]?.icon ?? "Zap"} size={13} style={{ color: STEP_DISPLAY[activeStep.type]?.color ?? "#64748B" }} />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>{STEP_DISPLAY[activeStep.type]?.label}</span>
                    </div>
                    <button onClick={() => deleteStep(activeStep.id)}
                      style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid var(--border)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#EF4444" }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <StepEditor step={activeStep} onChange={updateStep} tags={tags} pipelines={pipelines} customFields={customFields} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Connector({ onAdd }: { onAdd: () => void }) {
  const [hover, setHover] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative", width: "100%", height: 48 }}>
      <div style={{ width: 1, height: "100%", background: "var(--border)", position: "absolute", top: 0, left: "50%" }} />
      <button
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={onAdd}
        style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 24, height: 24, borderRadius: "50%", border: `2px solid ${hover ? "#3B82F6" : "var(--border)"}`, background: hover ? "#3B82F6" : "var(--surface)", color: hover ? "white" : "var(--muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s", zIndex: 1 }}>
        <Plus size={12} />
      </button>
    </div>
  );
}

function StepEditor({ step, onChange, tags, pipelines, customFields }: { step: WorkflowStep; onChange: (s: WorkflowStep) => void; tags: Tag[]; pipelines: Pipeline[]; customFields: CustomField[] }) {
  const patch = (u: Partial<WorkflowStep>) => onChange({ ...step, ...u });
  const inp: React.CSSProperties = { width: "100%", borderRadius: 8, border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground)", padding: "8px 10px", fontSize: 13, outline: "none", boxSizing: "border-box" };
  const lbl: React.CSSProperties = { display: "block", fontSize: 11, fontWeight: 500, color: "var(--muted)", marginBottom: 4 };
  const wrap: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 12 };
  function F({ label, children }: { label: string; children: React.ReactNode }) {
    return <div><label style={lbl}>{label}</label>{children}</div>;
  }

  switch (step.type) {
    case STEP_TYPES.SEND_EMAIL: return (
      <div style={wrap}>
        <F label="Step label"><input value={step.label ?? ""} onChange={(e) => patch({ label: e.target.value })} style={inp} placeholder="e.g. Send Welcome Email" /></F>
        <F label="Subject"><input value={step.emailSubject ?? ""} onChange={(e) => patch({ emailSubject: e.target.value })} style={inp} placeholder="Subject line…" /></F>
        <F label="Body (HTML)"><textarea value={step.emailBody ?? ""} onChange={(e) => patch({ emailBody: e.target.value })} rows={7} style={{ ...inp, resize: "vertical" }} placeholder="<p>Hi {{firstName}},</p>" /></F>
        <p style={{ fontSize: 10, color: "var(--muted)" }}>Vars: {"{{firstName}} {{companyName}} {{senderName}} {{email}}"}</p>
      </div>
    );
    case STEP_TYPES.SEND_SMS: return (
      <div style={wrap}>
        <F label="Step label"><input value={step.label ?? ""} onChange={(e) => patch({ label: e.target.value })} style={inp} placeholder="Send SMS" /></F>
        <F label="Message"><textarea value={step.smsBody ?? ""} onChange={(e) => patch({ smsBody: e.target.value })} rows={4} style={{ ...inp, resize: "vertical" }} placeholder="Hi {{firstName}}…" /></F>
        <p style={{ fontSize: 10, color: "var(--muted)" }}>Requires SENDBLUE_API_KEY</p>
      </div>
    );
    case STEP_TYPES.WAIT: return (
      <div style={wrap}>
        <F label="Wait duration">
          <div style={{ display: "flex", gap: 8 }}>
            <input type="number" min={1} value={step.waitAmount ?? 1} onChange={(e) => patch({ waitAmount: Number(e.target.value) })} style={{ ...inp, width: 80 }} />
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
          <select value={step.tagId ?? ""} onChange={(e) => { const t = tags.find((t) => t.id === e.target.value); patch({ tagId: e.target.value, tagName: t?.name }); }} style={inp}>
            <option value="">Select tag…</option>
            {tags.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </F>
      </div>
    );
    case STEP_TYPES.UPDATE_CONTACT_FIELD: return (
      <div style={wrap}>
        <F label="Custom field">
          <select value={step.fieldId ?? ""} onChange={(e) => patch({ fieldId: e.target.value })} style={inp}>
            <option value="">Select field…</option>
            {customFields.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </F>
        <F label="New value"><input value={step.fieldValue ?? ""} onChange={(e) => patch({ fieldValue: e.target.value })} style={inp} placeholder="Value (supports merge vars)" /></F>
      </div>
    );
    case STEP_TYPES.ADD_NOTE: return (
      <div style={wrap}><F label="Note content"><textarea value={step.noteContent ?? ""} onChange={(e) => patch({ noteContent: e.target.value })} rows={4} style={{ ...inp, resize: "vertical" }} /></F></div>
    );
    case STEP_TYPES.ADD_TASK: return (
      <div style={wrap}>
        <F label="Task title"><input value={step.taskTitle ?? ""} onChange={(e) => patch({ taskTitle: e.target.value })} style={inp} placeholder="Follow up with {{companyName}}" /></F>
        <F label="Due in (days)"><input type="number" min={0} value={step.taskDueDays ?? 1} onChange={(e) => patch({ taskDueDays: Number(e.target.value) })} style={inp} /></F>
      </div>
    );
    case STEP_TYPES.UPDATE_STAGE: return (
      <div style={wrap}>
        <F label="New outreach stage">
          <select value={step.newStage ?? ""} onChange={(e) => patch({ newStage: e.target.value })} style={inp}>
            <option value="">Select stage…</option>
            {["RESEARCHING","CONTACTED","FOLLOWED_UP","NEGOTIATING","APPROVED","REJECTED","ONBOARDED"].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </F>
      </div>
    );
    case STEP_TYPES.CREATE_OPPORTUNITY:
    case STEP_TYPES.MOVE_OPPORTUNITY: return (
      <div style={wrap}>
        <F label="Pipeline">
          <select value={step.pipelineId ?? ""} onChange={(e) => patch({ pipelineId: e.target.value, stageId: "" })} style={inp}>
            <option value="">Select pipeline…</option>
            {pipelines.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </F>
        {step.pipelineId && (
          <F label="Stage">
            <select value={step.stageId ?? ""} onChange={(e) => patch({ stageId: e.target.value })} style={inp}>
              <option value="">Select stage…</option>
              {pipelines.find((p) => p.id === step.pipelineId)?.stages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </F>
        )}
        {step.type === STEP_TYPES.CREATE_OPPORTUNITY && (
          <F label="Opportunity name"><input value={step.opportunityName ?? ""} onChange={(e) => patch({ opportunityName: e.target.value })} style={inp} placeholder="{{companyName}} – Deal" /></F>
        )}
      </div>
    );
    case STEP_TYPES.SEND_INTERNAL_NOTIFY: return (
      <div style={wrap}>
        <F label="Notify email"><input value={step.notifyTo ?? ""} onChange={(e) => patch({ notifyTo: e.target.value })} style={inp} placeholder="team@example.com" /></F>
        <F label="Subject"><input value={step.notifySubject ?? ""} onChange={(e) => patch({ notifySubject: e.target.value })} style={inp} placeholder="New lead: {{companyName}}" /></F>
        <F label="Message"><textarea value={step.notifyBody ?? ""} onChange={(e) => patch({ notifyBody: e.target.value })} rows={3} style={{ ...inp, resize: "vertical" }} /></F>
      </div>
    );
    case STEP_TYPES.WEBHOOK: return (
      <div style={wrap}>
        <F label="URL"><input value={step.webhookUrl ?? ""} onChange={(e) => patch({ webhookUrl: e.target.value })} style={inp} placeholder="https://…" /></F>
        <F label="Method">
          <select value={step.webhookMethod ?? "POST"} onChange={(e) => patch({ webhookMethod: e.target.value as "POST" | "GET" | "PUT" })} style={inp}>
            <option>POST</option><option>GET</option><option>PUT</option>
          </select>
        </F>
        <F label="Body (JSON)"><textarea value={step.webhookBody ?? ""} onChange={(e) => patch({ webhookBody: e.target.value })} rows={4} style={{ ...inp, fontFamily: "monospace", fontSize: 11, resize: "vertical" }} placeholder={'{"contact": "{{companyName}}"}'} /></F>
      </div>
    );
    case STEP_TYPES.AI_ACTION: return (
      <div style={wrap}>
        <F label="AI prompt"><textarea value={step.aiPrompt ?? ""} onChange={(e) => patch({ aiPrompt: e.target.value })} rows={5} style={{ ...inp, resize: "vertical" }} placeholder="Write an outreach email for {{companyName}}…" /></F>
        <p style={{ fontSize: 10, color: "var(--muted)" }}>Requires OPENAI_API_KEY. Output saved as contact note.</p>
      </div>
    );
    case STEP_TYPES.IF_ELSE: return (
      <div style={wrap}>
        <p style={{ fontSize: 11, color: "var(--muted)" }}>Contacts matching ALL conditions → Yes branch:</p>
        {(step.conditions ?? []).map((c, i) => (
          <div key={i} style={{ borderRadius: 10, border: "1px solid var(--border)", padding: 10, display: "flex", flexDirection: "column", gap: 6 }}>
            <input value={c.field} onChange={(e) => { const cs = [...(step.conditions ?? [])]; cs[i] = { ...cs[i], field: e.target.value }; patch({ conditions: cs }); }} style={inp} placeholder="Field (stage, email, tag…)" />
            <select value={c.operator} onChange={(e) => { const cs = [...(step.conditions ?? [])]; cs[i] = { ...cs[i], operator: e.target.value as "equals" }; patch({ conditions: cs }); }} style={inp}>
              {["equals","not_equals","contains","not_contains","is_empty","is_not_empty","greater_than","less_than"].map((op) => <option key={op} value={op}>{op}</option>)}
            </select>
            <input value={c.value ?? ""} onChange={(e) => { const cs = [...(step.conditions ?? [])]; cs[i] = { ...cs[i], value: e.target.value }; patch({ conditions: cs }); }} style={inp} placeholder="Value" />
            <button onClick={() => patch({ conditions: (step.conditions ?? []).filter((_, j) => j !== i) })} style={{ fontSize: 10, color: "#EF4444", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}>Remove</button>
          </div>
        ))}
        <button onClick={() => patch({ conditions: [...(step.conditions ?? []), { field: "", operator: "equals" as const, value: "" }] })} style={{ fontSize: 12, color: "#3B82F6", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}>+ Add condition</button>
      </div>
    );
    default: return (
      <div style={wrap}><div><label style={lbl}>Step label</label><input value={step.label ?? ""} onChange={(e) => patch({ label: e.target.value })} style={inp} placeholder="Label this step…" /></div></div>
    );
  }
}
