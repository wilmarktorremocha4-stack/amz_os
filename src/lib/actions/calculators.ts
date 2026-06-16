"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";
import { Prisma } from "@/generated/prisma/client";

export type CalculatorType =
  | "ROI"
  | "MARGIN"
  | "BREAK_EVEN"
  | "INVENTORY_COST"
  | "MULTI_PACK"
  | "BUNDLE"
  | "SALES_TAX"
  | "PREP_CENTER"
  | "REORDER";

export type CalculatorRunSummary = {
  id: string;
  name: string;
  inputs: Record<string, string>;
  result: Record<string, unknown>;
  createdAt: string;
};

export async function listCalculatorRuns(
  type: CalculatorType,
): Promise<CalculatorRunSummary[]> {
  const user = await getCurrentUser();
  const runs = await prisma.calculatorRun.findMany({
    where: { userId: user.id, type },
    orderBy: { createdAt: "desc" },
  });

  return runs.map((run) => ({
    id: run.id,
    name: run.name,
    inputs: run.inputs as Record<string, string>,
    result: run.result as Record<string, unknown>,
    createdAt: run.createdAt.toISOString(),
  }));
}

export async function saveCalculatorRun(
  type: CalculatorType,
  name: string,
  inputs: Record<string, string>,
  result: Record<string, unknown>,
): Promise<void> {
  const user = await getCurrentUser();
  const trimmedName = name.trim();
  if (!trimmedName) return;

  await prisma.calculatorRun.create({
    data: {
      userId: user.id,
      type,
      name: trimmedName,
      inputs: inputs as Prisma.InputJsonValue,
      result: result as Prisma.InputJsonValue,
    },
  });

  revalidatePath("/calculators");
}

export async function deleteCalculatorRun(id: string): Promise<void> {
  const user = await getCurrentUser();
  await prisma.calculatorRun.delete({ where: { id, userId: user.id } });
  revalidatePath("/calculators");
}
