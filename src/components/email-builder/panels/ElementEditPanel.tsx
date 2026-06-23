"use client";
import { useRef } from "react";
import { EmailDoc, EmailElement } from "@/lib/email-builder";
import type { MergeVariable } from "@/lib/merge-variables";
import { MergeVariablePicker } from "../MergeVariablePicker";
import { X } from "lucide-react";

type Selection = { kind: "element"; sectionId: string; rowId: string; columnId: string; elementId: string };

function insertAtCursor(
  ref: React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>,
  token: string,
  onUpdate: (val: string) => void,
) {
  const el = ref.current;
  if (!el) return;
  const start = el.selectionStart ?? el.value.length;
  const end = el.selectionEnd ?? el.value.length;
  const next = el.value.slice(0, start) + token + el.value.slice(end);
  onUpdate(next);
  requestAnimationFrame(() => {
    el.focus();
    el.setSelectionRange(start + token.length, start + token.length);
  });
}

export function ElementEditPanel({ doc, selection, onChange, onClose, mergeVariables }: {
  doc: EmailDoc; selection: Selection; onChange: (d: EmailDoc) => void;
  onClose: () => void; mergeVariables: MergeVariable[];
}) {
  const textRef = useRef<HTMLTextAreaElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const urlRef = useRef<HTMLInputElement>(null);

  const el = doc.sections.find(s => s.id === selection.sectionId)
    ?.rows.find(r => r.id === selection.rowId)
    ?.columns.find(c => c.id === selection.columnId)
    ?.elements.find(e => e.id === selection.elementId);

  if (!el) return null;

  function updateEl(patch: Partial<EmailElement>) {
    onChange({
      ...doc,
      sections: doc.sections.map(s => s.id === selection.sectionId ? {
        ...s, rows: s.rows.map(r => r.id === selection.rowId ? {
          ...r, columns: r.columns.map(c => c.id === selection.columnId ? {
            ...c, elements: c.elements.map(e => e.id === selection.elementId ? { ...e, ...patch } as EmailElement : e),
          } : c),
        } : r),
      } : s),
    });
  }

  const AlignBtns = ({ value, onChange: onA }: { value: string; onChange: (v: "left" | "center" | "right") => void }) => (
    <div className="flex gap-1">
      {(["left", "center", "right"] as const).map(a => (
        <button key={a} onClick={() => onA(a)}
          className={`flex-1 rounded-lg border py-1 text-xs capitalize transition ${value === a ? "border-[#0E90C8] bg-[#0E90C8]/10 text-white" : "border-[#1E3A5F] text-slate-400"}`}>{a}</button>
      ))}
    </div>
  );
  const Lbl = ({ children }: { children: React.ReactNode }) => (
    <label className="mb-1 block text-xs font-semibold text-slate-300">{children}</label>
  );

  return (
    <div className="flex w-72 shrink-0 flex-col overflow-y-auto border-l border-[#1E3A5F] bg-[#0A1628] p-4 gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold capitalize text-white">{el.type}</h3>
        <button onClick={onClose} className="rounded p-1 text-slate-400 hover:text-white"><X size={14} /></button>
      </div>

      {el.type === "heading" && <>
        <div>
          <div className="flex items-center justify-between mb-1">
            <Lbl>Text</Lbl>
            <MergeVariablePicker variables={mergeVariables} onInsert={t => insertAtCursor(inputRef as React.RefObject<HTMLInputElement>, t, v => updateEl({ text: v }))} />
          </div>
          <input ref={inputRef} value={el.text} onChange={e => updateEl({ text: e.target.value })}
            className="w-full rounded border border-[#1E3A5F] bg-[#030A18] px-3 py-2 text-sm text-white" />
        </div>
        <div>
          <Lbl>Level</Lbl>
          <div className="flex gap-2">{([1, 2, 3] as const).map(l => (
            <button key={l} onClick={() => updateEl({ level: l })}
              className={`flex-1 rounded-lg border py-1.5 text-xs transition ${el.level === l ? "border-[#0E90C8] bg-[#0E90C8]/10 text-white" : "border-[#1E3A5F] text-slate-400"}`}>H{l}</button>
          ))}</div>
        </div>
        <div><Lbl>Align</Lbl><AlignBtns value={el.align} onChange={v => updateEl({ align: v })} /></div>
        <div><Lbl>Color</Lbl><input type="color" value={el.color} onChange={e => updateEl({ color: e.target.value })} className="h-8 w-full cursor-pointer rounded border border-[#1E3A5F] bg-[#030A18]" /></div>
      </>}

      {el.type === "text" && <>
        <div>
          <div className="flex items-center justify-between mb-1">
            <Lbl>Content</Lbl>
            <MergeVariablePicker variables={mergeVariables} onInsert={t => insertAtCursor(textRef, t, v => updateEl({ content: v }))} />
          </div>
          <textarea ref={textRef} value={el.content} onChange={e => updateEl({ content: e.target.value })} rows={6}
            className="w-full rounded border border-[#1E3A5F] bg-[#030A18] px-3 py-2 text-sm text-white resize-y" />
        </div>
        <div><Lbl>Align</Lbl><AlignBtns value={el.align} onChange={v => updateEl({ align: v })} /></div>
        <div><Lbl>Font size (px)</Lbl>
          <input type="number" value={el.fontSize} onChange={e => updateEl({ fontSize: Number(e.target.value) })}
            className="w-full rounded border border-[#1E3A5F] bg-[#030A18] px-3 py-2 text-sm text-white" />
        </div>
        <div><Lbl>Color</Lbl><input type="color" value={el.color} onChange={e => updateEl({ color: e.target.value })} className="h-8 w-full cursor-pointer rounded border border-[#1E3A5F] bg-[#030A18]" /></div>
      </>}

      {el.type === "button" && <>
        <div>
          <div className="flex items-center justify-between mb-1">
            <Lbl>Label</Lbl>
            <MergeVariablePicker variables={mergeVariables} onInsert={t => insertAtCursor(inputRef as React.RefObject<HTMLInputElement>, t, v => updateEl({ label: v }))} />
          </div>
          <input ref={inputRef} value={el.label} onChange={e => updateEl({ label: e.target.value })}
            className="w-full rounded border border-[#1E3A5F] bg-[#030A18] px-3 py-2 text-sm text-white" />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <Lbl>URL</Lbl>
            <MergeVariablePicker variables={mergeVariables} onInsert={t => insertAtCursor(urlRef as React.RefObject<HTMLInputElement>, t, v => updateEl({ url: v }))} />
          </div>
          <input ref={urlRef} value={el.url} onChange={e => updateEl({ url: e.target.value })}
            className="w-full rounded border border-[#1E3A5F] bg-[#030A18] px-3 py-2 text-sm text-white" />
        </div>
        <div><Lbl>Align</Lbl><AlignBtns value={el.align} onChange={v => updateEl({ align: v })} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Lbl>BG Color</Lbl><input type="color" value={el.bgColor} onChange={e => updateEl({ bgColor: e.target.value })} className="h-8 w-full cursor-pointer rounded border border-[#1E3A5F] bg-[#030A18]" /></div>
          <div><Lbl>Text Color</Lbl><input type="color" value={el.textColor} onChange={e => updateEl({ textColor: e.target.value })} className="h-8 w-full cursor-pointer rounded border border-[#1E3A5F] bg-[#030A18]" /></div>
        </div>
        <div><Lbl>Border Radius (px)</Lbl>
          <input type="number" min={0} value={el.borderRadius} onChange={e => updateEl({ borderRadius: Number(e.target.value) })}
            className="w-full rounded border border-[#1E3A5F] bg-[#030A18] px-3 py-2 text-sm text-white" />
        </div>
      </>}

      {el.type === "image" && <>
        <div><Lbl>Image URL</Lbl><input value={el.src} onChange={e => updateEl({ src: e.target.value })} placeholder="https://…" className="w-full rounded border border-[#1E3A5F] bg-[#030A18] px-3 py-2 text-sm text-white" /></div>
        <div><Lbl>Alt text</Lbl><input value={el.alt} onChange={e => updateEl({ alt: e.target.value })} className="w-full rounded border border-[#1E3A5F] bg-[#030A18] px-3 py-2 text-sm text-white" /></div>
        <div><Lbl>Width (e.g. 100%, 300px)</Lbl><input value={el.width} onChange={e => updateEl({ width: e.target.value })} className="w-full rounded border border-[#1E3A5F] bg-[#030A18] px-3 py-2 text-sm text-white" /></div>
        <div><Lbl>Align</Lbl><AlignBtns value={el.align} onChange={v => updateEl({ align: v })} /></div>
        <div><Lbl>Link URL (optional)</Lbl><input value={el.linkUrl ?? ""} onChange={e => updateEl({ linkUrl: e.target.value || undefined })} className="w-full rounded border border-[#1E3A5F] bg-[#030A18] px-3 py-2 text-sm text-white" /></div>
      </>}

      {el.type === "divider" && <>
        <div><Lbl>Color</Lbl><input type="color" value={el.color} onChange={e => updateEl({ color: e.target.value })} className="h-8 w-full cursor-pointer rounded border border-[#1E3A5F] bg-[#030A18]" /></div>
        <div><Lbl>Thickness (px)</Lbl><input type="number" min={1} value={el.thickness} onChange={e => updateEl({ thickness: Number(e.target.value) })} className="w-full rounded border border-[#1E3A5F] bg-[#030A18] px-3 py-2 text-sm text-white" /></div>
      </>}

      {el.type === "spacer" && <>
        <div><Lbl>Height (px)</Lbl><input type="number" min={4} value={el.px} onChange={e => updateEl({ px: Number(e.target.value) })} className="w-full rounded border border-[#1E3A5F] bg-[#030A18] px-3 py-2 text-sm text-white" /></div>
        <div className="rounded-lg border border-[#1E3A5F]" style={{ height: Math.min(el.px, 80) }} />
      </>}

      {el.type === "social" && <>
        <div><Lbl>Align</Lbl><AlignBtns value={el.align} onChange={v => updateEl({ align: v })} /></div>
        <div className="flex flex-col gap-2">
          {el.platforms.map((p, i) => (
            <div key={i} className="flex gap-1.5">
              <input value={p.name} onChange={e => updateEl({ platforms: el.platforms.map((x, j) => j === i ? { ...x, name: e.target.value } : x) })}
                placeholder="name" className="w-20 rounded border border-[#1E3A5F] bg-[#030A18] px-2 py-1.5 text-xs text-white" />
              <input value={p.url} onChange={e => updateEl({ platforms: el.platforms.map((x, j) => j === i ? { ...x, url: e.target.value } : x) })}
                placeholder="https://…" className="flex-1 rounded border border-[#1E3A5F] bg-[#030A18] px-2 py-1.5 text-xs text-white" />
              <button onClick={() => updateEl({ platforms: el.platforms.filter((_, j) => j !== i) })}
                className="rounded p-1 text-red-400 hover:bg-red-500/10"><X size={12} /></button>
            </div>
          ))}
          <button onClick={() => updateEl({ platforms: [...el.platforms, { name: "", url: "" }] })}
            className="rounded-lg border border-dashed border-[#1E3A5F] py-1.5 text-xs text-slate-400 hover:border-[#0E90C8]">+ Add platform</button>
        </div>
      </>}

      {el.type === "video" && <>
        <div><Lbl>Thumbnail URL</Lbl><input value={el.thumbnailUrl} onChange={e => updateEl({ thumbnailUrl: e.target.value })} className="w-full rounded border border-[#1E3A5F] bg-[#030A18] px-3 py-2 text-sm text-white" /></div>
        <div><Lbl>Video URL</Lbl><input value={el.videoUrl} onChange={e => updateEl({ videoUrl: e.target.value })} className="w-full rounded border border-[#1E3A5F] bg-[#030A18] px-3 py-2 text-sm text-white" /></div>
        <div><Lbl>Align</Lbl><AlignBtns value={el.align} onChange={v => updateEl({ align: v })} /></div>
      </>}

      {el.type === "html" && (
        <div>
          <Lbl>Raw HTML <span className="font-normal text-amber-400">(Advanced — no validation)</span></Lbl>
          <textarea value={el.code} onChange={e => updateEl({ code: e.target.value })} rows={10}
            className="w-full rounded border border-[#1E3A5F] bg-[#030A18] px-3 py-2 font-mono text-xs text-white resize-y" />
        </div>
      )}
    </div>
  );
}
