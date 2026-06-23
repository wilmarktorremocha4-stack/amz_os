import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";
import { getAllMergeVariables, DEFAULT_MERGE_VARIABLES } from "@/lib/merge-variables";
import { DEFAULT_DOC, EmailDoc } from "@/lib/email-builder";
import { TemplateEditorClient } from "../new/TemplateEditorClient";

export default async function EditTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const user = await getCurrentUser();
    const [tpl, mergeVariables] = await Promise.all([
      prisma.emailTemplate.findUnique({ where: { id, userId: user.id } }),
      getAllMergeVariables(user.id).catch(() => DEFAULT_MERGE_VARIABLES),
    ]);
    if (!tpl) return notFound();
    return (
      <TemplateEditorClient
        initialDoc={(tpl.bodyJson as EmailDoc | null) ?? DEFAULT_DOC}
        templateId={tpl.id}
        initialName={tpl.name}
        initialSubject={tpl.subject}
        mergeVariables={mergeVariables}
      />
    );
  } catch { return notFound(); }
}
