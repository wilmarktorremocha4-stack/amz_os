import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";
import { AutomationsListClient } from "./AutomationsListClient";

export const dynamic = "force-dynamic";

export default async function AutomationsPage() {
  const user = await getCurrentUser();
  const workflows = await prisma.workflow.findMany({
    where: { userId: user.id, archived: false },
    include: { _count: { select: { enrollments: true } } },
    orderBy: { updatedAt: "desc" },
  });

  const serialized = workflows.map((wf) => ({
    id: wf.id,
    name: wf.name,
    status: wf.status,
    triggerType: wf.triggerType,
    enrollCount: wf._count.enrollments,
    updatedAt: wf.updatedAt.toISOString(),
    createdAt: wf.createdAt.toISOString(),
  }));

  return <AutomationsListClient workflows={serialized} />;
}
