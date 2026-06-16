import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";
import { createSupplier, updateSupplierStage, deleteSupplier } from "@/lib/actions/suppliers";
import { StageSelect } from "@/components/StageSelect";

export const dynamic = "force-dynamic";

export default async function CrmPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();
  const suppliers = await prisma.supplier.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  const { error } = await searchParams;

  return (
    <main className="flex flex-1 flex-col gap-8 p-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Supplier CRM
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Track outreach, brand approvals, and onboarding pipeline.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          Couldn&apos;t add supplier: {error}
        </div>
      )}

      <form
        action={createSupplier}
        className="grid grid-cols-1 gap-3 rounded-xl border border-zinc-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-5 dark:border-zinc-800 dark:bg-zinc-950"
      >
        <input name="companyName" placeholder="Company name *" required className="input" />
        <input name="contactName" placeholder="Contact name" className="input" />
        <input name="email" type="email" placeholder="Email" className="input" />
        <input name="phone" placeholder="Phone" className="input" />
        <input name="website" placeholder="Website" className="input" />
        <button type="submit" className="btn-primary sm:col-span-2 lg:col-span-5">
          Add supplier
        </button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
            <tr>
              <th className="p-3">Company</th>
              <th className="p-3">Contact</th>
              <th className="p-3">Stage</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {suppliers.map((s) => (
              <tr key={s.id} className="border-t border-zinc-100 dark:border-zinc-800">
                <td className="p-3 font-medium text-zinc-900 dark:text-zinc-50">
                  {s.companyName}
                  <div className="text-xs text-zinc-400">{s.email ?? s.website ?? ""}</div>
                </td>
                <td className="p-3 text-zinc-600 dark:text-zinc-400">{s.contactName ?? "—"}</td>
                <td className="p-3">
                  <StageSelect id={s.id} stage={s.stage} onChange={updateSupplierStage} />
                </td>
                <td className="p-3 text-right">
                  <form action={async () => { await deleteSupplier(s.id); }}>
                    <button type="submit" className="text-xs text-red-500 hover:underline">
                      Remove
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {suppliers.length === 0 && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-zinc-400">
                  No suppliers yet. Add your first one above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
