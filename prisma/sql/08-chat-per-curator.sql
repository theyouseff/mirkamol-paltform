-- Har bir (o'quvchi, kurator) juftligiga alohida suhbat: xabarga curatorId qo'shiladi (expand; eski kod bunga tegmaydi).
ALTER TABLE "ChatMessage" ADD COLUMN "curatorId" TEXT;
-- Eski xabarlar: kurator yozganlari o'sha kuratorning suhbatiga
UPDATE "ChatMessage" SET "curatorId" = "authorId" WHERE "authorRole" = 'STAFF' AND "curatorId" IS NULL;
CREATE INDEX "ChatMessage_curatorId_studentId_createdAt_idx" ON "ChatMessage"("curatorId", "studentId", "createdAt");
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_curatorId_fkey" FOREIGN KEY ("curatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
