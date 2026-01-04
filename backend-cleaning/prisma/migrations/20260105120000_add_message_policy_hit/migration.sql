-- CreateEnum
CREATE TYPE "PolicyLeakType" AS ENUM ('PHONE', 'EMAIL', 'LINK');

-- CreateEnum
CREATE TYPE "PolicyEnforcement" AS ENUM ('SANITIZED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "PolicySource" AS ENUM ('CHAT', 'DISPUTE');

-- CreateTable
CREATE TABLE "MessagePolicyHit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "chatId" TEXT,
    "bookingId" TEXT,
    "disputeId" TEXT,
    "type" "PolicyLeakType" NOT NULL,
    "hashedMatch" TEXT NOT NULL,
    "enforcement" "PolicyEnforcement" NOT NULL,
    "source" "PolicySource" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MessagePolicyHit_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "MessagePolicyHit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
    CONSTRAINT "MessagePolicyHit_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id"),
    CONSTRAINT "MessagePolicyHit_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id"),
    CONSTRAINT "MessagePolicyHit_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES "Dispute"("id")
);

-- CreateIndex
CREATE INDEX "MessagePolicyHit_userId_type_idx" ON "MessagePolicyHit" ("userId", "type");
