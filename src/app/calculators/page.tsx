import Link from "next/link";

const calculators = [
  { href: "/calculators/roi", name: "ROI Calculator", status: "live" },
  { href: "/calculators/margin", name: "Margin Calculator", status: "soon" },
  { href: "/calculators/break-even", name: "Break-Even Calculator", status: "soon" },
  { href: "/calculators/inventory-cost", name: "Inventory Cost Calculator", status: "soon" },
  { href: "/calculators/multi-pack", name: "Multi-Pack Calculator", status: "soon" },
  { href: "/calculators/bundle", name: "Wholesale Bundle Calculator", status: "soon" },
  { href: "/calculators/sales-tax", name: "Sales Tax Calculator", status: "soon" },
  { href: "/calculators/prep-center", name: "Prep Center Calculator", status: "soon" },
  { href: "/calculators/reorder", name: "Reorder Calculator", status: "soon" },
];

export default function CalculatorsPage() {
  return (
    <main className="flex flex-1 flex-col gap-8 p-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Calculators
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Profitability tools for wholesale sourcing decisions.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {calculators.map((calc) => (
          <Link
            key={calc.href}
            href={calc.status === "live" ? calc.href : "#"}
            aria-disabled={calc.status !== "live"}
            className={`rounded-xl border border-zinc-200 bg-white p-5 transition-colors dark:border-zinc-800 dark:bg-zinc-950 ${
              calc.status === "live"
                ? "hover:border-zinc-400 dark:hover:border-zinc-600"
                : "cursor-not-allowed opacity-50"
            }`}
          >
            <div className="font-medium text-zinc-900 dark:text-zinc-50">
              {calc.name}
            </div>
            <div className="mt-1 text-xs uppercase tracking-wide text-zinc-400">
              {calc.status === "live" ? "Available" : "Coming soon"}
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
