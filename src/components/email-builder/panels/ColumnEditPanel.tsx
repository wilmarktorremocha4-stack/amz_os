"use client";
import { EmailDoc, EmailColumn } from "@/lib/email-builder";
import { X } from "lucide-react";

export function ColumnEditPanel({ doc, sectionId, rowId, columnId, onChange, onClose }: {
  doc: EmailDoc; sectionId: string; rowId: string; columnId: string;
  onChange: (d: EmailDoc) => void; onClose: () => void;
}) {
  const col = doc.sections.find(s => s.id === sectionId)?.rows.find(r => r.id === rowId)?.columns.find(c => c.id === columnId);
  if (!col) return null;

  function updateCol(patch: Partial<EmailColumn>) {
    onChange({
      ...doc,
      sections: doc.sections.map(s => s.id === sectionId ? {
        ...s, rows: s.rows.map(r => r.id === rowId ? {
          ...r, columns: r.columns.map(c => c.id === columnId ? { ...c, ...patch } : c),
        } : r),
      } : s),
    });
  }

  const sides = ["top", "right", "bottom", "left"] as const;

  return (
    <div className="flex w-72 shrink-0 flex-col overflow-y-auto border-l border-[#1E3A5F] bg-[#0A1628] p-4 gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white">Column</h3>
        <button onClick={onClose} className="rounded p-1 text-slate-400 hover:text-white"><X size={14} /></button>
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-300">Background</label>
        <input type="color" value={col.backgroundColor || "#ffffff"}
          onChange={e => updateCol({ backgroundColor: e.target.value === "#ffffff" ? "" : e.target.value })}
          className="h-8 w-full cursor-pointer rounded border border-[#1E3A5F] bg-[#030A18]" />
      </div>
      <div>
        <p className="mb-2 text-xs font-semibold text-slate-300">Padding</p>
        <div className="grid grid-cols-4 gap-1.5">
          {sides.map(s => (
            <div key={s} className="flex flex-col items-center gap-0.5">
              <input type="number" min={0} value={col.padding[s]}
                onChange={e => updateCol({ padding: { ...col.padding, [s]: Number(e.target.value) } })}
                className="w-full rounded border border-[#1E3A5F] bg-[#030A18] px-1.5 py-1 text-center text-xs text-white" />
              <span className="text-[9px] capitalize text-slate-500">{s}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-300">Vertical Align</label>
        <div className="flex gap-2">
          {(["top", "middle", "bottom"] as const).map(v => (
            <button key={v} onClick={() => updateCol({ verticalAlign: v })}
              className={`flex-1 rounded-lg border py-1.5 text-xs capitalize transition ${
                col.verticalAlign === v ? "border-[#0E90C8] bg-[#0E90C8]/10 text-white" : "border-[#1E3A5F] text-slate-400"
              }`}>{v}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
