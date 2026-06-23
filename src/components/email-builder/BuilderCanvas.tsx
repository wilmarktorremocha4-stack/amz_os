"use client";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { EmailDoc, EmailElement } from "@/lib/email-builder";
import { GripVertical, Trash2 } from "lucide-react";

type Selection =
  | { kind: "section"; sectionId: string }
  | { kind: "row"; sectionId: string; rowId: string }
  | { kind: "column"; sectionId: string; rowId: string; columnId: string }
  | { kind: "element"; sectionId: string; rowId: string; columnId: string; elementId: string }
  | null;

function ElementView({ el, selected, onClick, onDelete }: {
  el: EmailElement; selected: boolean; onClick: () => void; onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: el.id, data: { type: "element", elementId: el.id },
  });
  return (
    <div ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      onClick={e => { e.stopPropagation(); onClick(); }}
      className={`group relative rounded border-2 transition cursor-pointer ${selected ? "border-[#0E90C8]" : "border-transparent hover:border-[#0E90C8]/40"}`}>
      <div className="absolute -left-5 top-0 z-10 flex flex-col opacity-0 group-hover:opacity-100">
        <button {...listeners} {...attributes} className="cursor-grab p-0.5 text-slate-500 hover:text-white"><GripVertical size={12} /></button>
        <button onClick={e => { e.stopPropagation(); onDelete(); }} className="p-0.5 text-red-400 hover:text-red-300"><Trash2 size={11} /></button>
      </div>
      <div className="pointer-events-none px-2 py-1 text-xs text-slate-400">
        <span className="font-semibold capitalize text-slate-300">{el.type}</span>
        {el.type === "heading" && <span className="ml-1.5 opacity-60 truncate">{el.text.slice(0, 50)}</span>}
        {el.type === "text" && <span className="ml-1.5 opacity-60 truncate">{el.content.slice(0, 50)}</span>}
        {el.type === "button" && <span className="ml-1.5 opacity-60">[{el.label}]</span>}
        {el.type === "spacer" && <span className="ml-1.5 opacity-60">{el.px}px</span>}
        {el.type === "divider" && <hr style={{ borderColor: el.color, borderTopWidth: el.thickness }} className="mt-1" />}
      </div>
    </div>
  );
}

function ColumnDropZone({ sectionId, rowId, col, selectedColId, selectedElId, onSelectCol, onSelectEl, onDeleteEl, onChange, doc }: {
  sectionId: string; rowId: string;
  col: { id: string; widthPercent: number; elements: EmailElement[]; backgroundColor: string; padding: { top: number; right: number; bottom: number; left: number } };
  selectedColId: string | null; selectedElId: string | null;
  onSelectCol: () => void; onSelectEl: (id: string) => void; onDeleteEl: (id: string) => void;
  onChange: (d: EmailDoc) => void; doc: EmailDoc;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `drop-${col.id}`,
    data: { type: "column", sectionId, rowId, columnId: col.id },
  });
  const isSelected = selectedColId === col.id;
  return (
    <div ref={setNodeRef}
      onClick={e => { e.stopPropagation(); onSelectCol(); }}
      className={`relative flex-1 min-h-[56px] rounded border-2 transition ${isSelected ? "border-sky-400/60" : "border-transparent hover:border-sky-400/30"} ${isOver ? "bg-[#0E90C8]/5" : ""}`}
      style={{ width: `${col.widthPercent}%`, padding: `${col.padding.top}px ${col.padding.right}px ${col.padding.bottom}px ${col.padding.left}px`, background: col.backgroundColor || undefined }}>
      <SortableContext items={col.elements.map(e => e.id)} strategy={verticalListSortingStrategy}>
        {col.elements.map(el => (
          <ElementView key={el.id} el={el} selected={selectedElId === el.id}
            onClick={() => onSelectEl(el.id)}
            onDelete={() => onDeleteEl(el.id)} />
        ))}
      </SortableContext>
      {col.elements.length === 0 && (
        <div className={`flex h-10 items-center justify-center text-[10px] text-slate-600 ${isOver ? "text-[#0E90C8]" : ""}`}>
          {isOver ? "Drop here" : "Empty column"}
        </div>
      )}
    </div>
  );
}

export function BuilderCanvas({ doc, selection, onSelect, onChange, viewport }: {
  doc: EmailDoc; selection: Selection; onSelect: (s: Selection) => void;
  onChange: (d: EmailDoc) => void; viewport: "desktop" | "mobile";
}) {
  const maxW = viewport === "mobile" ? 375 : doc.contentWidth;

  function deleteElement(sId: string, rId: string, cId: string, eId: string) {
    onChange({ ...doc, sections: doc.sections.map(s => s.id === sId ? { ...s, rows: s.rows.map(r => r.id === rId ? { ...r, columns: r.columns.map(c => c.id === cId ? { ...c, elements: c.elements.filter(e => e.id !== eId) } : c) } : r) } : s) });
  }
  function deleteRow(sId: string, rId: string) {
    onChange({ ...doc, sections: doc.sections.map(s => s.id === sId ? { ...s, rows: s.rows.filter(r => r.id !== rId) } : s) });
  }
  function deleteSection(sId: string) {
    onChange({ ...doc, sections: doc.sections.filter(s => s.id !== sId) });
    if (selection?.kind === "section" && selection.sectionId === sId) onSelect(null);
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#030A18] p-6" onClick={() => onSelect(null)}>
      <div className="mx-auto" style={{ maxWidth: maxW }}>
        {doc.sections.map(sec => (
          <div key={sec.id}
            onClick={e => { e.stopPropagation(); onSelect({ kind: "section", sectionId: sec.id }); }}
            className={`group/sec relative mb-4 rounded border-2 transition cursor-pointer ${
              selection?.kind === "section" && selection.sectionId === sec.id ? "border-[#0E90C8]" : "border-transparent hover:border-[#0E90C8]/30"
            }`}
            style={{ background: sec.backgroundColor, padding: `${sec.padding.top}px ${sec.padding.right}px ${sec.padding.bottom}px ${sec.padding.left}px`, borderRadius: sec.borderRadius }}>
            <div className="absolute right-1 top-1 z-10 hidden gap-1 group-hover/sec:flex">
              <button onClick={e => { e.stopPropagation(); deleteSection(sec.id); }}
                className="rounded p-1 bg-[#0A1628]/80 text-red-400 hover:text-red-300"><Trash2 size={11} /></button>
            </div>
            {sec.rows.map(row => (
              <div key={row.id}
                onClick={e => { e.stopPropagation(); onSelect({ kind: "row", sectionId: sec.id, rowId: row.id }); }}
                className={`group/row relative mb-2 rounded border-2 transition cursor-pointer ${
                  selection?.kind === "row" && selection.rowId === row.id ? "border-purple-400/60" : "border-transparent hover:border-purple-400/30"
                }`}>
                <div className="absolute right-1 top-1 z-10 hidden gap-1 group-hover/row:flex">
                  <button onClick={e => { e.stopPropagation(); deleteRow(sec.id, row.id); }}
                    className="rounded p-1 bg-[#0A1628]/80 text-red-400 hover:text-red-300"><Trash2 size={11} /></button>
                </div>
                <div className="flex gap-1 p-1">
                  {row.columns.map(col => (
                    <ColumnDropZone key={col.id} sectionId={sec.id} rowId={row.id} col={col} doc={doc}
                      selectedColId={selection?.kind === "column" ? selection.columnId : selection?.kind === "element" ? selection.columnId : null}
                      selectedElId={selection?.kind === "element" ? selection.elementId : null}
                      onSelectCol={() => onSelect({ kind: "column", sectionId: sec.id, rowId: row.id, columnId: col.id })}
                      onSelectEl={eId => onSelect({ kind: "element", sectionId: sec.id, rowId: row.id, columnId: col.id, elementId: eId })}
                      onDeleteEl={eId => deleteElement(sec.id, row.id, col.id, eId)}
                      onChange={onChange} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
        {doc.sections.length === 0 && (
          <div className="flex h-40 items-center justify-center rounded-xl border-2 border-dashed border-[#1E3A5F] text-sm text-slate-500">
            Click &ldquo;Add Section&rdquo; to start building your email
          </div>
        )}
      </div>
    </div>
  );
}
