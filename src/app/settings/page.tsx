import { getCurrentUser } from "@/lib/currentUser";
import { SettingsClient } from "@/components/SettingsClient";
import { SmtpSettingsSection } from "@/components/SmtpSettingsSection";
import { getSmtpStatus } from "@/lib/actions/smtp-settings";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  const [customFieldFolders, smtpStatus] = await Promise.all([
    prisma.customFieldFolder.findMany({
      where: { userId: user.id },
      include: { fields: { orderBy: { order: "asc" } } },
      orderBy: { order: "asc" },
    }),
    getSmtpStatus(),
  ]);

  return (
    <div className="flex flex-col gap-6 p-8 max-w-3xl">
      <SettingsClient
        user={{
          email: user.email,
          firstName: user.firstName ?? "",
          lastName: user.lastName ?? "",
          nickname: user.nickname ?? "",
          companyWebsite: user.companyWebsite ?? "",
          skoolId: user.skoolId ?? "",
          monthlyRevenueGoal: user.monthlyRevenueGoal ? Number(user.monthlyRevenueGoal) : null,
        }}
        customFieldFolders={customFieldFolders.map((f) => ({
          id: f.id,
          name: f.name,
          fields: f.fields.map((field) => ({
            id: field.id,
            name: field.name,
            type: field.type,
            options: field.options as string[] | null,
          })),
        }))}
      />
      <SmtpSettingsSection initialStatus={smtpStatus} />
    </div>
  );
}
