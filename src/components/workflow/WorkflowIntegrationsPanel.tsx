"use client";

import { WorkflowStep, STEP_TYPES } from "@/lib/workflow-types";
import { Mail, MessageSquare, Globe, Sparkles, X } from "lucide-react";

export function WorkflowIntegrationsPanel({ steps, onClose }: { steps: WorkflowStep[]; onClose: () => void }) {
  const usesEmail = steps.some((s) => s.type === STEP_TYPES.SEND_EMAIL || s.type === STEP_TYPES.SEND_INTERNAL_NOTIFY);
  const usesSms = steps.some((s) => s.type === STEP_TYPES.SEND_SMS);
  const usesWebhook = steps.some((s) => s.type === STEP_TYPES.WEBHOOK);
  const usesAi = steps.some((s) => s.type === STEP_TYPES.AI_ACTION);

  const integrations = [
    { name: "Resend (Email)", icon: Mail, active: usesEmail, envVar: "RESEND_API_KEY" },
    { name: "SendBlue (SMS)", icon: MessageSquare, active: usesSms, envVar: "SENDBLUE_API_KEY" },
    { name: "OpenAI (AI Actions)", icon: Sparkles, active: usesAi, envVar: "OPENAI_API_KEY" },
    { name: "External Webhooks", icon: Globe, active: usesWebhook, envVar: null },
  ];

  const active = integrations.filter((i) => i.active);

  return (
    <div className="flex h-full w-72 flex-col border-l border-[var(--border)] bg-[var(--surface)]">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
        <span className="text-sm font-semibold text-[var(--foreground)]">Integrations</span>
        <button onClick={onClose} className="text-[var(--muted)] hover:text-[var(--foreground)]"><X size={14} /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
        <p className="text-xs text-[var(--muted)]">External services this workflow uses, based on its current steps.</p>
        {active.length === 0 && (
          <p className="text-xs italic text-[var(--muted)]">This workflow doesn&apos;t use any external integrations yet.</p>
        )}
        {active.map((i) => (
          <div key={i.name} className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--background)] p-3">
            <i.icon size={15} className="text-blue-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--foreground)]">{i.name}</p>
              {i.envVar && <p className="text-[10px] font-mono text-[var(--muted)]">{i.envVar}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
