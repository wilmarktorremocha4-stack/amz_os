const cards = [
  { label: "Suppliers Contacted", value: "—", hint: "Connect DB to track" },
  { label: "Brands Approved", value: "—", hint: "Connect DB to track" },
  { label: "Products Analyzed", value: "—", hint: "Connect DB to track" },
  { label: "Products Launched", value: "—", hint: "Connect DB to track" },
];

export default function Home() {
  return (
    <main className="flex flex-1 flex-col gap-8 p-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Business progress, not video consumption.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"
          >
            <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              {card.label}
            </div>
            <div className="mt-2 text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
              {card.value}
            </div>
            <div className="mt-1 text-xs text-zinc-400">{card.hint}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-dashed border-zinc-300 p-6 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
        Set <code className="font-mono">DATABASE_URL</code> and run{" "}
        <code className="font-mono">npx prisma migrate dev</code> to wire up
        live data for this dashboard, the CRM, and the progress tracker.
      </div>
    </main>
  );
}
