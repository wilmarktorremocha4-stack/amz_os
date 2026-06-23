import { DEFAULT_MERGE_VARIABLES, getAllMergeVariables } from "@/lib/merge-variables";
import { getCurrentUser } from "@/lib/currentUser";
import { DEFAULT_DOC } from "@/lib/email-builder";
import { TemplateEditorClient } from "./TemplateEditorClient";

export default async function NewTemplatePage() {
  let mergeVariables = DEFAULT_MERGE_VARIABLES;
  try {
    const user = await getCurrentUser();
    mergeVariables = await getAllMergeVariables(user.id);
  } catch { /* unauthenticated — use defaults */ }
  return <TemplateEditorClient initialDoc={DEFAULT_DOC} mergeVariables={mergeVariables} />;
}
