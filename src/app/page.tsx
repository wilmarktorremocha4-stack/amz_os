import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";
import { MrrChart, MrrChartPoint } from "@/components/MrrChart";

export const dynamic = "force-dynamic";

const MONTHS_TO_SHOW = 6;

export default async function Home() {
  const user = await getCurrentUser();

  const [suppliersContacted, brandsApproved, productsAnalyzed, productsLaunched, revenueEntries] = await Promise.all([
    prisma.supplier.count({ where: { userId: user.id, stage: { not: "RESEARCHING" } } }),
    prisma.brand.count({ where: { userId: user.id, approved: true } }),
    prisma.product.count({ where: { userId: user.id } }),
    prisma.product.count({ where: { userId: user.id, launched: true } }),
    prisma.revenueEntry.findMany({ where: { userId: user.id }, orderBy: { earnedAt: "asc" } }),
  ]);

  const goal = user.monthlyRevenueGoal ? Number(user.monthlyRevenueGoal) : null;
  const mrrData = buildMonthlyRevenue(revenueEntries, goal);

  const cards = [
    { label: "Suppliers Contacted", value: suppliersContacted, href: "/crm" },
    { label: "Brands Approved", value: brandsApproved, href: "/research/brands" },
    { label: "Products Analyzed", value: productsAnalyzed, href: "/research" },
    { label: "Products Launched", value: productsLaunched, href: "/research" },
  ];

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
          <Link
            key={card.label}
            href={card.href}
            className="rounded-xl border border-zinc-200 bg-white p-5 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-600"
          >
            <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              {card.label}
            </div>
            <div className="mt-2 text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
              {card.value}
            </div>
          </Link>
        ))}
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-medium text-zinc-900 dark:text-zinc-50">Revenue vs. Goal</h2>
          {goal === null && (
            <Link href="/settings" className="text-xs text-zinc-400 hover:underline">
              Set a monthly revenue goal →
            </Link>
          )}
        </div>
        <MrrChart data={mrrData} />
      </div>

      <Link
        href="/progress"
        className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:border-zinc-600"
      >
        View your full Progress Tracker (business activity, revenue, course
        progress, and community engagement) →
      </Link>
    </main>
  );
}

function buildMonthlyRevenue(
  entries: { amount: { toString(): string }; earnedAt: Date }[],
  goal: number | null
): MrrChartPoint[] {
  const now = new Date();
  const months: { key: string; label: string }[] = [];
  for (let i = MONTHS_TO_SHOW - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: d.toLocaleDateString("en-US", { month: "short" }),
    });
  }

  const totalsByMonth = new Map<string, number>();
  for (const entry of entries) {
    const d = new Date(entry.earnedAt);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    totalsByMonth.set(key, (totalsByMonth.get(key) ?? 0) + Number(entry.amount));
  }

  return months.map((m) => ({
    month: m.label,
    revenue: Math.round((totalsByMonth.get(m.key) ?? 0) * 100) / 100,
    goal,
  }));
}
