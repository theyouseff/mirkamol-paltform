-- 2-bosqich (yakunlash): YANGI KOD deploy bo'lgandan KEYIN ishga tushiring. Tariff jadvali o'chadi.
UPDATE "Order" o SET "courseId" = t."courseId" FROM "Tariff" t WHERE o."tariffId" = t."id" AND o."courseId" IS NULL;
ALTER TABLE "Order" ALTER COLUMN "courseId" SET NOT NULL;
ALTER TABLE "Order" ADD CONSTRAINT "Order_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Order" DROP COLUMN "tariffId";
ALTER TABLE "Enrollment" DROP COLUMN "tariffId";
ALTER TABLE "Lesson" DROP COLUMN "minLevel";
DROP TABLE "Tariff";
