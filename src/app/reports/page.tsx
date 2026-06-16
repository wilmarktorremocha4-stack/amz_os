import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";
import {
  DollarSign,
  Users,
  Sparkles,
  PackageSearch,
  TrendingUp,
} from "lucide-react";

export const dynamic = "force-dynamic";

const STAGE_LABELS: Record<string, string> = {
  RESEARCHING: "Researching",
  CONTACTED: "Contacted",
  FOLLOWED_UP: "Followed up",
  NEGOTIATING: "Negotiating",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  ONBOARDED: "Onboarded",
};

export default async function ReportsPage() {
  const user = await getCurrentUser();

  const [
    suppliers,
    brands,
    products,
    revenueEntries,
    calculatorRuns,
  ] = await Promise.all([
    prisma.supplier.findMany({ where: { userId: user.id } }),
    prisma.brand.findMany({ where: { userId: user.id } }),
    prisma.product.findMany({ where: { userId: user.id } }),
    prisma.revenueEntry.findMany({ where: { userId: user.id } }),
    prisma.calculatorRun.findMany({ where: { userId: user.id } }),
  ]);

  const totalRevenue = revenueEntries.reduce(
    (sum, r) => sum + Number(r.amount),
    0,
  );
  const approvedBrands = brands.filter((b) => b.approved).length;
  const launchedProducts = products.filter((p) => p.launched).length;
  const approvalRate = brands.length
    ? Math.round((approvedBrands / brands.length) * 100)
    : 0;
  const launchRate = products.length
    ? Math.round((launchedProducts / products.length) * 100)
    : 0;

  const stageBreakdown = Object.entries(
    suppliers.reduce<Record<string, number>>((acc, s) => {
      acc[s.stage] = (acc[s.stage] ?? 0) + 1;
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);

  const calculatorUsage = Object.entries(
    calculatorRuns.reduce<Record<string, number>>((acc, run) => {
      acc[run.type] = (acc[run.type] ?? 0) + 1;
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);

  const summaryCards = [
    {
      label: "Total Revenue",
      value: `$${totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      icon: DollarSign,
    },
    {
      label: "Supplier Pipeline",
      value: suppliers.length,
      icon: Users,
    },
    {
      label: "Brand Approval Rate",
      value: `${approvalRate}%`,
      icon: Sparkles,
    },
    {
      label: "Product Launch Rate",
      value: `${launchRate}%`,
      icon: PackageSearch,
    },
  ];

  return (
    <main className="flex flex-1 flex-col gap-8 p-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          Reports
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          A roll-up of pipeline health, revenue, and tool usage across your
          business.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <div key={card.label} className="card card-glow relative p-5">
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <div className="text-sm font-medium text-[var(--muted)]">
                  {card.label}
                </div>
                <div className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
                  {card.value}
                </div>
              </div>
              <div className="rounded-lg bg-[var(--accent-soft)] p-2 text-[var(--accent)]">
                <card.icon size={20} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="card p-6">
          <div className="mb-4 flex items-center gap-2 font-medium text-[var(--foreground)]">
            <Users size={16} className="text-[var(--accent)]" />
            Supplier pipeline by stage
          </div>
          {stageBreakdown.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">
              No suppliers added yet.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {stageBreakdown.map(([stage, count]) => {
                const pct = Math.round((count / suppliers.length) * 100);
                return (
                  <li key={stage}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-[var(--foreground)]">
                        {STAGE_LABELS[stage] ?? stage}
                      </span>
                      <span className="text-[var(--muted)]">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--accent-soft)]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-400"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="card p-6">
          <div className="mb-4 flex items-center gap-2 font-medium text-[var(--foreground)]">
            <TrendingUp size={16} className="text-[var(--accent)]" />
            Calculator usage
          </div>
          {calculatorUsage.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">
              No saved calculator runs yet.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {calculatorUsage.map(([type, count]) => {
                const pct = Math.round((count / calculatorRuns.length) * 100);
                return (
                  <li key={type}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-[var(--foreground)]">
                        {type.replaceAll("_", " ")}
                      </span>
                      <span className="text-[var(--muted)]">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--accent-soft)]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-400"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
