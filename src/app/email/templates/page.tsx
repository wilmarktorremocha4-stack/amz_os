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
    <main className="flex flex-1 flex-col p-8 overflow-y-auto">
      <EmailTemplatesTab templates={templates} />
    </main>
  );
}
