"use client";
import { useDraggable } from "@dnd-kit/core";
import { EmailElement } from "@/lib/email-builder";
import { Type, Image, MousePointer2, Minus, Share2, Code2, Video, MoveVertical, AlignLeft } from "lucide-react";

const ELEMENTS: { type: EmailElement["type"]; label: string; icon: React.ReactNode }[] = [
  { type: "text",    label: "Text",    icon: <Type size={16} /> },
  { type: "heading", label: "Heading", icon: <AlignLeft size={16} /> },
  { type: "image",   label: "Image",   icon: <Image size={16} /> },
  { type: "button",  label: "Button",  icon: <MousePointer2 size={16} /> },
  { type: "divider", label: "Divider", icon: <Minus size={16} /> },
  { type: "spacer",  label: "Spacer",  icon: <MoveVertical size={16} /> },
  { type: "social",  label: "Social",  icon: <Share2 size={16} /> },
  { type: "video",   label: "Video",   icon: <Video size={16} /> },
  { type: "html",    label: "HTML",    icon: <Code2 size={16} /> },
];

function DraggableElement({ type, label, icon }: { type: EmailElement["type"]; label: string; icon: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${type}`,
    data: { type: "new-element", elementType: type },
  });
  return (
    <div ref={setNodeRef} {...listeners} {...attributes}
      className={`flex flex-col items-center gap-1.5 rounded-lg border border-[#1E3A5F] p-3 cursor-grab text-slate-400 hover:border-[#0E90C8] hover:text-white transition select-none ${isDragging ? "opacity-40" : ""}`}>
      {icon}
      <span className="text-[10px]">{label}</span>
    </div>
  );
}

export function ElementPalette() {
  return (
    <div className="flex w-44 shrink-0 flex-col border-r border-[#1E3A5F] bg-[#0A1628] p-3">
      <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Elements</p>
      <div className="grid grid-cols-2 gap-2">
        {ELEMENTS.map(e => <DraggableElement key={e.type} {...e} />)}
      </div>
    </div>
  );
}
