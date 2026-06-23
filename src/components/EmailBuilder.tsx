"use client";

import { useState, useCallback } from "react";
import {
  Type, Heading, Image, MousePointer, Minus, ArrowUp, ArrowDown,
  Trash2, Plus, Eye, EyeOff, AlignLeft, AlignCenter, AlignRight,
} from "lucide-react";
import { EmailBlock, newId, renderEmailHtml, createElement } from "@/lib/email-builder";

// Legacy flat doc shape — kept for backwards compat during migration
type EmailDoc = { blocks: EmailBlock[] };

type BlockType = EmailBlock["type"];

const BLOCK_MENU: { type: BlockType; label: string; icon: React.ReactNode }[] = [
  { type: "heading", label: "Heading", icon: <Heading size={14} /> },
  { type: "text", label: "Text", icon: <Type size={14} /> },
  { type: "button", label: "Button", icon: <MousePointer size={14} /> },
  { type: "image", label: "Image", icon: <Image size={14} /> },
  { type: "divider", label: "Divider", icon: <Minus size={14} /> },
  { type: "spacer", label: "Spacer", icon: <span className="text-xs font-mono">⬛</span> },
];

function makeBlock(type: BlockType): EmailBlock {
  return createElement(type) as EmailBlock;
}

export function EmailBuilder({ value, onChange }: { value: EmailDoc; onChange: (doc: EmailDoc) => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);

  const update = useCallback((blocks: EmailBlock[]) => onChange({ blocks }), [onChange]);

  function addBlock(type: BlockType) {
    update([...value.blocks, makeBlock(type)]);
  }

  function removeBlock(id: string) {
    update(value.blocks.filter((b) => b.id !== id));
    if (selected === id) setSelected(null);
  }

  function moveBlock(id: string, dir: -1 | 1) {
    const idx = value.blocks.findIndex((b) => b.id === id);
    if (idx < 0) return;
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= value.blocks.length) return;
    const next = [...value.blocks];
    [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
    update(next);
  }

  function patchBlock(id: string, patch: Partial<EmailBlock>) {
    update(value.blocks.map((b) => (b.id === id ? ({ ...b, ...patch } as EmailBlock) : b)));
  }

  const previewHtml = preview ? renderEmailHtml(value as unknown as import("@/lib/email-builder").EmailDoc, { firstName: "Jane", companyName: "Your Brand", senderName: "AMZ OS", unsubscribeUrl: "#" }) : "";

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Add block:</span>
        {BLOCK_MENU.map(({ type, label, icon }) => (
          <button key={type} type="button" onClick={() => addBlock(type)}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs text-[var(--foreground)] hover:border-blue-400 hover:text-blue-500 transition">
            {icon} {label}
          </button>
        ))}
        <button type="button" onClick={() => setPreview((v) => !v)}
          className={`ml-auto flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${preview ? "bg-blue-600 text-white" : "border border-[var(--border)] text-[var(--muted)] hover:text-blue-500"}`}>
          {preview ? <EyeOff size={13} /> : <Eye size={13} />}
          {preview ? "Edit" : "Preview"}
        </button>
      </div>

      {preview ? (
        <div className="rounded-xl border border-[var(--border)] overflow-hidden bg-[#f0f4fa]">
          <iframe srcDoc={previewHtml} className="w-full h-[600px] border-0" title="Email Preview" />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {value.blocks.length === 0 && (
            <div className="rounded-xl border-2 border-dashed border-[var(--border)] p-8 text-center text-sm text-[var(--muted)]">
              Add blocks above to build your email
            </div>
          )}
          {value.blocks.map((block, idx) => (
            <div key={block.id}
              onClick={() => setSelected(block.id === selected ? null : block.id)}
              className={`group rounded-xl border bg-[var(--surface)] transition cursor-pointer ${selected === block.id ? "border-blue-500 shadow-sm shadow-blue-500/10" : "border-[var(--border)] hover:border-[var(--muted)]"}`}>
              <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] px-3 py-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">{block.type}</span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button type="button" onClick={(e) => { e.stopPropagation(); moveBlock(block.id, -1); }} disabled={idx === 0}
                    className="rounded p-0.5 hover:bg-[var(--accent-soft)] disabled:opacity-30"><ArrowUp size={12} /></button>
                  <button type="button" onClick={(e) => { e.stopPropagation(); moveBlock(block.id, 1); }} disabled={idx === value.blocks.length - 1}
                    className="rounded p-0.5 hover:bg-[var(--accent-soft)] disabled:opacity-30"><ArrowDown size={12} /></button>
                  <button type="button" onClick={(e) => { e.stopPropagation(); removeBlock(block.id); }}
                    className="rounded p-0.5 text-red-400 hover:bg-red-50"><Trash2 size={12} /></button>
                </div>
              </div>

              <div className="p-3">
                <BlockPreview block={block} />
              </div>

              {selected === block.id && (
                <div className="border-t border-[var(--border)] p-3" onClick={(e) => e.stopPropagation()}>
                  <BlockEditor block={block} onChange={(patch) => patchBlock(block.id, patch)} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BlockPreview({ block }: { block: EmailBlock }) {
  switch (block.type) {
    case "heading":
      return <div className={`font-bold text-[var(--foreground)] text-${block.align} ${block.level === 1 ? "text-2xl" : block.level === 2 ? "text-xl" : "text-lg"}`}>{block.text}</div>;
    case "text":
      return <div className={`text-sm text-[var(--foreground)] text-${block.align} whitespace-pre-line`}>{block.content}</div>;
    case "button":
      return <div className={`text-${block.align}`}><span className="inline-block rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: block.bgColor }}>{block.label}</span></div>;
    case "image":
      return <div className={`text-${block.align}`}><img src={block.src} alt={block.alt} className="max-w-full h-auto rounded-lg max-h-32 object-cover" /></div>;
    case "divider":
      return <hr className="border-[var(--border)]" />;
    case "spacer":
      return <div className="flex items-center justify-center text-[10px] text-[var(--muted)]" style={{ height: Math.min(block.px, 48) }}>Spacer {block.px}px</div>;
  }
}

function BlockEditor({ block, onChange }: { block: EmailBlock; onChange: (p: Partial<EmailBlock>) => void }) {
  const AlignBtns = ({ value, onSet }: { value: string; onSet: (a: "left" | "center" | "right") => void }) => (
    <div className="flex gap-1">
      {(["left", "center", "right"] as const).map((a) => {
        const Icon = a === "left" ? AlignLeft : a === "center" ? AlignCenter : AlignRight;
        return (
          <button key={a} type="button" onClick={() => onSet(a)}
            className={`rounded p-1 text-xs ${value === a ? "bg-blue-600 text-white" : "border border-[var(--border)] text-[var(--muted)] hover:border-blue-400"}`}>
            <Icon size={12} />
          </button>
        );
      })}
    </div>
  );

  switch (block.type) {
    case "heading":
      return (
        <div className="flex flex-col gap-2">
          <input value={block.text} onChange={(e) => onChange({ text: e.target.value } as Partial<EmailBlock>)} className="input w-full text-sm" placeholder="Heading text" />
          <div className="flex items-center gap-3">
            <select value={block.level} onChange={(e) => onChange({ level: Number(e.target.value) as 1|2|3 } as Partial<EmailBlock>)} className="input text-xs">
              <option value={1}>H1 — Large</option><option value={2}>H2 — Medium</option><option value={3}>H3 — Small</option>
            </select>
            <AlignBtns value={block.align} onSet={(a) => onChange({ align: a } as Partial<EmailBlock>)} />
          </div>
        </div>
      );
    case "text":
      return (
        <div className="flex flex-col gap-2">
          <textarea value={block.content} onChange={(e) => onChange({ content: e.target.value } as Partial<EmailBlock>)} rows={4} className="input w-full resize-none text-sm" placeholder="Text content (use {{firstName}}, {{companyName}})" />
          <AlignBtns value={block.align} onSet={(a) => onChange({ align: a } as Partial<EmailBlock>)} />
        </div>
      );
    case "button":
      return (
        <div className="flex flex-col gap-2">
          <input value={block.label} onChange={(e) => onChange({ label: e.target.value } as Partial<EmailBlock>)} className="input w-full text-sm" placeholder="Button text" />
          <input value={block.url} onChange={(e) => onChange({ url: e.target.value } as Partial<EmailBlock>)} className="input w-full text-sm" placeholder="https://..." />
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <label className="text-xs text-[var(--muted)]">Color</label>
              <input type="color" value={block.bgColor} onChange={(e) => onChange({ bgColor: e.target.value } as Partial<EmailBlock>)} className="h-7 w-10 cursor-pointer rounded border border-[var(--border)]" />
            </div>
            <AlignBtns value={block.align} onSet={(a) => onChange({ align: a } as Partial<EmailBlock>)} />
          </div>
        </div>
      );
    case "image":
      return (
        <div className="flex flex-col gap-2">
          <input value={block.src} onChange={(e) => onChange({ src: e.target.value } as Partial<EmailBlock>)} className="input w-full text-sm" placeholder="Image URL" />
          <input value={block.alt} onChange={(e) => onChange({ alt: e.target.value } as Partial<EmailBlock>)} className="input w-full text-sm" placeholder="Alt text" />
          <AlignBtns value={block.align} onSet={(a) => onChange({ align: a } as Partial<EmailBlock>)} />
        </div>
      );
    case "spacer":
      return (
        <div className="flex items-center gap-2">
          <label className="text-xs text-[var(--muted)]">Height (px)</label>
          <input type="number" value={block.px} min={4} max={120} onChange={(e) => onChange({ px: Number(e.target.value) } as Partial<EmailBlock>)} className="input w-24 text-sm" />
        </div>
      );
    default:
      return null;
  }
}
