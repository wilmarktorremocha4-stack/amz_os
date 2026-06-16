"use client";

export function Field({
  label,
  value,
  onChange,
  suffix,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  suffix?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium text-[var(--muted)]">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="number"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
        />
        {suffix && (
          <span className="text-xs text-[var(--muted)]">{suffix}</span>
        )}
      </div>
    </label>
  );
}

export function ResultRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--border)] pb-3 last:border-0 last:pb-0 ">
      <span className="text-sm text-[var(--muted)]">{label}</span>
      <span
        className={`text-lg font-semibold ${
          highlight
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-[var(--foreground)]"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export type StatusTier = "good" | "warn" | "bad";

const TIER_STYLES: Record<StatusTier, string> = {
  good: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
  warn: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
  bad: "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300",
};

const TIER_LABEL: Record<StatusTier, string> = {
  good: "Looks good",
  warn: "Worth a second look",
  bad: "Needs work",
};

export function StatusBanner({
  tier,
  headline,
  tips,
}: {
  tier: StatusTier;
  headline: string;
  tips?: string[];
}) {
  return (
    <div
      className={`flex flex-col gap-2 rounded-xl border p-4 text-sm ${TIER_STYLES[tier]}`}
    >
      <div className="flex items-center gap-2 font-medium">
        <span className="text-xs uppercase tracking-wide opacity-70">
          {TIER_LABEL[tier]}
        </span>
      </div>
      <div className="font-medium">{headline}</div>
      {tips && tips.length > 0 && (
        <ul className="list-inside list-disc space-y-1 opacity-90">
          {tips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function CalculatorLayout({
  title,
  description,
  inputs,
  outputs,
  history,
}: {
  title: string;
  description: string;
  inputs: React.ReactNode;
  outputs: React.ReactNode;
  history?: React.ReactNode;
}) {
  return (
    <main className="flex flex-1 flex-col gap-8 p-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          {title}
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">{description}</p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="card flex flex-col gap-4 p-6">{inputs}</div>
        <div className="flex flex-col gap-4">{outputs}</div>
      </div>

      {history && <div className="lg:max-w-xl">{history}</div>}
    </main>
  );
}
