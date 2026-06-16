"use client";

import { useTransition } from "react";
import { setProductLaunched } from "@/lib/actions/products";

export function LaunchedToggle({
  id,
  launched,
}: {
  id: string;
  launched: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => setProductLaunched(id, !launched))}
      className={`rounded-full px-3 py-1 text-xs font-medium ${
        launched
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
          : "bg-[var(--accent-soft)] text-[var(--muted)]    "
      }`}
    >
      {launched ? "Launched" : "Mark launched"}
    </button>
  );
}
