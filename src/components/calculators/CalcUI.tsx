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
      <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <input
          type="number"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
        {suffix && <span className="text-xs text-zinc-400">{suffix}</span>}
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
    <div className="flex items-center justify-between border-b border-zinc-100 pb-3 last:border-0 last:pb-0 dark:border-zinc-800">
      <span className="text-sm text-zinc-500 dark:text-zinc-400">{label}</span>
      <span
        className={`text-lg font-semibold ${
          highlight
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-zinc-900 dark:text-zinc-50"
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
    <div className={`flex flex-col gap-2 rounded-xl border p-4 text-sm ${TIER_STYLES[tier]}`}>
      <div className="flex items-center gap-2 font-medium">
        <span className="text-xs uppercase tracking-wide opacity-70">{TIER_LABEL[tier]}</span>
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
}: {
  title: string;
  description: string;
  inputs: React.ReactNode;
  outputs: React.ReactNode;
}) {
  return (
    <main className="flex flex-1 flex-col gap-8 p-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {title}
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          {inputs}
        </div>
        <div className="flex flex-col gap-4">{outputs}</div>
      </div>
    </main>
  );
}
