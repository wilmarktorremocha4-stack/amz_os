import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";
import { ContactDetailClient } from "@/components/ContactDetailClient";

export const dynamic = "force-dynamic";

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  const { id } = await params;

  const [supplier, allTags, opportunities, pipelines] = await Promise.all([
    prisma.supplier.findUnique({
      where: { id, userId: user.id },
      include: { tags: { include: { tag: true } } },
    }),
    prisma.tag.findMany({ where: { userId: user.id }, orderBy: { name: "asc" } }),
    prisma.opportunity.findMany({
      where: { supplierId: id, userId: user.id },
      include: {
        pipeline: { select: { id: true, name: true } },
        stage: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.pipeline.findMany({
      where: { userId: user.id },
      include: { stages: { orderBy: { order: "asc" } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!supplier) notFound();

  return (
    <ContactDetailClient
      supplier={{
        id: supplier.id,
        companyName: supplier.companyName,
        contactName: supplier.contactName,
        email: supplier.email,
        phone: supplier.phone,
        website: supplier.website,
        stage: supplier.stage,
        notes: supplier.notes,
        createdAt: supplier.createdAt.toISOString(),
      }}
      contactTags={supplier.tags.map((ct) => ct.tag)}
      allTags={allTags}
      opportunities={opportunities.map((o) => ({
        id: o.id,
        name: o.name,
        value: o.value ? o.value.toString() : null,
        status: o.status,
        notes: o.notes,
        stageId: o.stageId,
        supplierId: o.supplierId,
        pipeline: o.pipeline,
        stage: o.stage,
      }))}
      pipelines={pipelines.map((p) => ({
        id: p.id,
        name: p.name,
        stages: p.stages,
      }))}
    />
  );
}
