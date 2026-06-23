"use client";
import { RowLayout, ROW_LAYOUTS, ROW_LAYOUT_LABELS } from "@/lib/email-builder";

const LAYOUTS: RowLayout[] = ["1", "2", "3", "1:2", "2:1", "1:3", "3:1", "4"];

export function LayoutPicker({ selected, onSelect }: { selected: RowLayout; onSelect: (l: RowLayout) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {LAYOUTS.map(layout => {
        const widths = ROW_LAYOUTS[layout];
        return (
          <button key={layout} onClick={() => onSelect(layout)}
            className={`flex flex-col items-center gap-1.5 rounded-lg border p-2.5 transition ${
              selected === layout ? "border-[#0E90C8] bg-[#0E90C8]/10" : "border-[#1E3A5F] bg-[#030A18] hover:border-[#0E90C8]/50"
            }`}>
            <div className="flex h-8 w-full gap-0.5">
              {widths.map((w, i) => (
                <div key={i} style={{ width: `${w}%` }} className="rounded-sm bg-[#1E3A5F]" />
              ))}
            </div>
            <span className="text-[10px] text-slate-400">{ROW_LAYOUT_LABELS[layout]}</span>
          </button>
        );
      })}
    </div>
  );
}
