-- O'quvchi akkaunti o'chirilganda to'lov yozuvi (daromad hisoboti) saqlansin: userId bo'sh bo'lishi mumkin, ism/email nusxasi Order da qoladi.
ALTER TABLE "Order" ADD COLUMN "buyerName" TEXT NOT NULL DEFAULT '', ADD COLUMN "buyerEmail" TEXT NOT NULL DEFAULT '';
UPDATE "Order" o SET "buyerName" = u."name", "buyerEmail" = u."email" FROM "User" u WHERE u."id" = o."userId";
ALTER TABLE "Order" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "Order" DROP CONSTRAINT "Order_userId_fkey";
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
