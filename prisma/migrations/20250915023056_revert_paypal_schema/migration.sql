/*
  Warnings:

  - You are about to drop the column `paymentMethod` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `paypalOrderId` on the `Payment` table. All the data in the column will be lost.
  - Added the required column `stripeChargeId` to the `Payment` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stripeChargeId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "status" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "goalId" TEXT,
    "recipientId" TEXT,
    CONSTRAINT "Payment_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Payment_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Payment" ("amount", "goalId", "id", "recipientId", "status", "type") SELECT "amount", "goalId", "id", "recipientId", "status", "type" FROM "Payment";
DROP TABLE "Payment";
ALTER TABLE "new_Payment" RENAME TO "Payment";
CREATE UNIQUE INDEX "Payment_stripeChargeId_key" ON "Payment"("stripeChargeId");
CREATE UNIQUE INDEX "Payment_goalId_key" ON "Payment"("goalId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
