"use client";

import { useTransition } from "react";

const STAGES = [
  "RESEARCHING",
  "CONTACTED",
  "FOLLOWED_UP",
  "NEGOTIATING",
  "APPROVED",
  "REJECTED",
  "ONBOARDED",
] as const;

export function StageSelect({
  id,
  stage,
  onChange,
}: {
  id: string;
  stage: string;
  onChange: (id: string, stage: string) => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <select
      defaultValue={stage}
      disabled={isPending}
      onChange={(e) => startTransition(() => onChange(id, e.target.value))}
      className="input"
    >
      {STAGES.map((s) => (
        <option key={s} value={s}>
          {s.replace("_", " ")}
        </option>
      ))}
    </select>
  );
}
