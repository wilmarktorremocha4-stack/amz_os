import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";
import { createBrand, deleteBrand } from "@/lib/actions/brands";
import { computeBrandOpportunityScore } from "@/lib/brandScore";
import { ApprovedToggle } from "@/components/ApprovedToggle";

export const dynamic = "force-dynamic";

export default async function BrandResearchPage() {
  const user = await getCurrentUser();
  const brands = await prisma.brand.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="flex flex-1 flex-col gap-8 p-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Brand Research
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          An internal opportunity-scoring tool in place of SmartScout. There
          is no live Amazon data feed — enter what you find researching
          storefronts, Keepa, or supplier sheets, and this scores it for you.
        </p>
      </div>

      <form
        action={createBrand}
        className="grid grid-cols-1 gap-3 rounded-xl border border-zinc-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-6 dark:border-zinc-800 dark:bg-zinc-950"
      >
        <input name="name" placeholder="Brand name *" required className="input lg:col-span-2" />
        <input name="category" placeholder="Category" className="input" />
        <input name="estimatedMonthlySales" type="number" step="0.01" placeholder="Est. monthly sales ($)" className="input" />
        <input name="sellerCount" type="number" placeholder="# of sellers" className="input" />
        <input name="avgPrice" type="number" step="0.01" placeholder="Avg. price ($)" className="input" />
        <input name="reviewCount" type="number" placeholder="Avg. review count" className="input" />
        <button type="submit" className="btn-primary sm:col-span-2 lg:col-span-6">
          Add brand
        </button>
      </form>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {brands.map((b) => {
          const { score, complete } = computeBrandOpportunityScore({
            estimatedMonthlySales: b.estimatedMonthlySales ? Number(b.estimatedMonthlySales) : null,
            sellerCount: b.sellerCount,
            avgPrice: b.avgPrice ? Number(b.avgPrice) : null,
            reviewCount: b.reviewCount,
          });

          return (
            <div
              key={b.id}
              className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium text-zinc-900 dark:text-zinc-50">{b.name}</div>
                  <div className="text-xs text-zinc-400">{b.category ?? "Uncategorized"}</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
                    {score ?? "—"}
                  </div>
                  <div className="text-xs text-zinc-400">{complete ? "Opportunity score" : "Add data for score"}</div>
                </div>
              </div>

              <dl className="grid grid-cols-2 gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                <div>
                  <dt>Est. monthly sales</dt>
                  <dd className="font-medium text-zinc-700 dark:text-zinc-300">
                    {b.estimatedMonthlySales ? `$${b.estimatedMonthlySales}` : "—"}
                  </dd>
                </div>
                <div>
                  <dt>Sellers</dt>
                  <dd className="font-medium text-zinc-700 dark:text-zinc-300">{b.sellerCount ?? "—"}</dd>
                </div>
                <div>
                  <dt>Avg. price</dt>
                  <dd className="font-medium text-zinc-700 dark:text-zinc-300">
                    {b.avgPrice ? `$${b.avgPrice}` : "—"}
                  </dd>
                </div>
                <div>
                  <dt>Avg. reviews</dt>
                  <dd className="font-medium text-zinc-700 dark:text-zinc-300">{b.reviewCount ?? "—"}</dd>
                </div>
              </dl>

              <div className="flex items-center justify-between border-t border-zinc-100 pt-3 dark:border-zinc-800">
                <ApprovedToggle id={b.id} approved={b.approved} />
                <form action={async () => { await deleteBrand(b.id); }}>
                  <button type="submit" className="text-xs text-red-500 hover:underline">
                    Remove
                  </button>
                </form>
              </div>
            </div>
          );
        })}
        {brands.length === 0 && (
          <div className="col-span-full rounded-xl border border-dashed border-zinc-300 p-6 text-center text-zinc-400 dark:border-zinc-700">
            No brands researched yet.
          </div>
        )}
      </div>
    </main>
  );
}
