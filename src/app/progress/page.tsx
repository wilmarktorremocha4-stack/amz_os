import { PendingDbNotice } from "@/components/PendingDbNotice";

const metrics = [
  "Suppliers contacted",
  "Brands approved",
  "Products analyzed",
  "Products launched",
  "Revenue milestones",
  "Community engagement",
  "Tasks completed",
];

export default function ProgressPage() {
  return (
    <main className="flex flex-1 flex-col gap-8 p-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Progress Tracker
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Business-progress signals, not video-completion percentages.
        </p>
      </div>

      <ul className="flex flex-col gap-2 text-sm text-zinc-600 dark:text-zinc-400">
        {metrics.map((m) => (
          <li key={m} className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
            {m}
          </li>
        ))}
      </ul>

      <PendingDbNotice
        feature="the Progress Tracker"
        modelHint="The ActivityLog model is already defined in prisma/schema.prisma."
      />
    </main>
  );
}
