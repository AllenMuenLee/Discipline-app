-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Goal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "durationDays" INTEGER NOT NULL DEFAULT 7,
    "endDate" DATETIME,
    "stakeAmount" REAL NOT NULL,
    "startedAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDING_INSTRUCTOR_ASSIGNMENT',
    "userId" TEXT NOT NULL,
    "instructorId" TEXT,
    CONSTRAINT "Goal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Goal_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Goal" ("description", "endDate", "id", "instructorId", "stakeAmount", "startDate", "startedAt", "status", "title", "userId") SELECT "description", "endDate", "id", "instructorId", "stakeAmount", "startDate", "startedAt", "status", "title", "userId" FROM "Goal";
DROP TABLE "Goal";
ALTER TABLE "new_Goal" RENAME TO "Goal";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
