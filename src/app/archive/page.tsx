import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";
import { restoreSupplier, deleteSupplierPermanently } from "@/lib/actions/suppliers";
import { restoreBrand, deleteBrandPermanently } from "@/lib/actions/brands";
import { restoreProduct, deleteProductPermanently } from "@/lib/actions/products";
import {
  restoreCalculatorRun,
  deleteCalculatorRunPermanently,
  listArchivedCalculatorRuns,
} from "@/lib/actions/calculators";
import { restoreWorkflow, deleteWorkflowPermanently } from "@/lib/actions/workflows";
import { ArchiveSection } from "@/components/ArchiveSection";

export const dynamic = "force-dynamic";

export default async function ArchivePage() {
  const user = await getCurrentUser();

  const [suppliers, brands, products, calculatorRuns, workflows] = await Promise.all([
    prisma.supplier.findMany({
      where: { userId: user.id, archived: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.brand.findMany({
      where: { userId: user.id, archived: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.product.findMany({
      where: { userId: user.id, archived: true },
      orderBy: { updatedAt: "desc" },
    }),
    listArchivedCalculatorRuns(),
    prisma.workflow.findMany({
      where: { userId: user.id, archived: true },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return (
    <main className="flex flex-1 flex-col gap-8 p-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          Archive
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Everything you&apos;ve removed. Restore it or delete permanently.
        </p>
      </div>

      <ArchiveSection title="Contacts" count={suppliers.length}>
        {suppliers.map((s) => {
          async function restore() {
            "use server";
            await restoreSupplier(s.id);
          }
          async function deletePerm() {
            "use server";
            await deleteSupplierPermanently(s.id);
          }
          return (
            <li key={s.id} className="flex items-center justify-between gap-3 p-3">
              <div className="min-w-0">
                <div className="truncate font-medium text-[var(--foreground)]">{s.companyName}</div>
                {(s.email ?? s.website) && (
                  <div className="text-xs text-[var(--muted)]">{s.email ?? s.website}</div>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <form action={restore}>
                  <button type="submit" className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--accent)] hover:bg-[var(--accent-soft)] transition">
                    ↩ Restore
                  </button>
                </form>
                <form action={deletePerm}>
                  <button type="submit" className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-100 transition">
                    Delete permanently
                  </button>
                </form>
              </div>
            </li>
          );
        })}
      </ArchiveSection>

      <ArchiveSection title="Brands" count={brands.length}>
        {brands.map((b) => {
          async function restore() { "use server"; await restoreBrand(b.id); }
          async function deletePerm() { "use server"; await deleteBrandPermanently(b.id); }
          return (
            <li key={b.id} className="flex items-center justify-between gap-3 p-3">
              <div className="min-w-0">
                <div className="truncate font-medium text-[var(--foreground)]">{b.name}</div>
                {b.category && <div className="text-xs text-[var(--muted)]">{b.category}</div>}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <form action={restore}>
                  <button type="submit" className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--accent)] hover:bg-[var(--accent-soft)] transition">
                    ↩ Restore
                  </button>
                </form>
                <form action={deletePerm}>
                  <button type="submit" className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-100 transition">
                    Delete permanently
                  </button>
                </form>
              </div>
            </li>
          );
        })}
      </ArchiveSection>

      <ArchiveSection title="Products" count={products.length}>
        {products.map((p) => {
          async function restore() { "use server"; await restoreProduct(p.id); }
          async function deletePerm() { "use server"; await deleteProductPermanently(p.id); }
          return (
            <li key={p.id} className="flex items-center justify-between gap-3 p-3">
              <div className="min-w-0">
                <div className="truncate font-medium text-[var(--foreground)]">{p.title}</div>
                {p.asin && <div className="text-xs text-[var(--muted)]">{p.asin}</div>}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <form action={restore}>
                  <button type="submit" className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--accent)] hover:bg-[var(--accent-soft)] transition">
                    ↩ Restore
                  </button>
                </form>
                <form action={deletePerm}>
                  <button type="submit" className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-100 transition">
                    Delete permanently
                  </button>
                </form>
              </div>
            </li>
          );
        })}
      </ArchiveSection>

      <ArchiveSection title="Workflows" count={workflows.length}>
        {workflows.map((wf) => {
          async function restore() { "use server"; await restoreWorkflow(wf.id); }
          async function deletePerm() { "use server"; await deleteWorkflowPermanently(wf.id); }
          return (
            <li key={wf.id} className="flex items-center justify-between gap-3 p-3">
              <div className="min-w-0">
                <div className="truncate font-medium text-[var(--foreground)]">{wf.name}</div>
                <div className="text-xs text-[var(--muted)]">{wf.status}</div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <form action={restore}>
                  <button type="submit" className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--accent)] hover:bg-[var(--accent-soft)] transition">
                    ↩ Restore
                  </button>
                </form>
                <form action={deletePerm}>
                  <button type="submit" className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-100 transition">
                    Delete permanently
                  </button>
                </form>
              </div>
            </li>
          );
        })}
      </ArchiveSection>

      <ArchiveSection title="Calculator history" count={calculatorRuns.length}>
        {calculatorRuns.map((run) => {
          async function restore() { "use server"; await restoreCalculatorRun(run.id); }
          async function deletePerm() { "use server"; await deleteCalculatorRunPermanently(run.id); }
          return (
            <li key={run.id} className="flex items-center justify-between gap-3 p-3">
              <div className="min-w-0">
                <div className="truncate font-medium text-[var(--foreground)]">{run.name}</div>
                <div className="text-xs text-[var(--muted)]">{run.type.replaceAll("_", " ")}</div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <form action={restore}>
                  <button type="submit" className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--accent)] hover:bg-[var(--accent-soft)] transition">
                    ↩ Restore
                  </button>
                </form>
                <form action={deletePerm}>
                  <button type="submit" className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-100 transition">
                    Delete permanently
                  </button>
                </form>
              </div>
            </li>
          );
        })}
      </ArchiveSection>
    </main>
  );
}
