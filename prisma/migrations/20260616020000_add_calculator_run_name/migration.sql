-- AlterTable
ALTER TABLE "CalculatorRun" ADD COLUMN "name" TEXT NOT NULL DEFAULT 'Untitled';

ALTER TABLE "CalculatorRun" ALTER COLUMN "name" DROP DEFAULT;
