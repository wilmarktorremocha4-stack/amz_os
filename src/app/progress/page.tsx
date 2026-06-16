import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";
import { computeProgress } from "@/lib/progressScore";
import {
  createTask,
  toggleTask,
  deleteTask,
  logRevenue,
  logCommunityEngagement,
  updateSkoolProgress,
} from "@/lib/actions/progress";
import { TaskCheckbox } from "@/components/TaskCheckbox";

export const dynamic = "force-dynamic";

export default async function ProgressPage() {
  const user = await getCurrentUser();

  const [
    suppliersContacted,
    brandsApproved,
    productsAnalyzed,
    productsLaunched,
    revenueEntries,
    communityEngagements,
    tasks,
  ] = await Promise.all([
    prisma.supplier.count({
      where: { userId: user.id, stage: { not: "RESEARCHING" } },
    }),
    prisma.brand.count({ where: { userId: user.id, approved: true } }),
    prisma.product.count({ where: { userId: user.id } }),
    prisma.product.count({ where: { userId: user.id, launched: true } }),
    prisma.revenueEntry.findMany({ where: { userId: user.id } }),
    prisma.activityLog.count({
      where: { userId: user.id, type: "COMMUNITY_ENGAGEMENT" },
    }),
    prisma.task.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const totalRevenue = revenueEntries.reduce(
    (sum, r) => sum + Number(r.amount),
    0,
  );
  const tasksCompleted = tasks.filter((t) => t.completed).length;

  const { kpis, overall } = computeProgress({
    suppliersContacted,
    brandsApproved,
    productsAnalyzed,
    productsLaunched,
    totalRevenue,
    communityEngagements,
    tasksCompleted,
    tasksTotal: tasks.length,
    skoolCourseProgressPct: user.skoolCourseProgressPct,
  });

  return (
    <main className="flex flex-1 flex-col gap-8 p-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          Progress Tracker
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          A blended score across business activity, course progress, revenue,
          and community engagement — not just video-completion percentages.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8 ">
        <div className="text-sm font-medium uppercase tracking-wide text-[var(--muted)]">
          Overall Progress
        </div>
        <div className="text-6xl font-bold text-[var(--foreground)]">
          {overall}%
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 "
          >
            <div className="text-sm font-medium text-[var(--muted)]">
              {kpi.label}
            </div>
            <div className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
              {kpi.raw}
            </div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-[var(--accent-soft)] ">
              <div
                className="h-1.5 rounded-full bg-[var(--foreground)] "
                style={{ width: `${kpi.score}%` }}
              />
            </div>
            <div className="mt-1 text-xs text-[var(--muted)]">{kpi.hint}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 ">
          <h2 className="font-medium text-[var(--foreground)]">Action Plan</h2>
          <form action={createTask} className="flex gap-2">
            <input
              name="title"
              placeholder="New task"
              required
              className="input flex-1"
            />
            <button type="submit" className="btn-primary">
              Add
            </button>
          </form>
          <ul className="flex flex-col gap-2">
            {tasks.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <TaskCheckbox
                  id={t.id}
                  completed={t.completed}
                  title={t.title}
                  onToggle={toggleTask}
                />
                <form
                  action={async () => {
                    await deleteTask(t.id);
                  }}
                >
                  <button
                    type="submit"
                    className="text-xs text-red-500 hover:underline"
                  >
                    ×
                  </button>
                </form>
              </li>
            ))}
            {tasks.length === 0 && (
              <li className="text-sm text-[var(--muted)]">No tasks yet.</li>
            )}
          </ul>
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 ">
          <h2 className="font-medium text-[var(--foreground)]">Log Revenue</h2>
          <form action={logRevenue} className="flex flex-col gap-2">
            <input
              name="amount"
              type="number"
              step="0.01"
              placeholder="Amount ($)"
              required
              className="input"
            />
            <input
              name="note"
              placeholder="Note (optional)"
              className="input"
            />
            <button type="submit" className="btn-primary">
              Log
            </button>
          </form>
          <div className="text-xs text-[var(--muted)]">
            Total logged: $
            {revenueEntries
              .reduce((s, r) => s + Number(r.amount), 0)
              .toLocaleString()}
          </div>

          <h2 className="mt-4 font-medium text-[var(--foreground)]">
            Community Engagement
          </h2>
          <form action={logCommunityEngagement} className="flex flex-col gap-2">
            <input
              name="note"
              placeholder="What did you do? (optional)"
              className="input"
            />
            <button type="submit" className="btn-primary">
              Log engagement
            </button>
          </form>
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 ">
          <h2 className="font-medium text-[var(--foreground)]">
            Skool Course Progress
          </h2>
          <p className="text-xs text-[var(--muted)]">
            No Skool API/webhook access is connected yet, so this is
            self-reported for now. Once Skool integration access is available,
            this can sync automatically.
          </p>
          <form action={updateSkoolProgress} className="flex gap-2">
            <input
              name="pct"
              type="number"
              min={0}
              max={100}
              defaultValue={user.skoolCourseProgressPct}
              className="input flex-1"
            />
            <button type="submit" className="btn-primary">
              Update
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
