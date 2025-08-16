/*
  Warnings:

  - You are about to drop the column `htmlTemplate` on the `Page` table. All the data in the column will be lost.
  - You are about to drop the column `htmlFile` on the `blocks` table. All the data in the column will be lost.
  - Added the required column `htmlContent` to the `blocks` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Page" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "headContent" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Page" ("createdAt", "id", "published", "slug", "title", "updatedAt") SELECT "createdAt", "id", "published", "slug", "title", "updatedAt" FROM "Page";
DROP TABLE "Page";
ALTER TABLE "new_Page" RENAME TO "Page";
CREATE UNIQUE INDEX "Page_slug_key" ON "Page"("slug");
CREATE TABLE "new_blocks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "htmlContent" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "draggable" BOOLEAN NOT NULL DEFAULT false,
    "pageId" TEXT NOT NULL,
    CONSTRAINT "blocks_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_blocks" ("draggable", "id", "order", "pageId", "type") SELECT "draggable", "id", "order", "pageId", "type" FROM "blocks";
DROP TABLE "blocks";
ALTER TABLE "new_blocks" RENAME TO "blocks";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
