export function PendingDbNotice({
  feature,
  modelHint,
}: {
  feature: string;
  modelHint: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-zinc-300 p-6 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
      {feature} needs a database connection. Set{" "}
      <code className="font-mono">DATABASE_URL</code> and run{" "}
      <code className="font-mono">npx prisma migrate dev</code> to enable it.{" "}
      {modelHint}
    </div>
  );
}
