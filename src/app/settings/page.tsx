import { getCurrentUser } from "@/lib/currentUser";
import { updateProfile } from "@/lib/actions/settings";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getCurrentUser();

  return (
    <main className="flex flex-1 flex-col gap-8 p-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Settings
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Profile info and goals used across the dashboard and progress tracker.
        </p>
      </div>

      <form
        action={updateProfile}
        className="flex max-w-lg flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950"
      >
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Email</label>
          <input value={user.email} disabled className="input opacity-60" />
          <span className="text-xs text-zinc-400">
            Login isn&apos;t built yet, so this is fixed to a single account.
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Name</label>
          <input name="name" defaultValue={user.name ?? ""} className="input" />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Skool ID</label>
          <input name="skoolId" defaultValue={user.skoolId ?? ""} className="input" placeholder="Optional" />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            Monthly revenue goal ($)
          </label>
          <input
            name="monthlyRevenueGoal"
            type="number"
            step="0.01"
            defaultValue={user.monthlyRevenueGoal ? Number(user.monthlyRevenueGoal) : ""}
            className="input"
            placeholder="e.g. 5000"
          />
          <span className="text-xs text-zinc-400">
            Used by the MRR growth chart on the dashboard to compare actual revenue against your target.
          </span>
        </div>

        <button type="submit" className="btn-primary self-start">
          Save settings
        </button>
      </form>
    </main>
  );
}
