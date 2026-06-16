import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await getCurrentUser();
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  const [suppliers, brands, products] = query
    ? await Promise.all([
        prisma.supplier.findMany({
          where: {
            userId: user.id,
            archived: false,
            companyName: { contains: query, mode: "insensitive" },
          },
          take: 20,
        }),
        prisma.brand.findMany({
          where: {
            userId: user.id,
            archived: false,
            name: { contains: query, mode: "insensitive" },
          },
          take: 20,
        }),
        prisma.product.findMany({
          where: {
            userId: user.id,
            archived: false,
            title: { contains: query, mode: "insensitive" },
          },
          take: 20,
        }),
      ])
    : [[], [], []];

  const noResults =
    query && suppliers.length === 0 && brands.length === 0 && products.length === 0;

  return (
    <main className="flex flex-1 flex-col gap-8 p-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          Search results
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          {query ? `Showing results for "${query}"` : "Enter a search term above."}
        </p>
      </div>

      {noResults && (
        <div className="rounded-xl border border-dashed border-[var(--border)] p-6 text-center text-[var(--muted)]">
          No matches found.
        </div>
      )}

      {suppliers.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-medium text-[var(--muted)]">
            Suppliers
          </h2>
          <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
            <ul className="divide-y divide-[var(--border)]">
              {suppliers.map((s) => (
                <li key={s.id} className="p-3">
                  <Link href="/crm" className="font-medium text-[var(--foreground)] hover:text-[var(--accent)]">
                    {s.companyName}
                  </Link>
                  <div className="text-xs text-[var(--muted)]">
                    {s.email ?? s.website ?? ""}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {brands.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-medium text-[var(--muted)]">
            Brands
          </h2>
          <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
            <ul className="divide-y divide-[var(--border)]">
              {brands.map((b) => (
                <li key={b.id} className="p-3">
                  <Link href="/research/brands" className="font-medium text-[var(--foreground)] hover:text-[var(--accent)]">
                    {b.name}
                  </Link>
                  <div className="text-xs text-[var(--muted)]">
                    {b.category ?? "Uncategorized"}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {products.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-medium text-[var(--muted)]">
            Products
          </h2>
          <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
            <ul className="divide-y divide-[var(--border)]">
              {products.map((p) => (
                <li key={p.id} className="p-3">
                  <Link href="/research" className="font-medium text-[var(--foreground)] hover:text-[var(--accent)]">
                    {p.title}
                  </Link>
                  <div className="text-xs text-[var(--muted)]">
                    {p.asin ?? ""}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </main>
  );
}
