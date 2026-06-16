import { PendingDbNotice } from "@/components/PendingDbNotice";

export default function CrmPage() {
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
      <PendingDbNotice
        feature="the Supplier CRM"
        modelHint="Supplier, Brand, and FollowUp models are already defined in prisma/schema.prisma."
      />
    </main>
  );
}
