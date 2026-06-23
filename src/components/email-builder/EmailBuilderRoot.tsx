"use client";
import { useState, useCallback } from "react";
import { DndContext, DragEndEvent, DragOverEvent, closestCenter } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { EmailDoc, EmailElement, renderEmailHtml, createSection, createElement } from "@/lib/email-builder";
import type { MergeVariable } from "@/lib/merge-variables";
import { BuilderCanvas } from "./BuilderCanvas";
import { ElementPalette } from "./ElementPalette";
import { SectionEditPanel } from "./panels/SectionEditPanel";
import { RowEditPanel } from "./panels/RowEditPanel";
import { ColumnEditPanel } from "./panels/ColumnEditPanel";
import { ElementEditPanel } from "./panels/ElementEditPanel";
import { Plus, Smartphone, Monitor } from "lucide-react";

type Selection =
  | { kind: "section"; sectionId: string }
  | { kind: "row"; sectionId: string; rowId: string }
  | { kind: "column"; sectionId: string; rowId: string; columnId: string }
  | { kind: "element"; sectionId: string; rowId: string; columnId: string; elementId: string }
  | null;

interface Props {
  doc: EmailDoc;
  onChange: (doc: EmailDoc) => void;
  onHtmlChange: (html: string) => void;
  mergeVariables: MergeVariable[];
}

export function EmailBuilderRoot({ doc, onChange, onHtmlChange, mergeVariables }: Props) {
  const [selection, setSelection] = useState<Selection>(null);
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");

  const updateDoc = useCallback((newDoc: EmailDoc) => {
    onChange(newDoc);
    const sampleVars = Object.fromEntries(mergeVariables.map(v => [v.key, v.sample]));
    onHtmlChange(renderEmailHtml(newDoc, sampleVars));
  }, [onChange, onHtmlChange, mergeVariables]);

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!active || !over) return;
    if (active.data.current?.type === "new-element" && over.data.current?.type === "column") {
      const { sectionId, rowId, columnId } = over.data.current as { sectionId: string; rowId: string; columnId: string };
      const elType = active.data.current.elementType as EmailElement["type"];
      const col = doc.sections.find(s => s.id === sectionId)?.rows.find(r => r.id === rowId)?.columns.find(c => c.id === columnId);
      if (!col) return;
      // Only add if not already a temp placeholder
      if (col.elements.some(e => e.id === `tmp-${active.id}`)) return;
      const newEl = { ...createElement(elType), id: `tmp-${active.id}` };
      const newDoc = { ...doc, sections: doc.sections.map(s => s.id === sectionId ? { ...s, rows: s.rows.map(r => r.id === rowId ? { ...r, columns: r.columns.map(c => c.id === columnId ? { ...c, elements: [...c.elements.filter(e => !e.id.startsWith("tmp-")), newEl] } : c) } : r) } : s) };
      updateDoc(newDoc);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) {
      // Remove any tmp placeholder
      const cleaned = { ...doc, sections: doc.sections.map(s => ({ ...s, rows: s.rows.map(r => ({ ...r, columns: r.columns.map(c => ({ ...c, elements: c.elements.filter(e => !e.id.startsWith("tmp-")) })) })) })) };
      updateDoc(cleaned);
      return;
    }

    // Finalize drop of new element from palette
    if (active.data.current?.type === "new-element") {
      const elType = active.data.current.elementType as EmailElement["type"];
      const realEl = createElement(elType);
      const finalized = { ...doc, sections: doc.sections.map(s => ({ ...s, rows: s.rows.map(r => ({ ...r, columns: r.columns.map(c => ({ ...c, elements: c.elements.map(e => e.id === `tmp-${active.id}` ? { ...realEl, id: realEl.id } : e) })) })) })) };
      updateDoc(finalized);
      return;
    }

    // Reorder elements within a column
    if (active.data.current?.type === "element" && over.data.current?.type === "element") {
      for (const sec of doc.sections) {
        for (const row of sec.rows) {
          for (const col of row.columns) {
            const ids = col.elements.map(e => e.id);
            if (ids.includes(active.id as string) && ids.includes(over.id as string)) {
              const newEls = arrayMove(col.elements, ids.indexOf(active.id as string), ids.indexOf(over.id as string));
              updateDoc({ ...doc, sections: doc.sections.map(s => s.id === sec.id ? { ...s, rows: s.rows.map(r => r.id === row.id ? { ...r, columns: r.columns.map(c => c.id === col.id ? { ...c, elements: newEls } : c) } : r) } : s) });
              return;
            }
          }
        }
      }
    }
  }

  return (
    <div className="flex h-full flex-col bg-[#030A18]">
      <div className="flex items-center justify-between border-b border-[#1E3A5F] bg-[#0A1628] px-4 py-2">
        <button onClick={() => updateDoc({ ...doc, sections: [...doc.sections, createSection()] })}
          className="flex items-center gap-1.5 rounded-lg bg-[#0E90C8] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1DBBEE]">
          <Plus size={13} /> Add Section
        </button>
        <div className="flex items-center gap-1 rounded-lg border border-[#1E3A5F] p-0.5">
          <button onClick={() => setViewport("desktop")} className={`rounded p-1.5 ${viewport === "desktop" ? "bg-[#0E90C8] text-white" : "text-slate-400"}`}><Monitor size={14} /></button>
          <button onClick={() => setViewport("mobile")} className={`rounded p-1.5 ${viewport === "mobile" ? "bg-[#0E90C8] text-white" : "text-slate-400"}`}><Smartphone size={14} /></button>
        </div>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <ElementPalette />
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd} onDragOver={handleDragOver}>
          <BuilderCanvas doc={doc} selection={selection} onSelect={setSelection} onChange={updateDoc} viewport={viewport} />
        </DndContext>
        {selection?.kind === "section" && <SectionEditPanel doc={doc} sectionId={selection.sectionId} onChange={updateDoc} onClose={() => setSelection(null)} />}
        {selection?.kind === "row" && <RowEditPanel doc={doc} sectionId={selection.sectionId} rowId={selection.rowId} onChange={updateDoc} onClose={() => setSelection(null)} />}
        {selection?.kind === "column" && <ColumnEditPanel doc={doc} sectionId={selection.sectionId} rowId={selection.rowId} columnId={selection.columnId} onChange={updateDoc} onClose={() => setSelection(null)} />}
        {selection?.kind === "element" && <ElementEditPanel doc={doc} selection={selection} onChange={updateDoc} onClose={() => setSelection(null)} mergeVariables={mergeVariables} />}
      </div>
    </div>
  );
}
