/*
  Warnings:

  - The values [CERTIFIED] on the enum `VerificationStatus` will be removed. If these variants are still used in the database, this will fail.
  - Added the required column `updatedAt` to the `Chat` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "VerificationStatus_new" AS ENUM ('PENDING_INITIAL_REVIEW', 'PENDING_DOCUMENTS_UPLOAD', 'PENDING_BACKGROUND_CHECK', 'PENDING_MANUAL_REVIEW', 'APPROVED', 'REJECTED', 'BLOCKED');
ALTER TABLE "Provider" ALTER COLUMN "verificationStatus" DROP DEFAULT;
ALTER TABLE "Provider" ALTER COLUMN "verificationStatus" TYPE "VerificationStatus_new" USING ("verificationStatus"::text::"VerificationStatus_new");
ALTER TYPE "VerificationStatus" RENAME TO "VerificationStatus_old";
ALTER TYPE "VerificationStatus_new" RENAME TO "VerificationStatus";
DROP TYPE "VerificationStatus_old";
ALTER TABLE "Provider" ALTER COLUMN "verificationStatus" SET DEFAULT 'PENDING_INITIAL_REVIEW';
COMMIT;

-- AlterTable
ALTER TABLE "Chat" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
