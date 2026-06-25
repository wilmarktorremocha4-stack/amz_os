"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Mail, Phone, Globe, Plus, X,
  ExternalLink, Send, StickyNote,
  Check, Pencil,
} from "lucide-react";
import { updateSupplierStage, updateContactDetails } from "@/lib/actions/suppliers";
import { addTagToContact, removeTagFromContact } from "@/lib/actions/tags";
import { addContactNote, sendContactEmail } from "@/lib/actions/contactNotes";
import { createOpportunity } from "@/lib/actions/pipelines";
import { manualCheckInbox } from "@/lib/actions/fetch-replies";

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
  const router = useRouter();

  // Auto-poll IMAP every 30s + refresh UI every 10s — no button clicks needed
  useEffect(() => {
    router.refresh();

    // UI refresh — picks up any newly imported notes
    const refreshId = setInterval(() => router.refresh(), 10_000);

    // IMAP poll — checks inbox and imports new replies automatically
    const pollId = setInterval(async () => {
      await manualCheckInbox();
      router.refresh();
    }, 30_000);

    return () => {
      clearInterval(refreshId);
      clearInterval(pollId);
    };
  }, [router]);

  const [stage, setStage] = useState(supplier.stage);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [hideEmptyFields, setHideEmptyFields] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({
    companyName: supplier.companyName,
    contactName: supplier.contactName ?? "",
    email: supplier.email ?? "",
    phone: supplier.phone ?? "",
    website: supplier.website ?? "",
  });
  const [savePending, startSaveTransition] = useTransition();
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
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">Contact Info</p>
              {!editing && (
                <button onClick={() => setEditing(true)}
                  className="flex items-center gap-0.5 text-[10px] text-[var(--muted)] hover:text-blue-400">
                  <Pencil size={9} /> Edit
                </button>
              )}
            </div>
            {editing ? (
              <div className="flex flex-col gap-2">
                {(["companyName","contactName","email","phone","website"] as const).map((field) => (
                  <div key={field}>
                    <div className="mb-0.5 text-[10px] capitalize text-[var(--muted)]">
                      {field === "companyName" ? "Company" : field === "contactName" ? "Contact" : field.charAt(0).toUpperCase() + field.slice(1)}
                    </div>
                    <input
                      value={editData[field]}
                      onChange={(e) => setEditData((d) => ({ ...d, [field]: e.target.value }))}
                      className="input w-full text-xs"
                    />
                  </div>
                ))}
                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={() => { setEditing(false); setEditData({ companyName: supplier.companyName, contactName: supplier.contactName ?? "", email: supplier.email ?? "", phone: supplier.phone ?? "", website: supplier.website ?? "" }); }}
                    className="flex-1 rounded-lg border border-[var(--border)] py-1.5 text-xs text-[var(--muted)]">
                    Cancel
                  </button>
                  <button type="button" disabled={savePending}
                    onClick={() => startSaveTransition(async () => { await updateContactDetails(supplier.id, { companyName: editData.companyName || undefined, contactName: editData.contactName || undefined, email: editData.email || undefined, phone: editData.phone || undefined, website: editData.website || undefined }); setEditing(false); })}
                    className="flex-1 rounded-lg bg-blue-600 py-1.5 text-xs font-medium text-white disabled:opacity-50">
                    {savePending ? "Saving…" : "Save"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3 text-sm">
                {/* First name */}
                <div>
                  <div className="mb-0.5 text-[10px] text-[var(--muted)]">First Name</div>
                  <div className="text-xs text-[var(--foreground)]">
                    {supplier.contactName?.trim().split(/\s+/)[0] || <span className="italic text-[var(--muted)]">—</span>}
                  </div>
                </div>
                {/* Last name */}
                <div>
                  <div className="mb-0.5 text-[10px] text-[var(--muted)]">Last Name</div>
                  <div className="text-xs text-[var(--foreground)]">
                    {supplier.contactName?.trim().split(/\s+/).slice(1).join(" ") || <span className="italic text-[var(--muted)]">—</span>}
                  </div>
                </div>
                {/* Company */}
                <div>
                  <div className="mb-0.5 text-[10px] text-[var(--muted)]">Company Name</div>
                  <div className="text-xs font-medium text-[var(--foreground)]">{supplier.companyName}</div>
                </div>
                {/* Email */}
                <div>
                  <div className="mb-0.5 text-[10px] text-[var(--muted)]">Email</div>
                  {editData.email || supplier.email ? (
                    <a href={`mailto:${editData.email || supplier.email}`} className="flex items-center gap-1 text-blue-500 hover:underline break-all text-xs">
                      <Mail size={11} />{editData.email || supplier.email}
                    </a>
                  ) : <span className="text-xs italic text-[var(--muted)]">—</span>}
                </div>
                {/* Phone */}
                <div>
                  <div className="mb-0.5 text-[10px] text-[var(--muted)]">Phone</div>
                  {editData.phone || supplier.phone ? (
                    <div className="flex items-center gap-1 text-xs text-[var(--foreground)]">
                      <Phone size={11} className="text-[var(--muted)]" />{editData.phone || supplier.phone}
                    </div>
                  ) : <span className="text-xs italic text-[var(--muted)]">—</span>}
                </div>
                {/* Website */}
                <div>
                  <div className="mb-0.5 text-[10px] text-[var(--muted)]">Website / Company Link</div>
                  {editData.website || supplier.website ? (
                    <a
                      href={(editData.website || supplier.website || "").startsWith("http") ? (editData.website || supplier.website)! : `https://${editData.website || supplier.website}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-blue-500 hover:underline truncate">
                      <Globe size={11} />{editData.website || supplier.website}<ExternalLink size={9} />
                    </a>
                  ) : <span className="text-xs italic text-[var(--muted)]">—</span>}
                </div>
              </div>
            )}
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
          <OpportunitiesSection
            supplierId={supplier.id}
            contactName={supplier.companyName}
            opportunities={opportunities}
            pipelines={pipelines}
          />

        </div>

        {/* ── CENTER PANE: Conversation / email ── */}
        <div className="flex flex-1 flex-col overflow-hidden bg-[var(--bg)]">
          <ConversationPane
            supplierId={supplier.id}
            supplierEmail={supplier.email}
            supplierName={supplier.companyName}
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

/* ─── Inline Opportunities section ─────────────────────────── */
function OpportunitiesSection({
  supplierId, contactName, opportunities, pipelines,
}: {
  supplierId: string;
  contactName: string;
  opportunities: Opportunity[];
  pipelines: Pipeline[];
}) {
  const [showForm, setShowForm] = useState(false);
  const [selectedPipelineId, setSelectedPipelineId] = useState(pipelines[0]?.id ?? "");
  const [pending, startTransition] = useTransition();

  const pipeline = pipelines.find((p) => p.id === selectedPipelineId);
  const stages = pipeline?.stages.slice().sort((a, b) => a.order - b.order) ?? [];

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("supplierId", supplierId);
    fd.set("pipelineId", selectedPipelineId);
    startTransition(async () => {
      await createOpportunity(fd);
      setShowForm(false);
    });
  }

  return (
    <div className="border-t border-[var(--border)] px-5 py-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">Opportunities</p>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1 rounded-lg bg-blue-600 px-2 py-1 text-[10px] font-medium text-white hover:bg-blue-500">
          {showForm ? "Cancel" : "+ Add"}
        </button>
      </div>

      {showForm && pipelines.length > 0 && (
        <form onSubmit={handleSubmit} className="mb-3 flex flex-col gap-2 rounded-xl border border-[var(--border)] bg-[var(--background)] p-3">
          <div>
            <label className="mb-0.5 block text-[10px] text-[var(--muted)]">Opportunity name</label>
            <input name="name" defaultValue={contactName} required className="input w-full text-xs" />
          </div>
          <div>
            <label className="mb-0.5 block text-[10px] text-[var(--muted)]">Pipeline</label>
            <select value={selectedPipelineId} onChange={(e) => setSelectedPipelineId(e.target.value)} className="input w-full text-xs">
              {pipelines.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-0.5 block text-[10px] text-[var(--muted)]">Stage</label>
            <select name="stageId" required className="input w-full text-xs">
              {stages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-0.5 block text-[10px] text-[var(--muted)]">Value ($)</label>
            <input name="value" type="number" min="0" step="0.01" placeholder="0" className="input w-full text-xs" />
          </div>
          <button type="submit" disabled={pending}
            className="w-full rounded-lg bg-blue-600 py-1.5 text-xs font-medium text-white disabled:opacity-50">
            {pending ? "Adding…" : "Add opportunity"}
          </button>
        </form>
      )}

      {pipelines.length === 0 && showForm && (
        <p className="mb-3 text-xs text-[var(--muted)]">Create a pipeline first in <a href="/opportunities?tab=pipelines" className="text-blue-400 underline">Opportunities → Pipelines</a>.</p>
      )}

      {opportunities.length === 0 ? (
        <p className="text-xs text-[var(--muted)] italic">No opportunities yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {opportunities.map((opp) => (
            <div key={opp.id} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
              <div className="text-xs font-medium text-[var(--foreground)] truncate">{opp.name}</div>
              <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px] text-[var(--muted)]">
                <span>{opp.pipeline.name}</span>
                <span>·</span>
                <span>{opp.stage.name}</span>
                {opp.value && (
                  <><span>·</span><span className="font-medium text-emerald-600">${parseFloat(opp.value).toLocaleString()}</span></>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Conversation center pane ─────────────────────────────── */
function ConversationPane({
  supplierId,
  supplierEmail,
  supplierName,
  notes,
  emailTemplates,
}: {
  supplierId: string;
  supplierEmail: string | null;
  supplierName: string;
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
  const [emailError, setEmailError] = useState<string | null>(null);

  function applyTemplate(id: string) {
    const tmpl = emailTemplates.find((t) => t.id === id);
    if (!tmpl) return;
    setSubject(tmpl.subject);
    setBody(tmpl.body);
    setSelectedTemplate(id);
  }

  function handleSendEmail() {
    if (!supplierEmail || !subject.trim() || !body.trim()) return;
    setEmailError(null);
    startEmailTransition(async () => {
      const result = await sendContactEmail(supplierId, supplierEmail, subject, body);
      if (!result.success) {
        setEmailError(result.error === "NO_SMTP_CONNECTED"
          ? "NO_SMTP_CONNECTED"
          : result.error ?? "Failed to send email. Please try again.");
        return;
      }
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
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [notes.length]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Timeline */}
      <div className="flex-1 overflow-y-auto px-4 py-5 min-h-0">
        {timeline.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center py-16">
            <div className="rounded-full bg-[var(--accent-soft)] p-4 text-[var(--accent)]">
              <Mail size={24} />
            </div>
            <p className="font-medium text-[var(--foreground)]">No conversation yet</p>
            <p className="text-sm text-[var(--muted)]">Send an email or add a note to get started.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {timeline.map((item) => (
              <TimelineItem key={item.id} item={item} supplierInitials={getInitials(supplierName)} />
            ))}
            <div ref={bottomRef} />
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
            <p className="text-[10px] text-[var(--muted)]">
              Variables:{" "}
              {["first_name","last_name","company_name","email","phone","website"].map((v) => (
                <code key={v} className="mr-1 rounded bg-[var(--accent-soft)] px-1">&#123;&#123;{v}&#125;&#125;</code>
              ))}
            </p>
            {emailError === "NO_SMTP_CONNECTED" && (
              <div className="rounded-lg border border-amber-400 bg-amber-400/20 px-3 py-2 text-xs font-medium text-amber-200">
                ⚠ No email account connected.{" "}
                <Link href="/settings" className="underline font-semibold text-white hover:text-amber-100">
                  Connect your email in Settings →
                </Link>
              </div>
            )}
            {emailError && emailError !== "NO_SMTP_CONNECTED" && (
              <div className="rounded-lg border border-red-400 bg-red-500/20 px-3 py-2 text-xs font-medium text-red-200">
                ⚠ Failed to send: {emailError}
              </div>
            )}
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

function stripQuoted(text: string): string {
  const lines = text.split("\n");
  const clean: string[] = [];
  for (const line of lines) {
    const t = line.trim();
    if (/^On .{5,120} wrote:/.test(t)) break;
    if (t.startsWith(">")) continue;
    clean.push(line);
  }
  return clean.join("\n").trim();
}

function TimelineItem({ item, supplierInitials }: { item: ContactNote; supplierInitials: string }) {
  const [showDetails, setShowDetails] = useState(false);
  const isSent = item.type === "email_sent";
  const isReceived = item.type === "email_received";
  const isNote = item.type === "note";
  const date = new Date(item.createdAt).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  });
  const cleanContent = (isSent || isReceived) ? stripQuoted(item.content) : item.content;

  const DetailsModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setShowDetails(false)}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
      <div
        className="relative w-80 rounded-2xl border border-gray-200 bg-white shadow-2xl p-5 text-sm"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <span className="font-semibold text-base text-gray-900">Message Details</span>
          <button onClick={() => setShowDetails(false)} className="text-gray-400 hover:text-gray-700 transition text-lg leading-none">×</button>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] uppercase tracking-widest font-semibold text-gray-400">From</span>
            <span className="text-gray-900 font-medium">{isSent ? "Me" : item.subject ?? "Brand"}</span>
          </div>
          {item.subject && (
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] uppercase tracking-widest font-semibold text-gray-400">Subject</span>
              <span className="text-gray-800">{item.subject}</span>
            </div>
          )}
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] uppercase tracking-widest font-semibold text-gray-400">Direction</span>
            <span className="text-gray-800">{isSent ? "↑ Outbound (Email)" : "↓ Inbound (Email)"}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] uppercase tracking-widest font-semibold text-gray-400">Date</span>
            <span className="text-gray-800">{date}</span>
          </div>
        </div>
      </div>
    </div>
  );

  if (isNote) {
    return (
      <div className="flex justify-center">
        <div className="max-w-[80%] rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-center">
          <div className="flex items-center gap-1 justify-center mb-1">
            <StickyNote size={10} className="text-amber-400" />
            <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-400">Note</span>
          </div>
          <div className="text-xs text-[var(--foreground)] whitespace-pre-wrap">{cleanContent}</div>
          <div className="mt-1 text-[10px] text-[var(--muted)]">{date}</div>
        </div>
      </div>
    );
  }

  if (isSent) {
    return (
      <div className="flex items-end justify-end gap-2">
        <div className="relative flex flex-col items-end gap-0.5 max-w-[55%]">
          <div className="rounded-2xl rounded-tr-sm bg-blue-600 px-3.5 py-2.5 text-white shadow-sm">
            {item.subject && (
              <div className="mb-1 text-[10px] font-semibold text-blue-200 truncate">{item.subject}</div>
            )}
            <div className="text-xs whitespace-pre-wrap leading-relaxed">{cleanContent}</div>
          </div>
          <div className="flex items-center gap-1.5 pr-1">
            <span className="text-[10px] text-[var(--muted)]">{new Date(item.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
            <button
              onClick={() => setShowDetails(v => !v)}
              className="text-[var(--muted)] hover:text-[var(--foreground)] transition"
              title="Message details">
              <span className="text-[15px] font-bold leading-none">⋮</span>
            </button>
          </div>
          {showDetails && <DetailsModal />}
        </div>
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white shadow">
          Me
        </div>
      </div>
    );
  }

  if (isReceived) {
    return (
      <div className="flex items-end gap-2">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white shadow">
          {supplierInitials}
        </div>
        <div className="relative flex flex-col items-start gap-0.5 max-w-[55%]">
          <div className="rounded-2xl rounded-tl-sm bg-[var(--surface)] border border-[var(--border)] px-3.5 py-2.5 shadow-sm">
            {item.subject && (
              <div className="mb-1 text-[10px] font-semibold text-[var(--muted)] truncate">{item.subject}</div>
            )}
            <div className="text-xs whitespace-pre-wrap leading-relaxed text-[var(--foreground)]">{cleanContent}</div>
          </div>
          <div className="flex items-center gap-1.5 pl-1">
            <button
              onClick={() => setShowDetails(v => !v)}
              className="text-[var(--muted)] hover:text-[var(--foreground)] transition"
              title="Message details">
              <span className="text-[15px] font-bold leading-none">⋮</span>
            </button>
            <span className="text-[10px] text-[var(--muted)]">{new Date(item.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
          </div>
          {showDetails && <DetailsModal />}
        </div>
      </div>
    );
  }

  return null;
}

/* ─── Activity right pane ───────────────────────────────────── */
function ActivityPane({
  notes,
  supplier,
}: {
  notes: ContactNote[];
  supplier: { companyName: string; stage: string; createdAt: string };
}) {
  const initials = supplier.companyName.split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? "").join("");

  type ActivityItem = {
    avatar: React.ReactNode;
    label: string;
    preview: string;
    date: string;
    type: string;
  };

  const items: ActivityItem[] = [];

  items.push({
    avatar: <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-500/20 text-[10px] font-bold text-slate-400">{initials}</div>,
    label: "Contact created",
    preview: supplier.companyName,
    date: new Date(supplier.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    type: "created",
  });

  for (const n of [...notes].reverse()) {
    const isSent = n.type === "email_sent";
    const isReceived = n.type === "email_received";
    items.push({
      avatar: isSent
        ? <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">Me</div>
        : isReceived
        ? <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">{initials}</div>
        : <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-[10px] font-bold text-amber-400"><StickyNote size={12} /></div>,
      label: isSent ? "You sent" : isReceived ? `${supplier.companyName} replied` : "Note",
      preview: n.subject ?? n.content.slice(0, 40),
      date: new Date(n.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      type: n.type,
    });
  }

  return (
    <div className="px-4 py-5">
      <p className="mb-4 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">Activity</p>
      <div className="flex flex-col gap-3">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-2.5">
            {item.avatar}
            <div className="flex-1 min-w-0 pt-1">
              <div className="text-xs font-medium text-[var(--foreground)] leading-snug truncate">{item.label}</div>
              <div className="text-[10px] text-[var(--muted)] truncate">{item.preview}</div>
              <div className="mt-0.5 text-[10px] text-[var(--muted)]/60">{item.date}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

