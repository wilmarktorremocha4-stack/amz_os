import { Mail, Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";
import { createSupplier, emailFollowUpDigest } from "@/lib/actions/suppliers";
import { SupplierCard } from "@/components/SupplierCardClient";
import { CrmAddPanel } from "@/components/CrmAddPanel";

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

export default async function CrmPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; digestSent?: string; add?: string }>;
}) {
  const user = await getCurrentUser();
  const suppliers = await prisma.supplier.findMany({
    where: { userId: user.id, archived: false },
    orderBy: { createdAt: "desc" },
  });
  const { error, digestSent, add } = await searchParams;

  const byStage = STAGE_ORDER.map((stage) => ({
    stage,
    list: suppliers.filter((s) => s.stage === stage),
  })).filter(({ list }) => list.length > 0);

  return (
    <>
      {add === "1" && <CrmAddPanel createSupplier={createSupplier} />}

      <main className="flex flex-1 flex-col gap-6 p-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
              Supplier CRM
            </h1>
            <p className="mt-0.5 text-sm text-[var(--muted)]">
              {suppliers.length} contact{suppliers.length !== 1 ? "s" : ""} ·
              Track outreach, approvals, and onboarding pipeline
            </p>
          </div>
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

        {suppliers.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-[var(--border)] p-16 text-center">
            <div className="text-4xl">📋</div>
            <div>
              <p className="font-medium text-[var(--foreground)]">
                No suppliers yet
              </p>
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
          <div className="flex flex-col gap-8">
            {byStage.map(({ stage, list }) => (
              <section key={stage}>
                <div className="mb-3 flex items-center gap-2">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                    {stage.replace(/_/g, " ")}
                  </h2>
                  <span className="rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-[11px] font-medium text-[var(--muted)]">
                    {list.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {list.map((s) => (
                    <SupplierCard key={s.id} supplier={s} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
