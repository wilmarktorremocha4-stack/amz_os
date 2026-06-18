"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";
import { searchAmazonProducts, getOffersSummary } from "@/lib/amazon";
import { draftBrandOutreachEmail } from "@/lib/openai";
import { sendEmail } from "@/lib/email";

export async function lookupBrandOnAmazon(formData: FormData) {
  const query = String(formData.get("lookupQuery") ?? "").trim();
  if (!query) return;

  try {
    const user = await getCurrentUser();
    const products = await searchAmazonProducts(query);

    if (products.length === 0) {
      redirect(
        `/research/brands?lookupError=${encodeURIComponent(`No Amazon results for "${query}".`)}`,
      );
    }

    const prices = products
      .map((p) => p.price)
      .filter((p): p is number => p !== null);
    const reviews = products
      .map((p) => p.ratingsTotal)
      .filter((r): r is number => r !== null);
    const avgPrice = prices.length
      ? prices.reduce((a, b) => a + b, 0) / prices.length
      : null;
    const avgReviews = reviews.length
      ? Math.round(reviews.reduce((a, b) => a + b, 0) / reviews.length)
      : null;

    let sellerCount: number | null = null;
    try {
      const offers = await getOffersSummary(products[0].asin);
      sellerCount = offers.sellerCount;
    } catch {
      // offers lookup is best-effort; fall back to manual entry if it fails
    }

    await prisma.brand.create({
      data: {
        userId: user.id,
        name: query,
        avgPrice,
        reviewCount: avgReviews,
        sellerCount,
        notes: `Avg. price and review count pulled from a live Amazon search (${products.length} listings)${sellerCount !== null ? `, seller count from the top result's live offers` : ""}, via Apify on ${new Date().toLocaleDateString()}. Est. monthly sales aren't available from this data source — enter manually if known.`,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Lookup failed";
    redirect(`/research/brands?lookupError=${encodeURIComponent(message)}`);
  }

  revalidatePath("/research/brands");
}

export async function sendBrandOutreachEmail(formData: FormData) {
  const user = await getCurrentUser();
  const brandId = String(formData.get("brandId") ?? "");
  const contactEmail = String(formData.get("contactEmail") ?? "").trim();

  if (!brandId || !contactEmail) {
    redirect(
      `/research/brands?lookupError=${encodeURIComponent("Contact email is required to send outreach.")}`,
    );
  }

  const brand = await prisma.brand.findUnique({
    where: { id: brandId, userId: user.id },
  });
  if (!brand) {
    redirect(`/research/brands?lookupError=${encodeURIComponent("Brand not found.")}`);
  }

  try {
    const draft = await draftBrandOutreachEmail({
      brandName: brand!.name,
      category: brand!.category,
      notes: brand!.notes,
    });

    await sendEmail({
      to: contactEmail,
      subject: draft.subject,
      html: draft.body.replace(/\n/g, "<br />"),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Outreach email failed";
    redirect(`/research/brands?lookupError=${encodeURIComponent(message)}`);
  }

  revalidatePath("/research/brands");
}

export async function createBrand(formData: FormData) {
  const user = await getCurrentUser();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  await prisma.brand.create({
    data: {
      userId: user.id,
      name,
      category: emptyToNull(formData.get("category")),
      estimatedMonthlySales: toDecimalOrNull(
        formData.get("estimatedMonthlySales"),
      ),
      sellerCount: toIntOrNull(formData.get("sellerCount")),
      avgPrice: toDecimalOrNull(formData.get("avgPrice")),
      reviewCount: toIntOrNull(formData.get("reviewCount")),
    },
  });

  revalidatePath("/research/brands");
}

export async function setBrandApproved(brandId: string, approved: boolean) {
  const user = await getCurrentUser();
  await prisma.brand.update({
    where: { id: brandId, userId: user.id },
    data: { approved },
  });

  if (approved) {
    await prisma.activityLog.create({
      data: { userId: user.id, type: "BRAND_APPROVED", metadata: { brandId } },
    });
  }

  revalidatePath("/research/brands");
  revalidatePath("/progress");
}

export async function archiveBrand(brandId: string) {
  const user = await getCurrentUser();
  await prisma.brand.update({
    where: { id: brandId, userId: user.id },
    data: { archived: true },
  });
  revalidatePath("/research/brands");
  revalidatePath("/archive");
}

export async function restoreBrand(brandId: string) {
  const user = await getCurrentUser();
  await prisma.brand.update({
    where: { id: brandId, userId: user.id },
    data: { archived: false },
  });
  revalidatePath("/research/brands");
  revalidatePath("/archive");
}

export async function deleteBrandPermanently(brandId: string) {
  const user = await getCurrentUser();
  await prisma.brand.delete({ where: { id: brandId, userId: user.id } });
  revalidatePath("/archive");
}

function emptyToNull(value: FormDataEntryValue | null) {
  const str = String(value ?? "").trim();
  return str === "" ? null : str;
}

function toIntOrNull(value: FormDataEntryValue | null) {
  const str = String(value ?? "").trim();
  if (str === "") return null;
  const n = parseInt(str, 10);
  return Number.isNaN(n) ? null : n;
}

function toDecimalOrNull(value: FormDataEntryValue | null) {
  const str = String(value ?? "").trim();
  if (str === "") return null;
  const n = parseFloat(str);
  return Number.isNaN(n) ? null : n;
}
