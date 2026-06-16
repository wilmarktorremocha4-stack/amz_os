"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";

export async function updateProfile(formData: FormData) {
  const user = await getCurrentUser();
  const name = String(formData.get("name") ?? "").trim();
  const skoolId = String(formData.get("skoolId") ?? "").trim();
  const goalRaw = String(formData.get("monthlyRevenueGoal") ?? "").trim();
  const monthlyRevenueGoal = goalRaw === "" ? null : parseFloat(goalRaw);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name: name || null,
      skoolId: skoolId || null,
      monthlyRevenueGoal:
        monthlyRevenueGoal !== null && !Number.isNaN(monthlyRevenueGoal) ? monthlyRevenueGoal : null,
    },
  });

  revalidatePath("/settings");
  revalidatePath("/");
}
