"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Search, FolderPlus, Plus, ChevronDown, MoreHorizontal, Folder,
  Zap, Trash2, Edit, Copy,
} from "lucide-react";
import { createDefaultWorkflow, deleteWorkflow } from "@/lib/actions/workflows";
import { DeleteConfirmModal } from "@/components/DeleteConfirmModal";

type Workflow = {
  id: string;
  name: string;
  status: string;
  triggerType: string;
  enrollCount: number;
  updatedAt: string;
  createdAt: string;
};

type Props = { workflows: Workflow[] };

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function AutomationsListClient({ workflows }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "review" | "deleted">("all");
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = workflows.filter((wf) => {
    if (activeTab === "deleted") return false; // no soft-delete implemented
    if (activeTab === "review") return false;  // placeholder
    return wf.name.toLowerCase().includes(search.toLowerCase());
  });

  function handleCreate() {
    startTransition(async () => {
      await createDefaultWorkflow();
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteWorkflow(id);
    });
    setDeleteConfirmId(null);
    setMenuOpenId(null);
  }

  return (
    <>
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--background)" }}>
      {/* Top tab bar */}
      <div style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)", display: "flex", alignItems: "center", gap: 0, padding: "0 24px" }}>
        <button
          style={{ padding: "14px 16px", fontSize: 13, fontWeight: 500, color: "var(--muted)", background: "transparent", border: "none", cursor: "pointer", borderBottom: "2px solid transparent" }}
        >
          Global Workflow Settings
        </button>
        <button
          style={{ padding: "14px 16px", fontSize: 13, fontWeight: 600, color: "var(--foreground)", background: "transparent", border: "none", cursor: "pointer", borderBottom: "2px solid #3B82F6" }}
        >
          Workflows
        </button>
      </div>

      <div style={{ padding: "24px 24px 0 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--foreground)" }}>Workflows list</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            style={{ display: "flex", alignItems: "center", gap: 6, borderRadius: 8, border: "1px solid var(--border)", padding: "8px 14px", fontSize: 13, fontWeight: 500, color: "var(--foreground)", background: "transparent", cursor: "pointer" }}
          >
            <FolderPlus size={14} /> Create folder
          </button>
          <button
            onClick={handleCreate}
            disabled={isPending}
            style={{ display: "flex", alignItems: "center", gap: 6, borderRadius: 8, border: "none", padding: "8px 14px", fontSize: 13, fontWeight: 600, color: "white", background: "#3B82F6", cursor: isPending ? "not-allowed" : "pointer", opacity: isPending ? 0.7 : 1 }}
          >
            <Plus size={14} /> {isPending ? "Creating…" : "Create workflow"}
          </button>
        </div>
      </div>

      {/* Sub-tabs + search */}
      <div style={{ padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 0, borderRadius: 8, border: "1px solid var(--border)", overflow: "hidden", background: "var(--surface)" }}>
          {(["all", "review", "deleted"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "7px 14px", fontSize: 12, fontWeight: activeTab === tab ? 600 : 400,
                color: activeTab === tab ? "var(--foreground)" : "var(--muted)",
                background: activeTab === tab ? "var(--accent-soft)" : "transparent",
                border: "none", borderRight: "1px solid var(--border)", cursor: "pointer",
              }}
            >
              {tab === "all" ? "All workflows" : tab === "review" ? "Needs review (0)" : "Deleted"}
            </button>
          ))}
          <button
            style={{ padding: "7px 14px", fontSize: 12, color: "#3B82F6", background: "transparent", border: "none", cursor: "pointer", fontWeight: 500 }}
          >
            + New smart list
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, borderRadius: 8, border: "1px solid var(--border)", padding: "7px 12px", background: "var(--surface)", minWidth: 220 }}>
          <Search size={13} style={{ color: "var(--muted)", flexShrink: 0 }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search workflows…"
            style={{ border: "none", background: "transparent", fontSize: 12, color: "var(--foreground)", outline: "none", width: "100%" }}
          />
        </div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflow: "auto", padding: "0 24px 24px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              <th style={{ width: 32, padding: "10px 8px", textAlign: "left" }}>
                <input type="checkbox" style={{ cursor: "pointer" }} />
              </th>
              <th style={{ padding: "10px 8px", textAlign: "left", fontWeight: 600, color: "var(--muted)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>Name</th>
              <th style={{ padding: "10px 8px", textAlign: "left", fontWeight: 600, color: "var(--muted)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>Status</th>
              <th style={{ padding: "10px 8px", textAlign: "left", fontWeight: 600, color: "var(--muted)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>Total enrolled</th>
              <th style={{ padding: "10px 8px", textAlign: "left", fontWeight: 600, color: "var(--muted)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>Active enrolled</th>
              <th style={{ padding: "10px 8px", textAlign: "left", fontWeight: 600, color: "var(--muted)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>Last updated</th>
              <th style={{ padding: "10px 8px", textAlign: "left", fontWeight: 600, color: "var(--muted)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>Created on</th>
              <th style={{ padding: "10px 8px", textAlign: "left", fontWeight: 600, color: "var(--muted)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>Stats</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} style={{ padding: "48px 8px", textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                    <Zap size={32} style={{ color: "var(--muted)", opacity: 0.4 }} />
                    <span>No workflows yet. Click <strong>+ Create workflow</strong> to get started.</span>
                  </div>
                </td>
              </tr>
            )}
            {filtered.map((wf) => {
              const isFolder = wf.name.includes(" / ");
              const displayName = isFolder ? wf.name.split(" / ").pop()! : wf.name;
              const folderName = isFolder ? wf.name.split(" / ").slice(0, -1).join(" / ") : null;
              const isPublished = wf.status === "active";
              return (
                <tr
                  key={wf.id}
                  style={{ borderBottom: "1px solid var(--border)", cursor: "pointer" }}
                  onClick={() => router.push(`/automations/${wf.id}`)}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "var(--accent-soft)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = ""; }}
                >
                  <td style={{ padding: "12px 8px" }} onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" style={{ cursor: "pointer" }} />
                  </td>
                  <td style={{ padding: "12px 8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: isPublished ? "#10B98115" : "var(--accent-soft)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {isFolder ? (
                          <Folder size={15} style={{ color: "#F59E0B" }} />
                        ) : (
                          <Zap size={15} style={{ color: isPublished ? "#10B981" : "var(--muted)" }} />
                        )}
                      </div>
                      <div>
                        {folderName && (
                          <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 1 }}>{folderName} /</div>
                        )}
                        <div style={{ fontWeight: 600, color: "var(--foreground)" }}>{displayName}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "12px 8px" }}>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 4, borderRadius: 999, padding: "3px 10px",
                      fontSize: 11, fontWeight: 600,
                      background: isPublished ? "#10B98115" : "var(--accent-soft)",
                      color: isPublished ? "#10B981" : "var(--muted)",
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: isPublished ? "#10B981" : "var(--muted)", display: "inline-block" }} />
                      {isPublished ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td style={{ padding: "12px 8px", color: "var(--foreground)" }}>{wf.enrollCount}</td>
                  <td style={{ padding: "12px 8px", color: "var(--foreground)" }}>—</td>
                  <td style={{ padding: "12px 8px", color: "var(--muted)", fontSize: 12 }}>{fmtDate(wf.updatedAt)}</td>
                  <td style={{ padding: "12px 8px", color: "var(--muted)", fontSize: 12 }}>{fmtDate(wf.createdAt)}</td>
                  <td style={{ padding: "12px 8px" }} onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <div style={{ position: "relative" }}>
                        <button
                          onClick={() => setMenuOpenId(menuOpenId === wf.id ? null : wf.id)}
                          style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: 6, border: "1px solid var(--border)", background: "transparent", cursor: "pointer", color: "var(--muted)" }}
                        >
                          <MoreHorizontal size={14} />
                        </button>
                        {menuOpenId === wf.id && (
                          <div style={{ position: "absolute", right: 0, top: 32, zIndex: 50, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.15)", minWidth: 140, overflow: "hidden" }}>
                            <button
                              onClick={() => { router.push(`/automations/${wf.id}`); setMenuOpenId(null); }}
                              style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px 14px", fontSize: 13, color: "var(--foreground)", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}
                              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--accent-soft)"; }}
                              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = ""; }}
                            >
                              <Edit size={13} /> Edit
                            </button>
                            <button
                              style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px 14px", fontSize: 13, color: "var(--foreground)", background: "transparent", border: "none", cursor: "not-allowed", opacity: 0.4, textAlign: "left" }}
                            >
                              <Copy size={13} /> Duplicate
                            </button>
                            <button
                              onClick={() => { setDeleteConfirmId(wf.id); setMenuOpenId(null); }}
                              style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px 14px", fontSize: 13, color: "#EF4444", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}
                              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#EF444410"; }}
                              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = ""; }}
                            >
                              <Trash2 size={13} /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                      <button
                        style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: 6, border: "1px solid var(--border)", background: "transparent", cursor: "pointer", color: "var(--muted)" }}
                      >
                        <ChevronDown size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>

    {deleteConfirmId && (
      <DeleteConfirmModal
        title={`Delete "${workflows.find((w) => w.id === deleteConfirmId)?.name ?? "workflow"}"?`}
        description="This workflow and all its enrollment history will be permanently deleted."
        onConfirm={() => handleDelete(deleteConfirmId)}
        onCancel={() => setDeleteConfirmId(null)}
      />
    )}
    </>
  );
}

