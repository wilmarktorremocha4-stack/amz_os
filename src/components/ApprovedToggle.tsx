"use client";

import { useTransition } from "react";
import { setBrandApproved } from "@/lib/actions/brands";

export function ApprovedToggle({
  id,
  approved,
}: {
  id: string;
  approved: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => setBrandApproved(id, !approved))}
      className={`rounded-full px-3 py-1 text-xs font-medium ${
        approved
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
          : "bg-[var(--accent-soft)] text-[var(--muted)]    "
      }`}
    >
      {approved ? "Approved" : "Mark approved"}
    </button>
  );
}
