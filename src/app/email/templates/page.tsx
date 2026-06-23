import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";
import { EmailTemplatesTab } from "@/components/EmailTemplatesTab";

export const dynamic = "force-dynamic";

export default async function EmailTemplatesPage() {
  const user = await getCurrentUser();
  let templates: Array<{ id: string; name: string; subject: string; category: string | null; updatedAt: Date }> = [];
  try {
    templates = await prisma.emailTemplate.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      select: { id: true, name: true, subject: true, category: true, updatedAt: true },
    });
  } catch { /* table not yet migrated */ }

  return (
    <main className="flex flex-1 flex-col p-8 overflow-y-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">Email Templates</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Create and manage reusable email templates.</p>
      </div>
      <EmailTemplatesTab templates={templates} />
    </main>
  );
}
