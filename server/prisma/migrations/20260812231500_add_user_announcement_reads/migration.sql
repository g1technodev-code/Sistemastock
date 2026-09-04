-- CreateTable
CREATE TABLE "user_announcement_reads" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "announcementId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_announcement_reads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_announcement_reads_userId_announcementId_key" ON "user_announcement_reads"("userId", "announcementId");

-- CreateIndex
CREATE INDEX "user_announcement_reads_userId_idx" ON "user_announcement_reads"("userId");

-- CreateIndex
CREATE INDEX "user_announcement_reads_announcementId_idx" ON "user_announcement_reads"("announcementId");

-- AddForeignKey
ALTER TABLE "user_announcement_reads" ADD CONSTRAINT "user_announcement_reads_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_announcement_reads" ADD CONSTRAINT "user_announcement_reads_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "announcements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
