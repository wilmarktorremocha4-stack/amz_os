"use client";
import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EmailDoc, DEFAULT_DOC, renderEmailHtml } from "@/lib/email-builder";
import { MergeVariable } from "@/lib/merge-variables";
import { EmailBuilderRoot } from "@/components/email-builder/EmailBuilderRoot";
import { createEmailTemplate, updateEmailTemplate } from "@/lib/actions/email-templates";
import { ArrowLeft, Save, Eye, CheckCircle2, Pencil } from "lucide-react";

export function TemplateEditorClient({ initialDoc, templateId, initialName, initialSubject, mergeVariables }: {
  initialDoc: EmailDoc;
  templateId?: string;
  initialName?: string;
  initialSubject?: string;
  mergeVariables: MergeVariable[];
}) {
  const router = useRouter();
  const [doc, setDoc] = useState<EmailDoc>(initialDoc);
  const [html, setHtml] = useState(() => renderEmailHtml(initialDoc));
  const [name, setName] = useState(initialName ?? "Untitled Template");
  const [subject, setSubject] = useState(initialSubject ?? "");
  const [editingName, setEditingName] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [preview, setPreview] = useState(false);
  const savedIdRef = useRef<string | undefined>(templateId);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const autosave = useCallback((newDoc: EmailDoc, newName: string, newSubject: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSaving(true);
      try {
        if (savedIdRef.current) {
          await updateEmailTemplate(savedIdRef.current, { name: newName, subject: newSubject, bodyJson: newDoc });
        } else {
          const tpl = await createEmailTemplate({ name: newName, subject: newSubject });
          savedIdRef.current = tpl.id;
          await updateEmailTemplate(tpl.id, { bodyJson: newDoc });
          router.replace(`/email/templates/${tpl.id}`);
        }
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } finally { setSaving(false); }
    }, 2000);
  }, [router]);

  function handleDocChange(newDoc: EmailDoc) {
    setDoc(newDoc);
    autosave(newDoc, name, subject);
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (savedIdRef.current) {
        await updateEmailTemplate(savedIdRef.current, { name, subject, bodyJson: doc });
      } else {
        const tpl = await createEmailTemplate({ name, subject });
        savedIdRef.current = tpl.id;
        await updateEmailTemplate(tpl.id, { bodyJson: doc });
        router.replace(`/email/templates/${tpl.id}`);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally { setSaving(false); }
  }

  return (
    <div className="flex h-screen flex-col bg-[#030A18]">
      {/* Top bar */}
      <div className="flex items-center gap-3 border-b border-[#1E3A5F] bg-[#0A1628] px-4 py-2.5">
        <Link href="/email/templates" className="flex items-center gap-1 text-sm text-slate-400 hover:text-white">
          <ArrowLeft size={15} /> Back
        </Link>
        <div className="h-4 w-px bg-[#1E3A5F]" />
        {editingName ? (
          <input autoFocus value={name} onChange={e => setName(e.target.value)}
            onBlur={() => { setEditingName(false); autosave(doc, name, subject); }}
            className="rounded border border-[#0E90C8] bg-transparent px-2 py-0.5 text-sm font-semibold text-white outline-none" />
        ) : (
          <button onClick={() => setEditingName(true)}
            className="flex items-center gap-1.5 text-sm font-semibold text-white hover:text-[#0E90C8]">
            {name} <Pencil size={12} className="text-slate-500" />
          </button>
        )}
        <div className="flex-1" />
        <span className="text-xs text-slate-500">
          {saving ? "Saving…" : saved
            ? <span className="flex items-center gap-1 text-green-400"><CheckCircle2 size={12} /> Saved</span>
            : "Autosave on"}
        </span>
        <input value={subject} onChange={e => { setSubject(e.target.value); autosave(doc, name, e.target.value); }}
          placeholder="Subject line…"
          className="w-64 rounded-lg border border-[#1E3A5F] bg-[#030A18] px-3 py-1.5 text-sm text-white placeholder-slate-500 outline-none focus:border-[#0E90C8]" />
        <button onClick={() => setPreview(v => !v)}
          className="flex items-center gap-1.5 rounded-lg border border-[#1E3A5F] px-3 py-1.5 text-sm text-slate-300 hover:border-[#0E90C8]">
          <Eye size={14} /> {preview ? "Edit" : "Preview"}
        </button>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-1.5 rounded-lg bg-[#0E90C8] px-4 py-1.5 text-sm font-semibold text-white hover:bg-[#1DBBEE] disabled:opacity-50">
          <Save size={14} /> Save Template
        </button>
      </div>

      {preview ? (
        <div className="flex-1 overflow-auto bg-gray-100 p-8">
          <div className="mx-auto max-w-2xl" dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      ) : (
        <div className="flex-1 overflow-hidden">
          <EmailBuilderRoot doc={doc} onChange={handleDocChange} onHtmlChange={setHtml} mergeVariables={mergeVariables} />
        </div>
      )}
    </div>
  );
}
