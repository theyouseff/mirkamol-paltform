-- CreateTable
CREATE TABLE "LoginDay" (
    "userId" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    CONSTRAINT "LoginDay_pkey" PRIMARY KEY ("userId","day")
);
-- AddForeignKey
ALTER TABLE "LoginDay" ADD CONSTRAINT "LoginDay_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
