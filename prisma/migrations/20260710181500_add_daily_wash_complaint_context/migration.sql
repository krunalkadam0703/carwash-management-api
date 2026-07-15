ALTER TABLE "Complaint"
ADD COLUMN "workerId" TEXT,
ADD COLUMN "createdById" TEXT,
ADD COLUMN "dailyWashId" TEXT,
ADD COLUMN "complaintDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "Complaint"
ADD CONSTRAINT "Complaint_workerId_fkey"
FOREIGN KEY ("workerId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Complaint"
ADD CONSTRAINT "Complaint_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Complaint"
ADD CONSTRAINT "Complaint_dailyWashId_fkey"
FOREIGN KEY ("dailyWashId") REFERENCES "DailyWashSchedule"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Complaint_dailyWashId_idx" ON "Complaint"("dailyWashId");
CREATE INDEX "Complaint_workerId_idx" ON "Complaint"("workerId");
CREATE INDEX "Complaint_complaintDate_idx" ON "Complaint"("complaintDate");
