import Link from "next/link";
import {
  Percent,
  Scale,
  Scale3d,
  Boxes,
  Layers,
  PackagePlus,
  Receipt,
  Truck,
  RotateCcw,
} from "lucide-react";

const calculators = [
  { href: "/calculators/roi", name: "ROI Calculator", icon: Percent },
  { href: "/calculators/margin", name: "Margin Calculator", icon: Scale },
  {
    href: "/calculators/break-even",
    name: "Break-Even Calculator",
    icon: Scale3d,
  },
  {
    href: "/calculators/inventory-cost",
    name: "Inventory Cost Calculator",
    icon: Boxes,
  },
  {
    href: "/calculators/multi-pack",
    name: "Multi-Pack Calculator",
    icon: Layers,
  },
  {
    href: "/calculators/bundle",
    name: "Wholesale Bundle Calculator",
    icon: PackagePlus,
  },
  {
    href: "/calculators/sales-tax",
    name: "Sales Tax Calculator",
    icon: Receipt,
  },
  {
    href: "/calculators/prep-center",
    name: "Prep Center Calculator",
    icon: Truck,
  },
  {
    href: "/calculators/reorder",
    name: "Reorder Calculator",
    icon: RotateCcw,
  },
];

export default function CalculatorsPage() {
  return (
    <main className="flex flex-1 flex-col gap-8 p-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          Calculators
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Profitability tools for wholesale sourcing decisions.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {calculators.map((calc) => (
          <Link
            key={calc.href}
            href={calc.href}
            className="card card-glow group relative flex items-center gap-4 p-5 transition-all hover:border-[var(--accent)] hover:shadow-lg hover:shadow-blue-500/10"
          >
            <div className="relative z-10 rounded-lg bg-[var(--accent-soft)] p-2.5 text-[var(--accent)] transition-transform group-hover:scale-110">
              <calc.icon size={20} />
            </div>
            <div className="relative z-10 font-medium text-[var(--foreground)]">
              {calc.name}
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
