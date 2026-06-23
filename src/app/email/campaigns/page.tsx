import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";
import { CampaignsClient } from "./CampaignsClient";
import { getAllMergeVariables, DEFAULT_MERGE_VARIABLES } from "@/lib/merge-variables";
import { EmailDoc } from "@/lib/email-builder";

export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  const user = await getCurrentUser();
  const [campaigns, suppliers, templates, mergeVariables] = await Promise.all([
    prisma.emailCampaign.findMany({
      where: { userId: user.id },
      include: {
        recipients: {
          select: { status: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.supplier.findMany({
      where: { userId: user.id, archived: false },
      select: { id: true, companyName: true, email: true },
      orderBy: { companyName: "asc" },
    }),
    prisma.emailTemplate.findMany({
      where: { userId: user.id },
      select: { id: true, name: true, bodyJson: true },
      orderBy: { name: "asc" },
    }).catch(() => []),
    getAllMergeVariables(user.id).catch(() => DEFAULT_MERGE_VARIABLES),
  ]);

  const campaignsWithStats = campaigns.map((c) => ({
    ...c,
    bodyJson: c.bodyJson as unknown as import("@/lib/email-builder").EmailDoc,
    stats: {
      total: c.recipients.length,
      sent: c.recipients.filter((r) => r.status !== "queued").length,
      opened: c.recipients.filter((r) => r.status === "opened" || r.status === "clicked").length,
      clicked: c.recipients.filter((r) => r.status === "clicked").length,
      bounced: c.recipients.filter((r) => r.status === "bounced").length,
    },
  }));

  return (
    <CampaignsClient
      campaigns={campaignsWithStats}
      suppliers={suppliers}
      templates={templates.map(t => ({ ...t, bodyJson: t.bodyJson as unknown as EmailDoc }))}
      mergeVariables={mergeVariables}
    />
  );
}
