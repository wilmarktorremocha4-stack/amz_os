export function PendingDbNotice({
  feature,
  modelHint,
}: {
  feature: string;
  modelHint: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--border)] p-6 text-sm text-[var(--muted)] ">
      {feature} needs a database connection. Set{" "}
      <code className="font-mono">DATABASE_URL</code> and run{" "}
      <code className="font-mono">npx prisma migrate dev</code> to enable it.{" "}
      {modelHint}
    </div>
  );
}
