"use client";

import { Globe, Webhook, Copy } from "lucide-react";

interface Props {
  workflowId: string;
}

export function WorkflowIntegrationsPanel({ workflowId }: Props) {
  const webhookUrl = typeof window !== "undefined"
    ? `${window.location.origin}/api/workflows/${workflowId}/webhook`
    : `/api/workflows/${workflowId}/webhook`;

  function copy(text: string) {
    navigator.clipboard.writeText(text).catch(() => {});
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#0A1628", borderLeft: "1px solid #1E3A5F" }}>
      <div style={{ padding: "12px 14px", borderBottom: "1px solid #1E3A5F", fontSize: 13, fontWeight: 700, color: "#E2E8F0" }}>Integrations</div>
      <div style={{ flex: 1, overflowY: "auto", padding: "14px" }}>
        <div style={{ borderRadius: 10, border: "1px solid #1E3A5F", background: "#030A18", padding: 14, marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: "#0E90C820", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Globe size={14} style={{ color: "#0E90C8" }} />
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#E2E8F0" }}>Inbound Webhook</div>
          </div>
          <p style={{ fontSize: 12, color: "#64748B", margin: "0 0 10px 0", lineHeight: 1.5 }}>
            Send a POST request to this URL to trigger the workflow for a specific contact.
          </p>
          <div style={{ display: "flex", gap: 6 }}>
            <div style={{ flex: 1, background: "#0A1628", borderRadius: 6, border: "1px solid #1E3A5F", padding: "7px 10px", fontSize: 11, color: "#94A3B8", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {webhookUrl}
            </div>
            <button onClick={() => copy(webhookUrl)} title="Copy URL"
              style={{ width: 32, height: 32, borderRadius: 6, border: "1px solid #1E3A5F", background: "#0A1628", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#0E90C8", flexShrink: 0 }}>
              <Copy size={12} />
            </button>
          </div>
          <p style={{ fontSize: 11, color: "#475569", margin: "8px 0 0 0" }}>
            Payload: <code style={{ fontFamily: "monospace", background: "#0A1628", padding: "1px 4px", borderRadius: 3 }}>{`{"supplierId":"...", "secret":"..."}`}</code>
          </p>
        </div>

        <div style={{ borderRadius: 10, border: "1px solid #1E3A5F", background: "#030A18", padding: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: "#8B5CF620", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Webhook size={14} style={{ color: "#8B5CF6" }} />
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#E2E8F0" }}>Outbound Webhooks</div>
          </div>
          <p style={{ fontSize: 12, color: "#64748B", margin: 0, lineHeight: 1.5 }}>
            Add a <strong style={{ color: "#E2E8F0" }}>Send Webhook</strong> step to your workflow to push data to external tools like Zapier, Make, or n8n.
          </p>
        </div>
      </div>
    </div>
  );
}
