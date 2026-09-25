-- CreateTable
CREATE TABLE "CuratorCourse" (
    "curatorId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CuratorCourse_pkey" PRIMARY KEY ("curatorId","courseId")
);
-- AddForeignKey
ALTER TABLE "CuratorCourse" ADD CONSTRAINT "CuratorCourse_curatorId_fkey" FOREIGN KEY ("curatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "CuratorCourse" ADD CONSTRAINT "CuratorCourse_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
