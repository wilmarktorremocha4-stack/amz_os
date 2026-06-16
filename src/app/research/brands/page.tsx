import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";
import {
  createBrand,
  archiveBrand,
  lookupBrandOnAmazon,
  sendBrandOutreachEmail,
} from "@/lib/actions/brands";
import { computeBrandOpportunityScore } from "@/lib/brandScore";
import { ApprovedToggle } from "@/components/ApprovedToggle";

export const dynamic = "force-dynamic";

export default async function BrandResearchPage({
  searchParams,
}: {
  searchParams: Promise<{ lookupError?: string }>;
}) {
  const user = await getCurrentUser();
  const brands = await prisma.brand.findMany({
    where: { userId: user.id, archived: false },
    orderBy: { createdAt: "desc" },
  });
  const { lookupError } = await searchParams;

  return (
    <main className="flex flex-1 flex-col gap-8 p-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          Brand Research
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          An internal opportunity-scoring tool in place of SmartScout. Pull real
          price/review data straight from Amazon below, or enter what you find
          researching storefronts, Keepa, or supplier sheets — this scores it
          for you either way.
        </p>
      </div>

      {lookupError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {lookupError}
        </div>
      )}

      <form
        action={lookupBrandOnAmazon}
        className="flex gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 "
      >
        <input
          name="lookupQuery"
          placeholder='Search a brand or product on Amazon (e.g. "Stanley tumbler")'
          required
          className="input flex-1"
        />
        <button type="submit" className="btn-primary whitespace-nowrap">
          Pull real Amazon data
        </button>
      </form>

      <form
        action={createBrand}
        className="grid grid-cols-1 gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:grid-cols-2 lg:grid-cols-6 "
      >
        <input
          name="name"
          placeholder="Brand name *"
          required
          className="input lg:col-span-2"
        />
        <input name="category" placeholder="Category" className="input" />
        <input
          name="estimatedMonthlySales"
          type="number"
          step="0.01"
          placeholder="Est. monthly sales ($)"
          className="input"
        />
        <input
          name="sellerCount"
          type="number"
          placeholder="# of sellers"
          className="input"
        />
        <input
          name="avgPrice"
          type="number"
          step="0.01"
          placeholder="Avg. price ($)"
          className="input"
        />
        <input
          name="reviewCount"
          type="number"
          placeholder="Avg. review count"
          className="input"
        />
        <button
          type="submit"
          className="btn-primary sm:col-span-2 lg:col-span-6"
        >
          Add brand
        </button>
      </form>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {brands.map((b) => {
          const { score, complete } = computeBrandOpportunityScore({
            estimatedMonthlySales: b.estimatedMonthlySales
              ? Number(b.estimatedMonthlySales)
              : null,
            sellerCount: b.sellerCount,
            avgPrice: b.avgPrice ? Number(b.avgPrice) : null,
            reviewCount: b.reviewCount,
          });

          return (
            <div
              key={b.id}
              className="flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 "
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium text-[var(--foreground)]">
                    {b.name}
                  </div>
                  <div className="text-xs text-[var(--muted)]">
                    {b.category ?? "Uncategorized"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-semibold text-[var(--foreground)]">
                    {score ?? "—"}
                  </div>
                  <div className="text-xs text-[var(--muted)]">
                    {complete ? "Opportunity score" : "Add data for score"}
                  </div>
                </div>
              </div>

              <dl className="grid grid-cols-2 gap-2 text-xs text-[var(--muted)]">
                <div>
                  <dt>Est. monthly sales</dt>
                  <dd className="font-medium text-[var(--foreground)]">
                    {b.estimatedMonthlySales
                      ? `$${b.estimatedMonthlySales}`
                      : "—"}
                  </dd>
                </div>
                <div>
                  <dt>Sellers</dt>
                  <dd className="font-medium text-[var(--foreground)]">
                    {b.sellerCount ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt>Avg. price</dt>
                  <dd className="font-medium text-[var(--foreground)]">
                    {b.avgPrice ? `$${b.avgPrice}` : "—"}
                  </dd>
                </div>
                <div>
                  <dt>Avg. reviews</dt>
                  <dd className="font-medium text-[var(--foreground)]">
                    {b.reviewCount ?? "—"}
                  </dd>
                </div>
              </dl>

              <div className="flex items-center justify-between border-t border-[var(--border)] pt-3 ">
                <ApprovedToggle id={b.id} approved={b.approved} />
                <form
                  action={async () => {
                    await archiveBrand(b.id);
                  }}
                >
                  <button
                    type="submit"
                    className="text-xs text-red-500 hover:underline"
                  >
                    Archive
                  </button>
                </form>
              </div>

              <form
                action={sendBrandOutreachEmail}
                className="flex gap-2 border-t border-[var(--border)] pt-3"
              >
                <input type="hidden" name="brandId" value={b.id} />
                <input
                  name="contactEmail"
                  type="email"
                  placeholder="Contact email"
                  required
                  className="input flex-1 text-xs"
                />
                <button
                  type="submit"
                  className="btn-secondary whitespace-nowrap text-xs"
                >
                  Draft &amp; send outreach
                </button>
              </form>
            </div>
          );
        })}
        {brands.length === 0 && (
          <div className="col-span-full rounded-xl border border-dashed border-[var(--border)] p-6 text-center text-[var(--muted)] ">
            No brands researched yet.
          </div>
        )}
      </div>
    </main>
  );
}
