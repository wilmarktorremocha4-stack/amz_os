import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";
import {
  createSupplier,
  updateSupplierStage,
  deleteSupplier,
} from "@/lib/actions/suppliers";
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
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          Supplier CRM
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
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
        className="grid grid-cols-1 gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:grid-cols-2 lg:grid-cols-5 "
      >
        <input
          name="companyName"
          placeholder="Company name *"
          required
          className="input"
        />
        <input
          name="contactName"
          placeholder="Contact name"
          className="input"
        />
        <input
          name="email"
          type="email"
          placeholder="Email"
          className="input"
        />
        <input name="phone" placeholder="Phone" className="input" />
        <input name="website" placeholder="Website" className="input" />
        <button
          type="submit"
          className="btn-primary sm:col-span-2 lg:col-span-5"
        >
          Add supplier
        </button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--accent-soft)] text-left text-[var(--muted)] ">
            <tr>
              <th className="p-3">Company</th>
              <th className="p-3">Contact</th>
              <th className="p-3">Stage</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {suppliers.map((s) => (
              <tr key={s.id} className="border-t border-[var(--border)]">
                <td className="p-3 font-medium text-[var(--foreground)]">
                  {s.companyName}
                  <div className="text-xs text-[var(--muted)]">
                    {s.email ?? s.website ?? ""}
                  </div>
                </td>
                <td className="p-3 text-[var(--muted)]">
                  {s.contactName ?? "—"}
                </td>
                <td className="p-3">
                  <StageSelect
                    id={s.id}
                    stage={s.stage}
                    onChange={updateSupplierStage}
                  />
                </td>
                <td className="p-3 text-right">
                  <form
                    action={async () => {
                      await deleteSupplier(s.id);
                    }}
                  >
                    <button
                      type="submit"
                      className="text-xs text-red-500 hover:underline"
                    >
                      Remove
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {suppliers.length === 0 && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-[var(--muted)]">
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
