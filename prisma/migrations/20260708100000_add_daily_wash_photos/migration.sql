CREATE TABLE "DailyWashPhoto" (
    "id" TEXT NOT NULL,
    "dailyWashId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "photoType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyWashPhoto_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DailyWashPhoto_dailyWashId_photoType_idx" ON "DailyWashPhoto"("dailyWashId", "photoType");

ALTER TABLE "DailyWashPhoto"
ADD CONSTRAINT "DailyWashPhoto_dailyWashId_fkey"
FOREIGN KEY ("dailyWashId") REFERENCES "DailyWashSchedule"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
