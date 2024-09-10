/*
  Warnings:

  - You are about to alter the column `valor` on the `Saidas` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.

*/
-- AlterTable
ALTER TABLE "Saidas" ALTER COLUMN "valor" SET DATA TYPE DECIMAL(65,30);
