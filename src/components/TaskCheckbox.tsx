"use client";

import { useTransition } from "react";

export function TaskCheckbox({
  id,
  completed,
  title,
  onToggle,
}: {
  id: string;
  completed: boolean;
  title: string;
  onToggle: (id: string, completed: boolean) => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <label className="flex flex-1 items-center gap-2">
      <input
        type="checkbox"
        defaultChecked={completed}
        disabled={isPending}
        onChange={(e) => startTransition(() => onToggle(id, e.target.checked))}
      />
      <span
        className={
          completed
            ? "text-[var(--muted)] line-through"
            : "text-[var(--foreground)]"
        }
      >
        {title}
      </span>
    </label>
  );
}
