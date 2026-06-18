import { Mail, Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";
import { createSupplier, emailFollowUpDigest } from "@/lib/actions/suppliers";
import { SupplierCard } from "@/components/SupplierCardClient";
import { CrmAddPanel } from "@/components/CrmAddPanel";
import { OpportunitiesTab } from "@/components/OpportunitiesTab";
import { PipelinesTab } from "@/components/PipelinesTab";
import { TagsManager } from "@/components/TagsManager";

export const dynamic = "force-dynamic";

const STAGE_ORDER = [
  "RESEARCHING",
  "CONTACTED",
  "FOLLOWED_UP",
  "NEGOTIATING",
  "APPROVED",
  "ONBOARDED",
  "REJECTED",
] as const;

const TABS = ["contacts", "opportunities", "pipelines", "tags"] as const;
type Tab = (typeof TABS)[number];

export default async function CrmPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    digestSent?: string;
    add?: string;
    tab?: string;
  }>;
}) {
  const user = await getCurrentUser();
  const { error, digestSent, add, tab: tabParam } = await searchParams;
  const tab: Tab = TABS.includes(tabParam as Tab) ? (tabParam as Tab) : "contacts";

  const [suppliers, pipelines, opportunities, allTags] = await Promise.all([
    prisma.supplier.findMany({
      where: { userId: user.id, archived: false },
      include: { tags: { include: { tag: true } } },
      orderBy: { createdAt: "desc" },
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
    prisma.tag.findMany({
      where: { userId: user.id },
      orderBy: { name: "asc" },
    }),
  ]);

  const byStage = STAGE_ORDER.map((stage) => ({
    stage,
    list: suppliers.filter((s) => s.stage === stage),
  })).filter(({ list }) => list.length > 0);

  return (
    <>
      {add === "1" && tab === "contacts" && (
        <CrmAddPanel createSupplier={createSupplier} />
      )}

      <main className="flex flex-1 flex-col gap-6 p-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
              Contacts
            </h1>
            <p className="mt-0.5 text-sm text-[var(--muted)]">
              {suppliers.length} contact{suppliers.length !== 1 ? "s" : ""} ·{" "}
              {pipelines.length} pipeline{pipelines.length !== 1 ? "s" : ""} ·{" "}
              {opportunities.length} opportunit{opportunities.length !== 1 ? "ies" : "y"}
            </p>
          </div>
          {tab === "contacts" && (
            <div className="flex items-center gap-2">
              <form action={emailFollowUpDigest}>
                <button type="submit" className="btn-secondary whitespace-nowrap">
                  <Mail size={14} />
                  Follow-up digest
                </button>
              </form>
              <a href="/crm?add=1" className="btn-primary whitespace-nowrap">
                <Plus size={14} />
                Add contact
              </a>
            </div>
          )}
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}
        {digestSent === "empty" && (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--accent-soft)] p-4 text-sm text-[var(--muted)]">
            No open suppliers to follow up on right now.
          </div>
        )}
        {digestSent && digestSent !== "empty" && digestSent !== "0" && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
            Follow-up digest emailed for {digestSent} supplier(s).
          </div>
        )}

        {/* Tabs */}
        <div className="flex w-fit gap-1 rounded-xl border border-[var(--border)] bg-[var(--accent-soft)] p-1">
          {TABS.map((t) => (
            <a
              key={t}
              href={`/crm?tab=${t}`}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
                tab === t
                  ? "bg-[var(--surface)] text-[var(--foreground)] shadow-sm"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {t}
            </a>
          ))}
        </div>

        {/* Contacts Tab */}
        {tab === "contacts" && (
          <>
            {suppliers.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-[var(--border)] p-16 text-center">
                <div className="text-4xl">📋</div>
                <div>
                  <p className="font-medium text-[var(--foreground)]">No contacts yet</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    Add your first contact to start tracking your outreach pipeline.
                  </p>
                </div>
                <a href="/crm?add=1" className="btn-primary">
                  <Plus size={14} />
                  Add first contact
                </a>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-[var(--border)]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-[var(--accent-soft)] text-left text-xs font-medium text-[var(--muted)]">
                      <th className="px-4 py-3">Contact name</th>
                      <th className="hidden px-4 py-3 sm:table-cell">Phone</th>
                      <th className="hidden px-4 py-3 md:table-cell">Email</th>
                      <th className="hidden px-4 py-3 lg:table-cell">Business name</th>
                      <th className="hidden px-4 py-3 xl:table-cell">Created</th>
                      <th className="px-4 py-3">Tags</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {suppliers.map((s) => {
                      const initials = s.companyName.split(/\s+/).slice(0, 2).map((w: string) => w[0]?.toUpperCase() ?? "").join("");
                      return (
                        <tr key={s.id} className="hover:bg-[var(--accent-soft)] transition-colors">
                          <td className="px-4 py-3">
                            <a href={`/crm/${s.id}`} className="flex items-center gap-2.5 hover:text-blue-500">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
                                {initials}
                              </div>
                              <div className="min-w-0">
                                <div className="font-medium text-[var(--foreground)] truncate">{s.contactName ?? s.companyName}</div>
                              </div>
                            </a>
                          </td>
                          <td className="hidden px-4 py-3 text-[var(--muted)] sm:table-cell">{s.phone ?? "—"}</td>
                          <td className="hidden px-4 py-3 text-[var(--muted)] md:table-cell truncate max-w-[180px]">{s.email ?? "—"}</td>
                          <td className="hidden px-4 py-3 text-[var(--muted)] lg:table-cell">{s.companyName}</td>
                          <td className="hidden px-4 py-3 text-[var(--muted)] xl:table-cell">
                            {new Date(s.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {s.tags.slice(0, 2).map((ct) => (
                                <span key={ct.tag.id}
                                  className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                                  style={{ backgroundColor: ct.tag.color + "20", color: ct.tag.color, border: `1px solid ${ct.tag.color}40` }}>
                                  {ct.tag.name}
                                </span>
                              ))}
                              {s.tags.length > 2 && (
                                <span className="rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-[10px] text-[var(--muted)]">
                                  +{s.tags.length - 2}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* Opportunities Tab */}
        {tab === "opportunities" && (
          <OpportunitiesTab
            pipelines={pipelines.map((p) => ({
              id: p.id,
              name: p.name,
              stages: p.stages,
            }))}
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
            suppliers={suppliers.map((s) => ({
              id: s.id,
              companyName: s.companyName,
            }))}
          />
        )}

        {/* Pipelines Tab */}
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

        {/* Tags Tab */}
        {tab === "tags" && (
          <TagsManager tags={allTags} />
        )}
      </main>
    </>
  );
}
