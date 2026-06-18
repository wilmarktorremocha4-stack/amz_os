import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";
import { OpportunitiesTab } from "@/components/OpportunitiesTab";
import { PipelinesTab } from "@/components/PipelinesTab";

export const dynamic = "force-dynamic";

const TABS = ["kanban", "pipelines"] as const;
type Tab = (typeof TABS)[number];

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await getCurrentUser();
  const { tab: tabParam } = await searchParams;
  const tab: Tab = TABS.includes(tabParam as Tab) ? (tabParam as Tab) : "kanban";

  const [suppliers, pipelines, opportunities] = await Promise.all([
    prisma.supplier.findMany({
      where: { userId: user.id, archived: false },
      select: { id: true, companyName: true },
      orderBy: { companyName: "asc" },
    }),
    prisma.pipeline.findMany({
      where: { userId: user.id },
      include: {
        stages: { orderBy: { order: "asc" } },
        _count: { select: { opportunities: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.opportunity.findMany({
      where: { userId: user.id },
      include: { supplier: { select: { id: true, companyName: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <main className="flex flex-1 flex-col gap-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">Opportunities</h1>
        <p className="mt-0.5 text-sm text-[var(--muted)]">
          {opportunities.length} opportunit{opportunities.length !== 1 ? "ies" : "y"} across {pipelines.length} pipeline{pipelines.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex w-fit gap-1 rounded-xl border border-[var(--border)] bg-[var(--accent-soft)] p-1">
        {(["kanban", "pipelines"] as const).map((t) => (
          <a
            key={t}
            href={`/opportunities?tab=${t}`}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
              tab === t
                ? "bg-[var(--surface)] text-[var(--foreground)] shadow-sm"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            {t === "kanban" ? "Kanban Board" : "Pipelines"}
          </a>
        ))}
      </div>

      {tab === "kanban" && (
        <OpportunitiesTab
          pipelines={pipelines.map((p) => ({ id: p.id, name: p.name, stages: p.stages }))}
          opportunities={opportunities.map((o) => ({
            id: o.id,
            name: o.name,
            value: o.value ? o.value.toString() : null,
            status: o.status,
            notes: o.notes,
            stageId: o.stageId,
            supplierId: o.supplierId,
            supplier: o.supplier,
          }))}
          suppliers={suppliers}
        />
      )}

      {tab === "pipelines" && (
        <PipelinesTab
          pipelines={pipelines.map((p) => ({
            id: p.id,
            name: p.name,
            stages: p.stages,
            _count: p._count,
          }))}
        />
      )}
    </main>
  );
}
