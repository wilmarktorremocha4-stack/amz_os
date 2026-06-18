import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";
import { MrrChart, MrrChartPoint } from "@/components/MrrChart";
import { Users, Sparkles, PackageSearch, Rocket, ArrowRight } from "lucide-react";
import { ContactSearch } from "@/components/ContactSearch";

export const dynamic = "force-dynamic";

const MONTHS_TO_SHOW = 6;

export default async function Home() {
  const user = await getCurrentUser();

  const [
    suppliersContacted,
    brandsApproved,
    productsAnalyzed,
    productsLaunched,
    revenueEntries,
    allContacts,
  ] = await Promise.all([
    prisma.supplier.count({
      where: { userId: user.id, stage: { not: "RESEARCHING" } },
    }),
    prisma.brand.count({ where: { userId: user.id, approved: true } }),
    prisma.product.count({ where: { userId: user.id } }),
    prisma.product.count({ where: { userId: user.id, launched: true } }),
    prisma.revenueEntry.findMany({
      where: { userId: user.id },
      orderBy: { earnedAt: "asc" },
    }),
    prisma.supplier.findMany({
      where: { userId: user.id, archived: false },
      select: { id: true, companyName: true, contactName: true, email: true },
      orderBy: { companyName: "asc" },
    }),
  ]);

  const goal = user.monthlyRevenueGoal ? Number(user.monthlyRevenueGoal) : null;
  const mrrData = buildMonthlyRevenue(revenueEntries, goal);

  const cards = [
    {
      label: "Suppliers Contacted",
      value: suppliersContacted,
      href: "/crm",
      icon: Users,
    },
    {
      label: "Brands Approved",
      value: brandsApproved,
      href: "/research/brands",
      icon: Sparkles,
    },
    {
      label: "Products Analyzed",
      value: productsAnalyzed,
      href: "/research",
      icon: PackageSearch,
    },
    {
      label: "Products Launched",
      value: productsLaunched,
      href: "/research",
      icon: Rocket,
    },
  ];

  return (
    <main className="flex flex-1 flex-col gap-8 p-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Business progress, not video consumption.
          </p>
        </div>
        <ContactSearch contacts={allContacts} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="card card-glow group relative p-5 transition-all hover:border-[var(--accent)] hover:shadow-lg hover:shadow-blue-500/10"
          >
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <div className="text-sm font-medium text-[var(--muted)]">
                  {card.label}
                </div>
                <div className="mt-2 text-3xl font-semibold text-[var(--foreground)]">
                  {card.value}
                </div>
              </div>
              <div className="rounded-lg bg-[var(--accent-soft)] p-2 text-[var(--accent)] transition-transform group-hover:scale-110">
                <card.icon size={20} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="card card-glow p-6">
        <div className="relative z-10 mb-4 flex items-center justify-between">
          <h2 className="font-medium text-[var(--foreground)]">
            Revenue vs. Goal
          </h2>
          {goal === null && (
            <Link
              href="/settings"
              className="text-xs text-[var(--muted)] hover:underline"
            >
              Set a monthly revenue goal →
            </Link>
          )}
        </div>
        <div className="relative z-10">
          <MrrChart data={mrrData} />
        </div>
      </div>

      <Link
        href="/progress"
        className="card group flex items-center justify-between p-6 text-sm text-[var(--muted)] transition-colors hover:border-[var(--accent)]"
      >
        <span>
          View your full Progress Tracker (business activity, revenue, course
          progress, and community engagement)
        </span>
        <ArrowRight
          size={16}
          className="shrink-0 text-[var(--accent)] transition-transform group-hover:translate-x-1"
        />
      </Link>
    </main>
  );
}

function buildMonthlyRevenue(
  entries: { amount: { toString(): string }; earnedAt: Date }[],
  goal: number | null,
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
    totalsByMonth.set(
      key,
      (totalsByMonth.get(key) ?? 0) + Number(entry.amount),
    );
  }

  return months.map((m) => ({
    month: m.label,
    revenue: Math.round((totalsByMonth.get(m.key) ?? 0) * 100) / 100,
    goal,
  }));
}
