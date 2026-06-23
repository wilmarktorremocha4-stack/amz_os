"use client";
import { EmailDoc, EmailSection } from "@/lib/email-builder";
import { X } from "lucide-react";

function PaddingEditor({ label, value, onChange }: {
  label: string;
  value: { top: number; right: number; bottom: number; left: number };
  onChange: (v: typeof value) => void;
}) {
  const sides = ["top", "right", "bottom", "left"] as const;
  return (
    <div>
      <p className="mb-2 text-xs font-semibold text-slate-300">{label}</p>
      <div className="grid grid-cols-4 gap-1.5">
        {sides.map(s => (
          <div key={s} className="flex flex-col items-center gap-0.5">
            <input type="number" value={value[s]} min={0}
              onChange={e => onChange({ ...value, [s]: Number(e.target.value) })}
              className="w-full rounded border border-[#1E3A5F] bg-[#030A18] px-1.5 py-1 text-center text-xs text-white" />
            <span className="text-[9px] text-slate-500 capitalize">{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SectionEditPanel({ doc, sectionId, onChange, onClose }: {
  doc: EmailDoc; sectionId: string; onChange: (d: EmailDoc) => void; onClose: () => void;
}) {
  const sec = doc.sections.find(s => s.id === sectionId);
  if (!sec) return null;

  function updateSection(patch: Partial<EmailSection>) {
    onChange({ ...doc, sections: doc.sections.map(s => s.id === sectionId ? { ...s, ...patch } : s) });
  }

  return (
    <div className="flex w-72 shrink-0 flex-col overflow-y-auto border-l border-[#1E3A5F] bg-[#0A1628] p-4 gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white">Section</h3>
        <button onClick={onClose} className="rounded p-1 text-slate-400 hover:text-white"><X size={14} /></button>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-300">Background Color</label>
        <input type="color" value={sec.backgroundColor}
          onChange={e => updateSection({ backgroundColor: e.target.value })}
          className="h-8 w-full cursor-pointer rounded border border-[#1E3A5F] bg-[#030A18]" />
      </div>

      <PaddingEditor label="Padding" value={sec.padding} onChange={p => updateSection({ padding: p })} />

      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-300">Border Color</label>
        <input type="color" value={sec.borderColor}
          onChange={e => updateSection({ borderColor: e.target.value })}
          className="h-8 w-full cursor-pointer rounded border border-[#1E3A5F] bg-[#030A18]" />
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold text-slate-300">Border Thickness</p>
        {(["top", "right", "bottom", "left"] as const).map(s => (
          <div key={s} className="mb-1 flex items-center gap-2">
            <span className="w-10 text-[10px] capitalize text-slate-500">{s}</span>
            <input type="number" min={0} value={sec.borderThickness[s]}
              onChange={e => updateSection({ borderThickness: { ...sec.borderThickness, [s]: Number(e.target.value) } })}
              className="w-full rounded border border-[#1E3A5F] bg-[#030A18] px-2 py-1 text-xs text-white" />
          </div>
        ))}
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-300">Border Radius (px)</label>
        <input type="number" min={0} value={sec.borderRadius}
          onChange={e => updateSection({ borderRadius: Number(e.target.value) })}
          className="w-full rounded border border-[#1E3A5F] bg-[#030A18] px-2 py-1 text-xs text-white" />
      </div>

      <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
        <input type="checkbox" checked={sec.fullWidth}
          onChange={e => updateSection({ fullWidth: e.target.checked })} className="rounded" />
        Full-width background
      </label>
    </div>
  );
}
