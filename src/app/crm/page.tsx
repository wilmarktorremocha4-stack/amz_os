import { Mail, Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";
import { createSupplier, emailFollowUpDigest } from "@/lib/actions/suppliers";
import { CrmAddPanel } from "@/components/CrmAddPanel";
import { OpportunitiesTab } from "@/components/OpportunitiesTab";
import { PipelinesTab } from "@/components/PipelinesTab";
import { TagsManager } from "@/components/TagsManager";
import { ContactsTable } from "@/components/ContactsTable";
import { EmailTemplatesTab } from "@/components/EmailTemplatesTab";

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

const TABS = ["contacts", "opportunities", "pipelines", "tags", "email-templates"] as const;
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

  const [suppliers, pipelines, opportunities, allTags, emailTemplates] = await Promise.all([
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
    prisma.emailTemplate.findMany({
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
              {t === "email-templates" ? "Email Templates" : t.charAt(0).toUpperCase() + t.slice(1)}
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
              <ContactsTable
                contacts={suppliers.map((s) => ({
                  id: s.id,
                  companyName: s.companyName,
                  contactName: s.contactName,
                  email: s.email,
                  phone: s.phone,
                  createdAt: s.createdAt.toISOString(),
                  tags: s.tags.map((ct) => ct.tag),
                }))}
                allTags={allTags}
              />
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

        {/* Email Templates Tab */}
        {tab === "email-templates" && (
          <EmailTemplatesTab templates={emailTemplates} />
        )}
      </main>
    </>
  );
}
