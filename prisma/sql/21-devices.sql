-- Qurilmalar limiti (akkauntni boshqalarga berishni cheklash) — expand: yangi jadvallar va bo'sh ustunlar, eski kodga ta'sir qilmaydi.
ALTER TABLE "User" ADD COLUMN "watchingDevice" TEXT;
ALTER TABLE "User" ADD COLUMN "deviceResetAt" TIMESTAMP(3);

CREATE TABLE "Device" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT '',
    "userAgent" TEXT NOT NULL DEFAULT '',
    "ip" TEXT NOT NULL DEFAULT '',
    "place" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "revokeReason" TEXT,
    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Device_userId_idx" ON "Device"("userId");
ALTER TABLE "Device" ADD CONSTRAINT "Device_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "DeviceCode" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DeviceCode_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "DeviceCode_tokenHash_key" ON "DeviceCode"("tokenHash");
ALTER TABLE "DeviceCode" ADD CONSTRAINT "DeviceCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
