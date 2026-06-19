import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";
import { notFound } from "next/navigation";
import { WorkflowBuilderClient } from "./WorkflowBuilderClient";

export const dynamic = "force-dynamic";

export default async function WorkflowEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const [workflow, tags, pipelines, customFields, contacts] = await Promise.all([
    prisma.workflow.findUnique({ where: { id, userId: user.id } }),
    prisma.tag.findMany({ where: { userId: user.id }, orderBy: { name: "asc" } }),
    prisma.pipeline.findMany({ where: { userId: user.id }, include: { stages: { orderBy: { order: "asc" } } } }),
    prisma.customField.findMany({ where: { userId: user.id }, orderBy: { name: "asc" } }),
    prisma.supplier.findMany({ where: { userId: user.id, archived: false }, select: { id: true, companyName: true, email: true }, orderBy: { companyName: "asc" } }),
  ]);
  if (!workflow) notFound();
  return (
    <WorkflowBuilderClient
      workflow={workflow}
      tags={tags}
      pipelines={pipelines}
      customFields={customFields}
      contacts={contacts}
    />
  );
}
