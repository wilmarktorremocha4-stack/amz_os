"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

export function ArchiveSection({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <section>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-left transition hover:bg-[var(--accent-soft)]"
      >
        {open ? (
          <ChevronDown size={16} className="shrink-0 text-[var(--muted)]" />
        ) : (
          <ChevronRight size={16} className="shrink-0 text-[var(--muted)]" />
        )}
        <div>
          <span className="font-medium text-[var(--foreground)]">{title}</span>
          {open && (
            <p className="text-xs text-[var(--muted)] mt-0.5">
              Click <span className="font-medium text-[var(--accent)]">Restore</span> to move back to active, or <span className="font-medium text-red-500">Delete permanently</span> to remove forever.
            </p>
          )}
        </div>
        <span className="ml-auto shrink-0 rounded-full bg-[var(--accent-soft)] px-2.5 py-0.5 text-xs font-medium text-[var(--muted)]">
          {count}
        </span>
      </button>

      {open && (
        <div className="mt-2">
          {count === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] p-4 text-center text-sm text-[var(--muted)]">
              Nothing archived here.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
              <ul className="divide-y divide-[var(--border)]">{children}</ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
