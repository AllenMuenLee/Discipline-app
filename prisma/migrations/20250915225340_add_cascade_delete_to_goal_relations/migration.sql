-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DailySubmission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "submissionDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "goalId" TEXT NOT NULL,
    "reviewerId" TEXT,
    CONSTRAINT "DailySubmission_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DailySubmission_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_DailySubmission" ("content", "goalId", "id", "reviewerId", "status", "submissionDate") SELECT "content", "goalId", "id", "reviewerId", "status", "submissionDate" FROM "DailySubmission";
DROP TABLE "DailySubmission";
ALTER TABLE "new_DailySubmission" RENAME TO "DailySubmission";
CREATE TABLE "new_Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stripeChargeId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "status" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "goalId" TEXT,
    "recipientId" TEXT,
    CONSTRAINT "Payment_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Payment_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Payment" ("amount", "goalId", "id", "recipientId", "status", "stripeChargeId", "type") SELECT "amount", "goalId", "id", "recipientId", "status", "stripeChargeId", "type" FROM "Payment";
DROP TABLE "Payment";
ALTER TABLE "new_Payment" RENAME TO "Payment";
CREATE UNIQUE INDEX "Payment_stripeChargeId_key" ON "Payment"("stripeChargeId");
CREATE UNIQUE INDEX "Payment_goalId_key" ON "Payment"("goalId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
