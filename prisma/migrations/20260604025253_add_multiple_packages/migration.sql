/*
  Warnings:

  - You are about to drop the column `activationDate` on the `Customer` table. All the data in the column will be lost.
  - You are about to drop the column `currentPackage` on the `Customer` table. All the data in the column will be lost.
  - You are about to drop the column `expirationDate` on the `Customer` table. All the data in the column will be lost.
  - You are about to drop the column `purchaseDate` on the `Customer` table. All the data in the column will be lost.
  - You are about to drop the column `remainingSessions` on the `Customer` table. All the data in the column will be lost.
  - You are about to drop the column `totalSessions` on the `Customer` table. All the data in the column will be lost.
  - You are about to drop the column `usedSessions` on the `Customer` table. All the data in the column will be lost.
  - Added the required column `packageId` to the `AttendanceLog` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "CustomerPackage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "packageName" TEXT NOT NULL,
    "totalSessions" INTEGER NOT NULL DEFAULT 0,
    "usedSessions" INTEGER NOT NULL DEFAULT 0,
    "remainingSessions" INTEGER NOT NULL DEFAULT 0,
    "purchaseDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activationDate" DATETIME,
    "expirationDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CustomerPackage_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AttendanceLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "customerId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "packageName" TEXT NOT NULL,
    "trainer" TEXT NOT NULL,
    "checkInStatus" TEXT NOT NULL DEFAULT 'CHECKED_IN',
    "costPerSession" REAL NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AttendanceLog_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AttendanceLog_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "CustomerPackage" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_AttendanceLog" ("checkInStatus", "costPerSession", "createdAt", "customerId", "date", "id", "notes", "packageName", "trainer", "updatedAt") SELECT "checkInStatus", "costPerSession", "createdAt", "customerId", "date", "id", "notes", "packageName", "trainer", "updatedAt" FROM "AttendanceLog";
DROP TABLE "AttendanceLog";
ALTER TABLE "new_AttendanceLog" RENAME TO "AttendanceLog";
CREATE TABLE "new_Customer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "dob" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Customer" ("code", "createdAt", "dob", "id", "name", "notes", "phone", "status", "updatedAt") SELECT "code", "createdAt", "dob", "id", "name", "notes", "phone", "status", "updatedAt" FROM "Customer";
DROP TABLE "Customer";
ALTER TABLE "new_Customer" RENAME TO "Customer";
CREATE UNIQUE INDEX "Customer_code_key" ON "Customer"("code");
CREATE TABLE "new_Revenue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "customerId" TEXT NOT NULL,
    "packageId" TEXT,
    "packageName" TEXT NOT NULL,
    "totalSessions" INTEGER NOT NULL,
    "amount" REAL NOT NULL,
    "pricePerSession" REAL NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "salesperson" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Revenue_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Revenue_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "CustomerPackage" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Revenue" ("amount", "createdAt", "customerId", "date", "id", "notes", "packageName", "paymentMethod", "pricePerSession", "salesperson", "totalSessions", "updatedAt") SELECT "amount", "createdAt", "customerId", "date", "id", "notes", "packageName", "paymentMethod", "pricePerSession", "salesperson", "totalSessions", "updatedAt" FROM "Revenue";
DROP TABLE "Revenue";
ALTER TABLE "new_Revenue" RENAME TO "Revenue";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
