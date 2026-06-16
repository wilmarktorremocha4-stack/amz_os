import { PendingDbNotice } from "@/components/PendingDbNotice";

export default function ResearchPage() {
  return (
    <main className="flex flex-1 flex-col gap-8 p-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Product Research
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Log products you&apos;ve analyzed from suppliers. No live Amazon
          data is connected — figures here are entered manually until an
          Amazon data provider is wired in.
        </p>
      </div>
      <PendingDbNotice
        feature="Product Research"
        modelHint="The Product model is already defined in prisma/schema.prisma."
      />
    </main>
  );
}
