/*
  Warnings:

  - You are about to drop the column `verified` on the `Provider` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING_INITIAL_REVIEW', 'PENDING_DOCUMENTS_UPLOAD', 'PENDING_BACKGROUND_CHECK', 'PENDING_MANUAL_REVIEW', 'APPROVED', 'REJECTED', 'BLOCKED');

-- AlterTable
ALTER TABLE "Provider" DROP COLUMN "verified",
ADD COLUMN     "backgroundCheckResult" JSONB,
ADD COLUMN     "documentPhotoBackUrl" TEXT,
ADD COLUMN     "documentPhotoFrontUrl" TEXT,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "selfieWithDocumentUrl" TEXT,
ADD COLUMN     "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING_INITIAL_REVIEW';
