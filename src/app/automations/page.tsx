import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";
import { AutomationsListClient } from "./AutomationsListClient";

export const dynamic = "force-dynamic";

export default async function AutomationsPage() {
  let errorMsg: string | null = null;
  let serialized: {
    id: string; name: string; status: string; triggerType: string;
    enrollCount: number; updatedAt: string; createdAt: string;
  }[] = [];

  try {
    const user = await getCurrentUser();
    const workflows = await prisma.workflow.findMany({
      where: { userId: user.id },
      include: { _count: { select: { enrollments: true } } },
      orderBy: { updatedAt: "desc" },
    });

    serialized = workflows.map((wf) => ({
      id: wf.id,
      name: wf.name,
      status: wf.status,
      triggerType: wf.triggerType,
      enrollCount: wf._count.enrollments,
      updatedAt: wf.updatedAt.toISOString(),
      createdAt: wf.createdAt.toISOString(),
    }));
  } catch (e) {
    errorMsg = e instanceof Error ? e.message : String(e);
  }

  if (errorMsg) {
    return (
      <div style={{ padding: 40, maxWidth: 700 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Automations failed to load</h2>
        <pre style={{ fontSize: 12, background: "#fef2f2", color: "#dc2626", padding: 16, borderRadius: 8, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
          {errorMsg}
        </pre>
        <p style={{ fontSize: 12, marginTop: 12, color: "#6b7280" }}>
          Please share this error message so it can be fixed.
        </p>
      </div>
    );
  }

  return <AutomationsListClient workflows={serialized} />;
}
