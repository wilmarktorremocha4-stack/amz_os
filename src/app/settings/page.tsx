import { getCurrentUser } from "@/lib/currentUser";
import { updateProfile } from "@/lib/actions/settings";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getCurrentUser();

  return (
    <main className="flex flex-1 flex-col gap-8 p-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          Settings
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Profile info and goals used across the dashboard and progress tracker.
        </p>
      </div>

      <form
        action={updateProfile}
        className="flex max-w-lg flex-col gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 "
      >
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-[var(--muted)]">
            Email
          </label>
          <input value={user.email} disabled className="input opacity-60" />
          <span className="text-xs text-[var(--muted)]">
            Login isn&apos;t built yet, so this is fixed to a single account.
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-[var(--muted)]">
            Name
          </label>
          <input name="name" defaultValue={user.name ?? ""} className="input" />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-[var(--muted)]">
            Skool ID
          </label>
          <input
            name="skoolId"
            defaultValue={user.skoolId ?? ""}
            className="input"
            placeholder="Optional"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-[var(--muted)]">
            Monthly revenue goal ($)
          </label>
          <input
            name="monthlyRevenueGoal"
            type="number"
            step="0.01"
            defaultValue={
              user.monthlyRevenueGoal ? Number(user.monthlyRevenueGoal) : ""
            }
            className="input"
            placeholder="e.g. 5000"
          />
          <span className="text-xs text-[var(--muted)]">
            Used by the MRR growth chart on the dashboard to compare actual
            revenue against your target.
          </span>
        </div>

        <button type="submit" className="btn-primary self-start">
          Save settings
        </button>
      </form>
    </main>
  );
}
