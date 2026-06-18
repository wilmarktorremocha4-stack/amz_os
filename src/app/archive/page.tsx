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

export const dynamic = "force-dynamic";

function Section({
  title,
  children,
  empty,
}: {
  title: string;
  children: React.ReactNode;
  empty: boolean;
}) {
  return (
    <section>
      <h2 className="mb-2 text-sm font-medium text-[var(--muted)]">{title}</h2>
      {empty ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] p-4 text-center text-sm text-[var(--muted)]">
          Nothing archived here.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
          <ul className="divide-y divide-[var(--border)]">{children}</ul>
        </div>
      )}
    </section>
  );
}

export default async function ArchivePage() {
  const user = await getCurrentUser();

  const [suppliers, brands, products, calculatorRuns] = await Promise.all([
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

      <Section title="Contacts" empty={suppliers.length === 0}>
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
              <div className="flex shrink-0 items-center gap-3">
                <form action={restore}>
                  <button type="submit" className="text-xs text-[var(--accent)] hover:underline">Restore</button>
                </form>
                <form action={deletePerm}>
                  <button type="submit" className="text-xs text-red-500 hover:underline">Delete permanently</button>
                </form>
              </div>
            </li>
          );
        })}
      </Section>

      <Section title="Brands" empty={brands.length === 0}>
        {brands.map((b) => {
          async function restore() {
            "use server";
            await restoreBrand(b.id);
          }
          async function deletePerm() {
            "use server";
            await deleteBrandPermanently(b.id);
          }
          return (
            <li key={b.id} className="flex items-center justify-between gap-3 p-3">
              <div className="min-w-0">
                <div className="truncate font-medium text-[var(--foreground)]">{b.name}</div>
                {b.category && <div className="text-xs text-[var(--muted)]">{b.category}</div>}
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <form action={restore}>
                  <button type="submit" className="text-xs text-[var(--accent)] hover:underline">Restore</button>
                </form>
                <form action={deletePerm}>
                  <button type="submit" className="text-xs text-red-500 hover:underline">Delete permanently</button>
                </form>
              </div>
            </li>
          );
        })}
      </Section>

      <Section title="Products" empty={products.length === 0}>
        {products.map((p) => {
          async function restore() {
            "use server";
            await restoreProduct(p.id);
          }
          async function deletePerm() {
            "use server";
            await deleteProductPermanently(p.id);
          }
          return (
            <li key={p.id} className="flex items-center justify-between gap-3 p-3">
              <div className="min-w-0">
                <div className="truncate font-medium text-[var(--foreground)]">{p.title}</div>
                {p.asin && <div className="text-xs text-[var(--muted)]">{p.asin}</div>}
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <form action={restore}>
                  <button type="submit" className="text-xs text-[var(--accent)] hover:underline">Restore</button>
                </form>
                <form action={deletePerm}>
                  <button type="submit" className="text-xs text-red-500 hover:underline">Delete permanently</button>
                </form>
              </div>
            </li>
          );
        })}
      </Section>

      <Section title="Calculator history" empty={calculatorRuns.length === 0}>
        {calculatorRuns.map((run) => {
          async function restore() {
            "use server";
            await restoreCalculatorRun(run.id);
          }
          async function deletePerm() {
            "use server";
            await deleteCalculatorRunPermanently(run.id);
          }
          return (
            <li key={run.id} className="flex items-center justify-between gap-3 p-3">
              <div className="min-w-0">
                <div className="truncate font-medium text-[var(--foreground)]">{run.name}</div>
                <div className="text-xs text-[var(--muted)]">{run.type.replaceAll("_", " ")}</div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <form action={restore}>
                  <button type="submit" className="text-xs text-[var(--accent)] hover:underline">Restore</button>
                </form>
                <form action={deletePerm}>
                  <button type="submit" className="text-xs text-red-500 hover:underline">Delete permanently</button>
                </form>
              </div>
            </li>
          );
        })}
      </Section>
    </main>
  );
}
