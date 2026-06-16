import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getCurrentUser();

  const [suppliersContacted, brandsApproved, productsAnalyzed, productsLaunched] = await Promise.all([
    prisma.supplier.count({ where: { userId: user.id, stage: { not: "RESEARCHING" } } }),
    prisma.brand.count({ where: { userId: user.id, approved: true } }),
    prisma.product.count({ where: { userId: user.id } }),
    prisma.product.count({ where: { userId: user.id, launched: true } }),
  ]);

  const cards = [
    { label: "Suppliers Contacted", value: suppliersContacted, href: "/crm" },
    { label: "Brands Approved", value: brandsApproved, href: "/research/brands" },
    { label: "Products Analyzed", value: productsAnalyzed, href: "/research" },
    { label: "Products Launched", value: productsLaunched, href: "/research" },
  ];

  return (
    <main className="flex flex-1 flex-col gap-8 p-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Business progress, not video consumption.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="rounded-xl border border-zinc-200 bg-white p-5 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-600"
          >
            <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              {card.label}
            </div>
            <div className="mt-2 text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
              {card.value}
            </div>
          </Link>
        ))}
      </div>

      <Link
        href="/progress"
        className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:border-zinc-600"
      >
        View your full Progress Tracker (business activity, revenue, course
        progress, and community engagement) →
      </Link>
    </main>
  );
}
