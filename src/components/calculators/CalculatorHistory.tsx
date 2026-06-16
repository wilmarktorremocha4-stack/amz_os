"use client";

import { useEffect, useState, useTransition } from "react";
import { Save, Trash2, Upload, History } from "lucide-react";
import {
  CalculatorType,
  CalculatorRunSummary,
  listCalculatorRuns,
  saveCalculatorRun,
  archiveCalculatorRun,
} from "@/lib/actions/calculators";

export function CalculatorHistory({
  type,
  inputs,
  result,
  onLoad,
}: {
  type: CalculatorType;
  inputs: Record<string, string>;
  result: Record<string, unknown>;
  onLoad: (inputs: Record<string, string>) => void;
}) {
  const [runs, setRuns] = useState<CalculatorRunSummary[]>([]);
  const [name, setName] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    listCalculatorRuns(type).then(setRuns);
  }, [type]);

  function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) return;
    startTransition(async () => {
      await saveCalculatorRun(type, trimmed, inputs, result);
      setName("");
      setRuns(await listCalculatorRuns(type));
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await archiveCalculatorRun(id);
      setRuns(await listCalculatorRuns(type));
    });
  }

  return (
    <div className="card p-6">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-[var(--foreground)]">
        <History size={16} className="text-[var(--accent)]" />
        Saved computations
      </div>

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name this computation…"
          className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending || !name.trim()}
          className="btn-secondary shrink-0 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Save size={14} />
          Save
        </button>
      </div>

      {runs.length === 0 ? (
        <p className="mt-3 text-xs text-[var(--muted)]">
          No saved computations yet.
        </p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {runs.map((run) => (
            <li
              key={run.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-[var(--border)] px-3 py-2"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-[var(--foreground)]">
                  {run.name}
                </div>
                <div className="text-xs text-[var(--muted)]">
                  {new Date(run.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => onLoad(run.inputs)}
                  disabled={isPending}
                  className="rounded-md p-1.5 text-[var(--muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]"
                  title="Load into form"
                >
                  <Upload size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(run.id)}
                  disabled={isPending}
                  className="rounded-md p-1.5 text-[var(--muted)] hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
