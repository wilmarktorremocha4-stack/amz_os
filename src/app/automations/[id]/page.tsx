import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";
import { notFound } from "next/navigation";
import { WorkflowBuilderClient } from "./WorkflowBuilderClient";

export const dynamic = "force-dynamic";

export default async function WorkflowEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let errorMsg: string | null = null;
  let data: {
    workflow: Parameters<typeof WorkflowBuilderClient>[0]["workflow"] | null;
    tags: Parameters<typeof WorkflowBuilderClient>[0]["tags"];
    pipelines: Parameters<typeof WorkflowBuilderClient>[0]["pipelines"];
    customFields: Parameters<typeof WorkflowBuilderClient>[0]["customFields"];
    contacts: Parameters<typeof WorkflowBuilderClient>[0]["contacts"];
  } = { workflow: null, tags: [], pipelines: [], customFields: [], contacts: [] };

  try {
    const user = await getCurrentUser();
    const [workflow, tags, pipelines, customFields, contacts] = await Promise.all([
      prisma.workflow.findUnique({ where: { id, userId: user.id } }),
      prisma.tag.findMany({ where: { userId: user.id }, orderBy: { name: "asc" } }),
      prisma.pipeline.findMany({ where: { userId: user.id }, include: { stages: { orderBy: { order: "asc" } } } }),
      prisma.customField.findMany({ where: { userId: user.id }, orderBy: { name: "asc" } }),
      prisma.supplier.findMany({ where: { userId: user.id, archived: false }, select: { id: true, companyName: true, email: true }, orderBy: { companyName: "asc" } }),
    ]);

    if (!workflow) notFound();
    data = { workflow, tags, pipelines, customFields, contacts };
  } catch (e) {
    errorMsg = e instanceof Error ? e.message : String(e);
  }

  if (errorMsg) {
    return (
      <div style={{ padding: 40, maxWidth: 700 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Workflow failed to load</h2>
        <pre style={{ fontSize: 12, background: "#fef2f2", color: "#dc2626", padding: 16, borderRadius: 8, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
          {errorMsg}
        </pre>
      </div>
    );
  }

  if (!data.workflow) notFound();

  return (
    <WorkflowBuilderClient
      workflow={data.workflow}
      tags={data.tags}
      pipelines={data.pipelines}
      customFields={data.customFields}
      contacts={data.contacts}
    />
  );
}
