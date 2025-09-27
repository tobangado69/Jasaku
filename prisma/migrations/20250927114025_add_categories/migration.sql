/*
  Warnings:

  - You are about to drop the column `category` on the `services` table. All the data in the column will be lost.
  - Added the required column `categoryId` to the `services` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- Insert default categories from existing services
INSERT INTO "categories" ("id", "name", "description", "isActive", "createdAt", "updatedAt") VALUES
('cat_cleaning', 'Cleaning', 'House cleaning and maintenance services', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('cat_it', 'IT Services', 'Information technology and computer services', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('cat_home', 'Home Services', 'General home improvement and maintenance', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('cat_beauty', 'Beauty & Wellness', 'Beauty, health and wellness services', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('cat_education', 'Education & Training', 'Educational and training services', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('cat_maintenance', 'Maintenance & Repair', 'Equipment and appliance maintenance', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('cat_other', 'Other', 'Other miscellaneous services', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_services" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "subcategory" TEXT,
    "price" INTEGER NOT NULL,
    "duration" INTEGER,
    "location" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "images" JSONB,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "providerId" TEXT NOT NULL,
    CONSTRAINT "services_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "services_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Migrate existing services data with category mapping
INSERT INTO "new_services" ("createdAt", "description", "duration", "id", "images", "latitude", "location", "longitude", "price", "providerId", "status", "subcategory", "title", "updatedAt", "categoryId") 
SELECT 
    "createdAt", 
    "description", 
    "duration", 
    "id", 
    "images", 
    "latitude", 
    "location", 
    "longitude", 
    "price", 
    "providerId", 
    "status", 
    "subcategory", 
    "title", 
    "updatedAt",
    CASE 
        WHEN "category" = 'cleaning' THEN 'cat_cleaning'
        WHEN "category" = 'it' THEN 'cat_it'
        WHEN "category" = 'home' THEN 'cat_home'
        WHEN "category" = 'beauty' THEN 'cat_beauty'
        WHEN "category" = 'education' THEN 'cat_education'
        WHEN "category" = 'maintenance' THEN 'cat_maintenance'
        ELSE 'cat_other'
    END
FROM "services";

DROP TABLE "services";
ALTER TABLE "new_services" RENAME TO "services";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");
