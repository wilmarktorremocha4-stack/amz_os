import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";
import { createProduct, archiveProduct } from "@/lib/actions/products";
import { LaunchedToggle } from "@/components/LaunchedToggle";

export const dynamic = "force-dynamic";

export default async function ResearchPage() {
  const user = await getCurrentUser();
  const products = await prisma.product.findMany({
    where: { userId: user.id, archived: false },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="flex flex-1 flex-col gap-8 p-10">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
            Product Research
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Log products you&apos;ve analyzed from suppliers. No live Amazon
            data is connected — figures are entered manually.
          </p>
        </div>
        <Link href="/research/brands" className="btn-primary whitespace-nowrap">
          Brand Research →
        </Link>
      </div>

      <form
        action={createProduct}
        className="grid grid-cols-1 gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:grid-cols-2 lg:grid-cols-5 "
      >
        <input
          name="title"
          placeholder="Product title *"
          required
          className="input lg:col-span-2"
        />
        <input name="asin" placeholder="ASIN" className="input" />
        <input
          name="cost"
          type="number"
          step="0.01"
          placeholder="Unit cost ($)"
          className="input"
        />
        <input
          name="estimatedSell"
          type="number"
          step="0.01"
          placeholder="Est. sell price ($)"
          className="input"
        />
        <input
          name="monthlyUnits"
          type="number"
          placeholder="Est. monthly units"
          className="input"
        />
        <button
          type="submit"
          className="btn-primary sm:col-span-2 lg:col-span-5"
        >
          Log product
        </button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--accent-soft)] text-left text-[var(--muted)] ">
            <tr>
              <th className="p-3">Product</th>
              <th className="p-3">Cost</th>
              <th className="p-3">Est. sell</th>
              <th className="p-3">Launched</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t border-[var(--border)]">
                <td className="p-3 font-medium text-[var(--foreground)]">
                  {p.title}
                  <div className="text-xs text-[var(--muted)]">
                    {p.asin ?? ""}
                  </div>
                </td>
                <td className="p-3 text-[var(--muted)]">
                  {p.cost ? `$${p.cost}` : "—"}
                </td>
                <td className="p-3 text-[var(--muted)]">
                  {p.estimatedSell ? `$${p.estimatedSell}` : "—"}
                </td>
                <td className="p-3">
                  <LaunchedToggle id={p.id} launched={p.launched} />
                </td>
                <td className="p-3 text-right">
                  <form
                    action={async () => {
                      await archiveProduct(p.id);
                    }}
                  >
                    <button
                      type="submit"
                      className="text-xs text-red-500 hover:underline"
                    >
                      Archive
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-[var(--muted)]">
                  No products logged yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
