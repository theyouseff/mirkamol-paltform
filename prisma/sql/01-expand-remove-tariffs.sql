-- 1-bosqich (kengaytirish): faqat qo'shadi/yumshatadi, eski kod ishlashda davom etadi.
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "price" INTEGER NOT NULL DEFAULT 0;
UPDATE "Course" c SET "price" = COALESCE((SELECT MIN(t."price") FROM "Tariff" t WHERE t."courseId" = c."id" AND t."active"), 0) WHERE c."price" = 0;

ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "courseId" TEXT;
UPDATE "Order" o SET "courseId" = t."courseId" FROM "Tariff" t WHERE o."tariffId" = t."id" AND o."courseId" IS NULL;

ALTER TABLE "Order" ALTER COLUMN "tariffId" DROP NOT NULL;
ALTER TABLE "Enrollment" ALTER COLUMN "tariffId" DROP NOT NULL;
