"use client";

import { useState, useTransition, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft, Mail, Phone, Globe, Tag as TagIcon, Plus, X,
  ExternalLink, ChevronDown, Send, StickyNote, FileText,
  Clock, Check,
} from "lucide-react";
import { updateSupplierStage } from "@/lib/actions/suppliers";
import { addTagToContact, removeTagFromContact } from "@/lib/actions/tags";
import { createOpportunity } from "@/lib/actions/pipelines";
import { addContactNote, sendContactEmail } from "@/lib/actions/contactNotes";

const STAGES = [
  "RESEARCHING","CONTACTED","FOLLOWED_UP","NEGOTIATING","APPROVED","REJECTED","ONBOARDED",
] as const;

type Tag = { id: string; name: string; color: string };
type Pipeline = { id: string; name: string; stages: { id: string; name: string; order: number }[] };
type Opportunity = {
  id: string; name: string; value: string | null; status: string;
  notes: string | null; stageId: string; supplierId: string | null;
  pipeline: { id: string; name: string };
  stage: { id: string; name: string };
};
type ContactNote = { id: string; type: string; content: string; subject: string | null; createdAt: string };
type EmailTemplate = { id: string; name: string; subject: string; body: string };
type CustomFieldFolder = { id: string; name: string; fields: { id: string; name: string; type: string; value: string }[] };

function getInitials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

export function ContactDetailClient({
  supplier,
  contactTags,
  allTags,
  opportunities,
  pipelines,
  contactNotes,
  emailTemplates,
  customFieldFolders,
}: {
  supplier: {
    id: string; companyName: string; contactName: string | null;
    email: string | null; phone: string | null; website: string | null;
    stage: string; notes: string | null; createdAt: string;
  };
  contactTags: Tag[];
  allTags: Tag[];
  opportunities: Opportunity[];
  pipelines: Pipeline[];
  contactNotes: ContactNote[];
  emailTemplates: EmailTemplate[];
  customFieldFolders: CustomFieldFolder[];
}) {
  const [stage, setStage] = useState(supplier.stage);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [showAddOpportunity, setShowAddOpportunity] = useState(false);
  const [hideEmptyFields, setHideEmptyFields] = useState(false);
  const [, startTransition] = useTransition();
  const [stagePending, startStageTransition] = useTransition();

  const initials = getInitials(supplier.companyName);

  function handleStageChange(newStage: string) {
    setStage(newStage);
    startStageTransition(() => updateSupplierStage(supplier.id, newStage));
  }

  const foldersWithFields = customFieldFolders.filter((f) =>
    hideEmptyFields ? f.fields.some((field) => field.value) : f.fields.length > 0,
  );

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center gap-3 border-b border-[var(--border)] bg-[var(--surface)] px-6 py-3 shrink-0">
        <Link href="/crm" className="flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
          <ArrowLeft size={15} />
          Contacts
        </Link>
        <span className="text-[var(--muted)]">/</span>
        <span className="text-sm font-medium text-[var(--foreground)]">{supplier.companyName}</span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ── LEFT PANE: Contact info, tags, custom fields ── */}
        <div className="w-72 shrink-0 overflow-y-auto border-r border-[var(--border)] bg-[var(--surface)]">
          {/* Avatar + name */}
          <div className="flex flex-col items-center gap-2 border-b border-[var(--border)] px-5 py-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-500 text-lg font-bold text-white">
              {initials}
            </div>
            <div className="text-center">
              <div className="font-semibold text-[var(--foreground)]">{supplier.companyName}</div>
              {supplier.contactName && (
                <div className="text-xs text-[var(--muted)]">{supplier.contactName}</div>
              )}
            </div>
            {/* Stage selector */}
            <select
              value={stage}
              disabled={stagePending}
              onChange={(e) => handleStageChange(e.target.value)}
              className="mt-1 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 text-xs text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              {STAGES.map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>

          {/* Contact fields */}
          <div className="border-b border-[var(--border)] px-5 py-4">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">Contact Info</p>
            <div className="flex flex-col gap-3 text-sm">
              {supplier.email && (
                <div>
                  <div className="mb-0.5 text-[10px] text-[var(--muted)]">Email</div>
                  <a href={`mailto:${supplier.email}`} className="flex items-center gap-1 text-blue-500 hover:underline break-all text-xs">
                    <Mail size={11} />
                    {supplier.email}
                  </a>
                </div>
              )}
              {supplier.phone && (
                <div>
                  <div className="mb-0.5 text-[10px] text-[var(--muted)]">Phone</div>
                  <div className="flex items-center gap-1 text-xs text-[var(--foreground)]">
                    <Phone size={11} className="text-[var(--muted)]" />
                    {supplier.phone}
                  </div>
                </div>
              )}
              {supplier.website && (
                <div>
                  <div className="mb-0.5 text-[10px] text-[var(--muted)]">Website</div>
                  <a
                    href={supplier.website.startsWith("http") ? supplier.website : `https://${supplier.website}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-blue-500 hover:underline truncate">
                    <Globe size={11} />
                    {supplier.website}
                    <ExternalLink size={9} />
                  </a>
                </div>
              )}
              <div>
                <div className="mb-0.5 text-[10px] text-[var(--muted)]">Added</div>
                <div className="text-xs text-[var(--foreground)]">
                  {new Date(supplier.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </div>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="border-b border-[var(--border)] px-5 py-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">Tags</p>
              {allTags.length > 0 && (
                <button
                  onClick={() => setShowTagPicker((v) => !v)}
                  className="flex items-center gap-0.5 rounded-full border border-dashed border-[var(--border)] px-2 py-0.5 text-[10px] text-[var(--muted)] hover:border-blue-400 hover:text-blue-400">
                  <Plus size={9} /> Add
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {contactTags.length === 0 && (
                <span className="text-[11px] text-[var(--muted)]">No tags</span>
              )}
              {contactTags.map((tag) => (
                <span key={tag.id}
                  className="group/t flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                  style={{ backgroundColor: tag.color + "20", color: tag.color, border: `1px solid ${tag.color}40` }}>
                  {tag.name}
                  <button onClick={() => startTransition(() => removeTagFromContact(supplier.id, tag.id))}
                    className="opacity-0 group-hover/t:opacity-100 transition-opacity">
                    <X size={9} />
                  </button>
                </span>
              ))}
            </div>
            {showTagPicker && (
              <div className="mt-2 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-2 shadow-lg">
                {allTags.filter((t) => !contactTags.find((ct) => ct.id === t.id)).map((tag) => (
                  <button key={tag.id}
                    onClick={() => {
                      setShowTagPicker(false);
                      startTransition(() => addTagToContact(supplier.id, tag.id));
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-[var(--accent-soft)]">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: tag.color }} />
                    {tag.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Custom fields */}
          {customFieldFolders.length > 0 && (
            <div className="px-5 py-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">Custom Fields</p>
                <button
                  onClick={() => setHideEmptyFields((v) => !v)}
                  className="text-[10px] text-[var(--muted)] hover:text-blue-400">
                  {hideEmptyFields ? "Show all" : "Hide empty"}
                </button>
              </div>
              {foldersWithFields.map((folder) => {
                const visibleFields = hideEmptyFields
                  ? folder.fields.filter((f) => f.value)
                  : folder.fields;
                if (visibleFields.length === 0) return null;
                return (
                  <div key={folder.id} className="mb-4">
                    <div className="mb-1.5 text-[10px] font-medium text-[var(--muted)]">{folder.name}</div>
                    <div className="flex flex-col gap-2">
                      {visibleFields.map((field) => (
                        <div key={field.id}>
                          <div className="text-[10px] text-[var(--muted)]">{field.name}</div>
                          <div className="text-xs text-[var(--foreground)]">
                            {field.value || <span className="text-[var(--muted)] italic">—</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {foldersWithFields.length === 0 && hideEmptyFields && (
                <p className="text-xs text-[var(--muted)]">All fields are empty.</p>
              )}
            </div>
          )}

          {/* Opportunities */}
          <div className="border-t border-[var(--border)] px-5 py-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">Opportunities</p>
              {pipelines.length > 0 && (
                <button
                  onClick={() => setShowAddOpportunity(true)}
                  className="flex items-center gap-0.5 rounded-full border border-dashed border-[var(--border)] px-2 py-0.5 text-[10px] text-[var(--muted)] hover:border-blue-400 hover:text-blue-400">
                  <Plus size={9} /> Add
                </button>
              )}
            </div>
            {opportunities.length === 0 ? (
              <p className="text-[11px] text-[var(--muted)]">No opportunities yet.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {opportunities.map((opp) => (
                  <div key={opp.id}
                    className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-2.5">
                    <div className="font-medium text-xs text-[var(--foreground)] truncate">{opp.name}</div>
                    <div className="mt-0.5 text-[10px] text-[var(--muted)]">
                      {opp.pipeline.name} › <span className="text-blue-500">{opp.stage.name}</span>
                    </div>
                    {opp.value && (
                      <div className="mt-1 text-[10px] font-semibold text-green-600">
                        ${Number(opp.value).toLocaleString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {showAddOpportunity && pipelines.length > 0 && (
              <AddOpportunityForm
                supplierId={supplier.id}
                pipelines={pipelines}
                onClose={() => setShowAddOpportunity(false)}
              />
            )}
          </div>
        </div>

        {/* ── CENTER PANE: Conversation / email ── */}
        <div className="flex flex-1 flex-col overflow-hidden bg-[var(--bg)]">
          <ConversationPane
            supplierId={supplier.id}
            supplierEmail={supplier.email}
            notes={contactNotes}
            emailTemplates={emailTemplates}
          />
        </div>

        {/* ── RIGHT PANE: Activity log ── */}
        <div className="w-72 shrink-0 overflow-y-auto border-l border-[var(--border)] bg-[var(--surface)]">
          <ActivityPane notes={contactNotes} supplier={supplier} />
        </div>
      </div>
    </div>
  );
}

/* ─── Conversation center pane ─────────────────────────────── */
function ConversationPane({
  supplierId,
  supplierEmail,
  notes,
  emailTemplates,
}: {
  supplierId: string;
  supplierEmail: string | null;
  notes: ContactNote[];
  emailTemplates: EmailTemplate[];
}) {
  const [tab, setTab] = useState<"email" | "note">("email");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [notePending, startNoteTransition] = useTransition();
  const [emailPending, startEmailTransition] = useTransition();
  const [sent, setSent] = useState(false);

  function applyTemplate(id: string) {
    const tmpl = emailTemplates.find((t) => t.id === id);
    if (!tmpl) return;
    setSubject(tmpl.subject);
    setBody(tmpl.body);
    setSelectedTemplate(id);
  }

  function handleSendEmail() {
    if (!supplierEmail || !subject.trim() || !body.trim()) return;
    startEmailTransition(async () => {
      await sendContactEmail(supplierId, supplierEmail, subject, body);
      setSubject("");
      setBody("");
      setSelectedTemplate("");
      setSent(true);
      setTimeout(() => setSent(false), 2500);
    });
  }

  function handleAddNote() {
    if (!body.trim()) return;
    startNoteTransition(async () => {
      await addContactNote(supplierId, body);
      setBody("");
    });
  }

  const timeline = [...notes].reverse();

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Timeline */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {timeline.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center py-16">
            <div className="rounded-full bg-[var(--accent-soft)] p-4 text-[var(--accent)]">
              <Mail size={24} />
            </div>
            <p className="font-medium text-[var(--foreground)]">No conversation yet</p>
            <p className="text-sm text-[var(--muted)]">Send an email or add a note to get started.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {timeline.map((item) => (
              <TimelineItem key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="shrink-0 border-t border-[var(--border)] bg-[var(--surface)] p-4">
        {/* Tab switcher */}
        <div className="mb-3 flex gap-1 rounded-xl bg-[var(--bg)] p-1 w-fit">
          <button
            onClick={() => { setTab("email"); setBody(""); setSubject(""); }}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              tab === "email"
                ? "bg-[var(--surface)] text-[var(--foreground)] shadow-sm"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}>
            <Mail size={12} /> Email
          </button>
          <button
            onClick={() => { setTab("note"); setBody(""); }}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              tab === "note"
                ? "bg-[var(--surface)] text-[var(--foreground)] shadow-sm"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}>
            <StickyNote size={12} /> Note
          </button>
        </div>

        {tab === "email" ? (
          <div className="flex flex-col gap-2">
            {emailTemplates.length > 0 && (
              <select
                value={selectedTemplate}
                onChange={(e) => applyTemplate(e.target.value)}
                className="input w-full bg-[var(--bg)] text-xs">
                <option value="">Use a template…</option>
                {emailTemplates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            )}
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject"
              className="input w-full text-xs"
            />
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              placeholder={supplierEmail ? `Write your email to ${supplierEmail}…` : "No email address on this contact."}
              disabled={!supplierEmail}
              className="input w-full resize-none text-xs disabled:opacity-50"
            />
            <div className="flex items-center justify-between">
              {sent && (
                <span className="flex items-center gap-1 text-xs text-emerald-500">
                  <Check size={12} /> Sent!
                </span>
              )}
              {!sent && <span />}
              <button
                onClick={handleSendEmail}
                disabled={emailPending || !supplierEmail || !subject.trim() || !body.trim()}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white disabled:opacity-40 hover:bg-blue-500">
                <Send size={12} />
                {emailPending ? "Sending…" : "Send email"}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              placeholder="Add a note about this contact…"
              className="input w-full resize-none text-xs"
            />
            <div className="flex justify-end">
              <button
                onClick={handleAddNote}
                disabled={notePending || !body.trim()}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white disabled:opacity-40 hover:bg-blue-500">
                <StickyNote size={12} />
                {notePending ? "Saving…" : "Add note"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TimelineItem({ item }: { item: ContactNote }) {
  const isEmail = item.type === "email_sent";
  const date = new Date(item.createdAt).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  });
  return (
    <div className="flex gap-3">
      <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
        isEmail ? "bg-blue-500/15 text-blue-400" : "bg-amber-500/15 text-amber-400"
      }`}>
        {isEmail ? <Mail size={13} /> : <StickyNote size={13} />}
      </div>
      <div className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)]">
            {isEmail ? "Email sent" : "Note"}
          </span>
          <span className="text-[10px] text-[var(--muted)]">{date}</span>
        </div>
        {item.subject && (
          <div className="mb-1 text-xs font-medium text-[var(--foreground)]">{item.subject}</div>
        )}
        <div className="text-xs text-[var(--foreground)] whitespace-pre-wrap">{item.content}</div>
      </div>
    </div>
  );
}

/* ─── Activity right pane ───────────────────────────────────── */
function ActivityPane({
  notes,
  supplier,
}: {
  notes: ContactNote[];
  supplier: { companyName: string; stage: string; createdAt: string };
}) {
  const items: { icon: React.ReactNode; text: string; date: string; color: string }[] = [];

  items.push({
    icon: <Plus size={12} />,
    text: `Contact created`,
    date: new Date(supplier.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    color: "bg-slate-500/15 text-slate-400",
  });

  for (const n of [...notes].reverse()) {
    items.push({
      icon: n.type === "email_sent" ? <Mail size={12} /> : <StickyNote size={12} />,
      text: n.type === "email_sent"
        ? `Email sent${n.subject ? `: "${n.subject}"` : ""}`
        : `Note added`,
      date: new Date(n.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      color: n.type === "email_sent" ? "bg-blue-500/15 text-blue-400" : "bg-amber-500/15 text-amber-400",
    });
  }

  return (
    <div className="px-5 py-5">
      <p className="mb-4 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">Activity</p>
      <div className="flex flex-col gap-3">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${item.color}`}>
              {item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-[var(--foreground)] leading-snug">{item.text}</div>
              <div className="mt-0.5 text-[10px] text-[var(--muted)]">{item.date}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Add opportunity form ──────────────────────────────────── */
function AddOpportunityForm({
  supplierId,
  pipelines,
  onClose,
}: {
  supplierId: string;
  pipelines: Pipeline[];
  onClose: () => void;
}) {
  const [selectedPipelineId, setSelectedPipelineId] = useState(pipelines[0]?.id ?? "");
  const [pending, startTransition] = useTransition();
  const selectedPipeline = pipelines.find((p) => p.id === selectedPipelineId);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("supplierId", supplierId);
    startTransition(async () => {
      await createOpportunity(fd);
      onClose();
    });
  }

  return (
    <div className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <input name="name" placeholder="Opportunity name" required className="input w-full text-xs" />
        <input name="value" type="number" placeholder="Value ($)" className="input w-full text-xs" />
        <select name="pipelineId" value={selectedPipelineId}
          onChange={(e) => setSelectedPipelineId(e.target.value)}
          className="input w-full bg-[var(--surface)] text-xs">
          {pipelines.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        {selectedPipeline && (
          <select name="stageId" className="input w-full bg-[var(--surface)] text-xs">
            {selectedPipeline.stages.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        )}
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose}
            className="flex-1 rounded-lg border border-[var(--border)] py-1.5 text-xs text-[var(--muted)]">
            Cancel
          </button>
          <button type="submit" disabled={pending}
            className="flex-1 rounded-lg bg-blue-600 py-1.5 text-xs font-medium text-white disabled:opacity-50">
            {pending ? "Adding…" : "Add"}
          </button>
        </div>
      </form>
    </div>
  );
}
