import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";
import { SequencesClient } from "./SequencesClient";

export const dynamic = "force-dynamic";

export default async function SequencesPage() {
  const user = await getCurrentUser();
  const [sequences, suppliers] = await Promise.all([
    prisma.emailSequence.findMany({
      where: { userId: user.id },
      include: {
        steps: { orderBy: { order: "asc" } },
        enrollments: { select: { status: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.supplier.findMany({
      where: { userId: user.id, archived: false },
      select: { id: true, companyName: true, email: true },
      orderBy: { companyName: "asc" },
    }),
  ]);

  return <SequencesClient sequences={sequences as never} suppliers={suppliers} />;
}
