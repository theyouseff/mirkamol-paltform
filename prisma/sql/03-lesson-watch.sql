-- CreateTable
CREATE TABLE "LessonWatch" (
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "duration" INTEGER NOT NULL DEFAULT 0,
    "watched" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LessonWatch_pkey" PRIMARY KEY ("userId","lessonId")
);
-- CreateIndex
CREATE INDEX "LessonWatch_updatedAt_idx" ON "LessonWatch"("updatedAt");
-- AddForeignKey
ALTER TABLE "LessonWatch" ADD CONSTRAINT "LessonWatch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "LessonWatch" ADD CONSTRAINT "LessonWatch_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
