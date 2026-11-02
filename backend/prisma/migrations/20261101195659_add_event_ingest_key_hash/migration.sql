/*
  Warnings:

  - A unique constraint covering the columns `[eventIngestKeyHash]` on the table `Organization` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "eventIngestKeyHash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Organization_eventIngestKeyHash_key" ON "Organization"("eventIngestKeyHash");
