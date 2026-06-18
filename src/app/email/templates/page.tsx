import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";
import { EmailTemplatesTab } from "@/components/EmailTemplatesTab";

export const dynamic = "force-dynamic";

export default async function EmailTemplatesPage() {
  const user = await getCurrentUser();
  let templates: Array<{ id: string; name: string; subject: string; body: string }> = [];
  try {
    templates = await prisma.emailTemplate.findMany({
      where: { userId: user.id },
      orderBy: { name: "asc" },
    });
  } catch { /* table not yet migrated */ }

  return (
    <main className="flex flex-1 flex-col gap-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">Email Templates</h1>
        <p className="mt-0.5 text-sm text-[var(--muted)]">
          Reusable templates for your outreach campaigns and sequences.
        </p>
      </div>
      <EmailTemplatesTab templates={templates} />
    </main>
  );
}
