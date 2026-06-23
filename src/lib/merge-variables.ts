import { prisma } from "@/lib/prisma";

export interface MergeVariable {
  key: string;
  label: string;
  sample: string;
  category: "Default" | "Custom Field";
}

export const DEFAULT_MERGE_VARIABLES: MergeVariable[] = [
  { key: "firstName",      label: "First Name",       sample: "Brad",                  category: "Default" },
  { key: "lastName",       label: "Last Name",        sample: "Sherman",               category: "Default" },
  { key: "companyName",    label: "Company Name",     sample: "Acme Distribution",     category: "Default" },
  { key: "email",          label: "Contact Email",    sample: "contact@acme.com",      category: "Default" },
  { key: "phone",          label: "Contact Phone",    sample: "(555) 123-4567",        category: "Default" },
  { key: "senderName",     label: "Sender Name",      sample: "Brad Sherman",          category: "Default" },
  { key: "senderEmail",    label: "Sender Email",     sample: "brad@operationamz.com", category: "Default" },
  { key: "stage",          label: "Outreach Stage",   sample: "CONTACTED",             category: "Default" },
  { key: "unsubscribeUrl", label: "Unsubscribe Link", sample: "#",                     category: "Default" },
  { key: "today",          label: "Today's Date",     sample: "June 21, 2026",         category: "Default" },
];

export async function getAllMergeVariables(userId: string): Promise<MergeVariable[]> {
  let customVars: MergeVariable[] = [];
  try {
    const customFields = await prisma.customField.findMany({
      where: { userId },
      select: { id: true, name: true },
    });
    customVars = customFields.map(f => ({
      key: `cf_${f.id}`,
      label: f.name,
      sample: "(custom value)",
      category: "Custom Field" as const,
    }));
  } catch { /* customField table may not exist */ }
  return [...DEFAULT_MERGE_VARIABLES, ...customVars];
}

export async function resolveMergeVarsForSupplier(
  supplierId: string,
  senderInfo: { name: string; email: string },
): Promise<Record<string, string>> {
  try {
    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
      include: { fieldValues: true },
    });
    if (!supplier) return {};
    const vars: Record<string, string> = {
      firstName:      supplier.contactName?.split(" ")[0] ?? supplier.companyName,
      lastName:       supplier.contactName?.split(" ").slice(1).join(" ") ?? "",
      companyName:    supplier.companyName,
      email:          supplier.email ?? "",
      phone:          supplier.phone ?? "",
      senderName:     senderInfo.name,
      senderEmail:    senderInfo.email,
      stage:          supplier.stage,
      unsubscribeUrl: `${process.env.NEXTAUTH_URL ?? ""}/api/track/unsubscribe?supplierId=${supplier.id}`,
      today:          new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
    };
    const fvs = supplier.fieldValues as { fieldId: string; value: string }[] | undefined;
    for (const fv of fvs ?? []) {
      vars[`cf_${fv.fieldId}`] = fv.value;
    }
    return vars;
  } catch { return {}; }
}
