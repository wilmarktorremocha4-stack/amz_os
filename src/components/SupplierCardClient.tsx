"use client";

import { useState, useTransition } from "react";
import { Mail, Phone, Globe, Trash2, RotateCcw, Tag as TagIcon, Plus, X } from "lucide-react";
import { updateSupplierStage, archiveSupplier } from "@/lib/actions/suppliers";
import { addTagToContact, removeTagFromContact } from "@/lib/actions/tags";

const STAGES = [
  "RESEARCHING",
  "CONTACTED",
  "FOLLOWED_UP",
  "NEGOTIATING",
  "APPROVED",
  "REJECTED",
  "ONBOARDED",
] as const;

const STAGE_COLORS: Record<string, string> = {
  RESEARCHING: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  CONTACTED: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  FOLLOWED_UP: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  NEGOTIATING: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  APPROVED: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  REJECTED: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  ONBOARDED: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
};

const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-purple-500",
  "bg-green-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-teal-500",
  "bg-red-500",
  "bg-indigo-500",
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + hash * 31;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

type Supplier = {
  id: string;
  companyName: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  stage: string;
  notes: string | null;
};

type Tag = { id: string; name: string; color: string };

function DeleteDialog({
  supplierName,
  onClose,
  onConfirm,
}: {
  supplierName: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [value, setValue] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl">
        <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-950">
          <Trash2 size={18} className="text-red-600 dark:text-red-400" />
        </div>
        <h2 className="mt-3 text-base font-semibold text-[var(--foreground)]">
          Archive supplier?
        </h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          <strong className="text-[var(--foreground)]">{supplierName}</strong>{" "}
          will be moved to your Archive. You can restore it anytime from the
          Archive tab.
        </p>
        <p className="mt-4 text-sm text-[var(--muted)]">
          Type <span className="font-mono font-bold text-red-500">DELETE</span> to
          confirm.
        </p>
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="DELETE"
          className="input mt-2 w-full font-mono"
        />
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-[var(--border)] py-2 text-sm text-[var(--muted)] hover:bg-[var(--accent-soft)]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={value !== "DELETE" || pending}
            onClick={() => startTransition(() => onConfirm())}
            className="flex-1 rounded-xl bg-red-600 py-2 text-sm font-semibold text-white shadow hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {pending ? "Archiving…" : "Archive"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function SupplierCard({
  supplier,
  allTags = [],
  contactTags = [],
}: {
  supplier: Supplier;
  allTags?: Tag[];
  contactTags?: Tag[];
}) {
  const [stage, setStage] = useState(supplier.stage);
  const [stagePending, startStageTransition] = useTransition();
  const [showDelete, setShowDelete] = useState(false);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [, startTagTransition] = useTransition();

  const initials = getInitials(supplier.companyName);
  const avatarBg = getAvatarColor(supplier.companyName);

  function handleStageChange(newStage: string) {
    setStage(newStage);
    startStageTransition(() => updateSupplierStage(supplier.id, newStage));
  }

  async function handleArchive() {
    await archiveSupplier(supplier.id);
    setShowDelete(false);
  }

  return (
    <>
      {showDelete && (
        <DeleteDialog
          supplierName={supplier.companyName}
          onClose={() => setShowDelete(false)}
          onConfirm={handleArchive}
        />
      )}
      <div className="group flex flex-col gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm transition hover:border-blue-500/30 hover:shadow-md">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white ${avatarBg}`}
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate font-semibold text-[var(--foreground)]">
              {supplier.companyName}
            </div>
            {supplier.contactName && (
              <div className="truncate text-xs text-[var(--muted)]">
                {supplier.contactName}
              </div>
            )}
          </div>
          <button
            onClick={() => setShowDelete(true)}
            className="shrink-0 rounded-lg p-1.5 text-[var(--muted)] opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:hover:bg-red-950"
            title="Archive supplier"
          >
            <Trash2 size={14} />
          </button>
        </div>

        {/* Contact info */}
        <div className="flex flex-col gap-1.5 text-xs text-[var(--muted)]">
          {supplier.email && (
            <a
              href={`mailto:${supplier.email}`}
              className="flex items-center gap-2 hover:text-[var(--accent)]"
            >
              <Mail size={12} />
              <span className="truncate">{supplier.email}</span>
            </a>
          )}
          {supplier.phone && (
            <a
              href={`tel:${supplier.phone}`}
              className="flex items-center gap-2 hover:text-[var(--accent)]"
            >
              <Phone size={12} />
              <span>{supplier.phone}</span>
            </a>
          )}
          {supplier.website && (
            <a
              href={
                supplier.website.startsWith("http")
                  ? supplier.website
                  : `https://${supplier.website}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-[var(--accent)]"
            >
              <Globe size={12} />
              <span className="truncate">{supplier.website}</span>
            </a>
          )}
        </div>

        {/* Stage selector */}
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${STAGE_COLORS[stage] ?? STAGE_COLORS.RESEARCHING}`}
          >
            {stage.replace(/_/g, " ")}
          </span>
          <select
            value={stage}
            disabled={stagePending}
            onChange={(e) => handleStageChange(e.target.value)}
            className="ml-auto max-w-[140px] rounded-lg border border-[var(--border)] bg-transparent px-2 py-1 text-xs text-[var(--muted)] focus:outline-none"
          >
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>

        {/* Tags */}
        {(contactTags.length > 0 || allTags.length > 0) && (
          <div className="flex flex-wrap items-center gap-1.5">
            {contactTags.map((tag) => (
              <span
                key={tag.id}
                className="group/tag flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                style={{ backgroundColor: tag.color + "20", color: tag.color, border: `1px solid ${tag.color}40` }}
              >
                {tag.name}
                <button
                  onClick={() => startTagTransition(() => removeTagFromContact(supplier.id, tag.id))}
                  className="opacity-0 group-hover/tag:opacity-100 transition-opacity"
                >
                  <X size={10} />
                </button>
              </span>
            ))}
            {allTags.length > contactTags.length && (
              <div className="relative">
                <button
                  onClick={() => setShowTagPicker((v) => !v)}
                  className="flex items-center gap-1 rounded-full border border-dashed border-[var(--border)] px-2 py-0.5 text-[11px] text-[var(--muted)] hover:border-blue-400 hover:text-blue-400 transition-colors"
                >
                  <Plus size={10} />
                  Tag
                </button>
                {showTagPicker && (
                  <div className="absolute bottom-full left-0 mb-1 z-20 min-w-[140px] rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2 shadow-xl">
                    {allTags
                      .filter((t) => !contactTags.find((ct) => ct.id === t.id))
                      .map((tag) => (
                        <button
                          key={tag.id}
                          onClick={() => {
                            setShowTagPicker(false);
                            startTagTransition(() => addTagToContact(supplier.id, tag.id));
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-[var(--accent-soft)]"
                        >
                          <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: tag.color }} />
                          {tag.name}
                        </button>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
