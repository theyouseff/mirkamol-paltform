-- Online holati va kirish xabari (expand: yangi ustun va jadval, eski kodga ta'sir qilmaydi).
ALTER TABLE "User" ADD COLUMN "lastSeenAt" TIMESTAMP(3);
CREATE TABLE "PlatformEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PlatformEntry_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "PlatformEntry_createdAt_idx" ON "PlatformEntry"("createdAt");
ALTER TABLE "PlatformEntry" ADD CONSTRAINT "PlatformEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
