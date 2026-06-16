"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";

export async function updateProfile(formData: FormData) {
  const user = await getCurrentUser();
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const nickname = String(formData.get("nickname") ?? "").trim();
  const companyWebsite = String(formData.get("companyWebsite") ?? "").trim();
  const skoolId = String(formData.get("skoolId") ?? "").trim();
  const goalRaw = String(formData.get("monthlyRevenueGoal") ?? "").trim();
  const monthlyRevenueGoal = goalRaw === "" ? null : parseFloat(goalRaw);
  const name = [firstName, lastName].filter(Boolean).join(" ").trim();

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name: name || null,
      firstName: firstName || null,
      lastName: lastName || null,
      nickname: nickname || null,
      companyWebsite: companyWebsite || null,
      skoolId: skoolId || null,
      monthlyRevenueGoal:
        monthlyRevenueGoal !== null && !Number.isNaN(monthlyRevenueGoal)
          ? monthlyRevenueGoal
          : null,
    },
  });

  revalidatePath("/settings");
  revalidatePath("/");
}
