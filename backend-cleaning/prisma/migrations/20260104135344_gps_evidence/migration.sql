-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "arrivedAccuracyM" DOUBLE PRECISION,
ADD COLUMN     "arrivedLat" DOUBLE PRECISION,
ADD COLUMN     "arrivedLng" DOUBLE PRECISION,
ADD COLUMN     "completedAccuracyM" DOUBLE PRECISION,
ADD COLUMN     "completedLat" DOUBLE PRECISION,
ADD COLUMN     "completedLng" DOUBLE PRECISION,
ADD COLUMN     "startedAccuracyM" DOUBLE PRECISION,
ADD COLUMN     "startedLat" DOUBLE PRECISION,
ADD COLUMN     "startedLng" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "BookingProof" ADD COLUMN     "accuracyMeters" DOUBLE PRECISION,
ADD COLUMN     "capturedAt" TIMESTAMP(3),
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION;
