"use client";
import { useState } from "react";
import type { MergeVariable } from "@/lib/merge-variables";
import { ChevronDown, Braces } from "lucide-react";

export function MergeVariablePicker({ variables, onInsert }: { variables: MergeVariable[]; onInsert: (token: string) => void }) {
  const [open, setOpen] = useState(false);
  const grouped = {
    Default: variables.filter(v => v.category === "Default"),
    "Custom Field": variables.filter(v => v.category === "Custom Field"),
  };
  return (
    <div className="relative inline-block">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 rounded-lg border border-[#1E3A5F] bg-[#030A18] px-2.5 py-1.5 text-xs text-slate-300 hover:border-[#0E90C8]">
        <Braces size={12} /> Variable <ChevronDown size={11} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-30 mt-1 w-64 max-h-72 overflow-y-auto rounded-xl border border-[#1E3A5F] bg-[#0A1628] shadow-xl">
            {(["Default", "Custom Field"] as const).map(cat => grouped[cat].length > 0 && (
              <div key={cat}>
                <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">{cat}</p>
                {grouped[cat].map(v => (
                  <button key={v.key} type="button"
                    onClick={() => { onInsert(`{{${v.key}}}`); setOpen(false); }}
                    className="flex w-full flex-col items-start px-3 py-1.5 text-left hover:bg-[#0E90C8]/10">
                    <span className="text-xs font-medium text-white">{v.label}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{`{{${v.key}}}`} · e.g. {v.sample}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
