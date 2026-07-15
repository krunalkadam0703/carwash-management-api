ALTER TABLE "Payment" DROP CONSTRAINT IF EXISTS "Payment_bookingId_fkey";
ALTER TABLE "DailyWashSchedule" DROP CONSTRAINT IF EXISTS "DailyWashSchedule_bookingId_fkey";
ALTER TABLE "Complaint" DROP CONSTRAINT IF EXISTS "Complaint_bookingId_fkey";
ALTER TABLE "WorkerStatus" DROP CONSTRAINT IF EXISTS "WorkerStatus_currentBookingId_fkey";
ALTER TABLE "WorkerTaskQueue" DROP CONSTRAINT IF EXISTS "WorkerTaskQueue_bookingId_fkey";

DROP TABLE IF EXISTS "WorkerTaskQueue";

ALTER TABLE "Payment" DROP COLUMN IF EXISTS "bookingId";
ALTER TABLE "DailyWashSchedule" DROP COLUMN IF EXISTS "bookingId";
ALTER TABLE "Complaint" DROP COLUMN IF EXISTS "bookingId";
ALTER TABLE "WorkerStatus" DROP COLUMN IF EXISTS "currentBookingId";

DROP TABLE IF EXISTS "Booking";
DROP TYPE IF EXISTS "BookingStatus";
