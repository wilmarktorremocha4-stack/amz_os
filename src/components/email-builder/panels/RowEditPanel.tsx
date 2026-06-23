"use client";
import { EmailDoc, RowLayout, createRow } from "@/lib/email-builder";
import { LayoutPicker } from "../LayoutPicker";
import { X } from "lucide-react";

export function RowEditPanel({ doc, sectionId, rowId, onChange, onClose }: {
  doc: EmailDoc; sectionId: string; rowId: string; onChange: (d: EmailDoc) => void; onClose: () => void;
}) {
  const sec = doc.sections.find(s => s.id === sectionId);
  const row = sec?.rows.find(r => r.id === rowId);
  if (!sec || !row) return null;

  function changeLayout(layout: RowLayout) {
    const newRow = { ...createRow(layout), id: row!.id };
    onChange({
      ...doc,
      sections: doc.sections.map(s => s.id === sectionId
        ? { ...s, rows: s.rows.map(r => r.id === rowId ? newRow : r) }
        : s),
    });
  }

  return (
    <div className="flex w-72 shrink-0 flex-col overflow-y-auto border-l border-[#1E3A5F] bg-[#0A1628] p-4 gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white">Row Layout</h3>
        <button onClick={onClose} className="rounded p-1 text-slate-400 hover:text-white"><X size={14} /></button>
      </div>
      <LayoutPicker selected={row.layout} onSelect={changeLayout} />
    </div>
  );
}
