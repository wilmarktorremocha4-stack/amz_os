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

function ArchivedRow({
  title,
  subtitle,
  restoreAction,
  deleteAction,
}: {
  title: string;
  subtitle?: string | null;
  restoreAction: () => Promise<void>;
  deleteAction: () => Promise<void>;
}) {
  return (
    <li className="flex items-center justify-between gap-3 p-3">
      <div className="min-w-0">
        <div className="truncate font-medium text-[var(--foreground)]">
          {title}
        </div>
        {subtitle && (
          <div className="text-xs text-[var(--muted)]">{subtitle}</div>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <form action={restoreAction}>
          <button
            type="submit"
            className="text-xs text-[var(--accent)] hover:underline"
          >
            Restore
          </button>
        </form>
        <form action={deleteAction}>
          <button
            type="submit"
            className="text-xs text-red-500 hover:underline"
          >
            Delete permanently
          </button>
        </form>
      </div>
    </li>
  );
}

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
          Everything you&apos;ve removed, categorized by type. Restore it or
          delete it for good.
        </p>
      </div>

      <Section title="Suppliers" empty={suppliers.length === 0}>
        {suppliers.map((s) => (
          <ArchivedRow
            key={s.id}
            title={s.companyName}
            subtitle={s.email ?? s.website ?? undefined}
            restoreAction={async () => {
              await restoreSupplier(s.id);
            }}
            deleteAction={async () => {
              await deleteSupplierPermanently(s.id);
            }}
          />
        ))}
      </Section>

      <Section title="Brands" empty={brands.length === 0}>
        {brands.map((b) => (
          <ArchivedRow
            key={b.id}
            title={b.name}
            subtitle={b.category ?? undefined}
            restoreAction={async () => {
              await restoreBrand(b.id);
            }}
            deleteAction={async () => {
              await deleteBrandPermanently(b.id);
            }}
          />
        ))}
      </Section>

      <Section title="Products" empty={products.length === 0}>
        {products.map((p) => (
          <ArchivedRow
            key={p.id}
            title={p.title}
            subtitle={p.asin ?? undefined}
            restoreAction={async () => {
              await restoreProduct(p.id);
            }}
            deleteAction={async () => {
              await deleteProductPermanently(p.id);
            }}
          />
        ))}
      </Section>

      <Section title="Calculator history" empty={calculatorRuns.length === 0}>
        {calculatorRuns.map((run) => (
          <ArchivedRow
            key={run.id}
            title={run.name}
            subtitle={run.type.replaceAll("_", " ")}
            restoreAction={async () => {
              await restoreCalculatorRun(run.id);
            }}
            deleteAction={async () => {
              await deleteCalculatorRunPermanently(run.id);
            }}
          />
        ))}
      </Section>
    </main>
  );
}
