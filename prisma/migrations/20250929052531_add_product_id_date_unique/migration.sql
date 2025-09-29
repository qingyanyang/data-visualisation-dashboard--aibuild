/*
  Warnings:

  - A unique constraint covering the columns `[productId,date]` on the table `InventorySnapshot` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[productId,date]` on the table `Procurement` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[productId,date]` on the table `Sale` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "InventorySnapshot_productId_date_key" ON "public"."InventorySnapshot"("productId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Procurement_productId_date_key" ON "public"."Procurement"("productId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Sale_productId_date_key" ON "public"."Sale"("productId", "date");
