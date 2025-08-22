-- CreateEnum
CREATE TYPE "MissionAudience" AS ENUM ('CLIENT', 'PROVIDER');

-- CreateEnum
CREATE TYPE "MissionKind" AS ENUM ('COUNT_EVENT', 'STREAK_DAYS', 'WITHIN_WINDOW');

-- CreateEnum
CREATE TYPE "RewardType" AS ENUM ('COUPON', 'POINTS');

-- CreateEnum
CREATE TYPE "MissionStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CLAIMED');

-- CreateTable
CREATE TABLE "Mission" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "audience" "MissionAudience" NOT NULL DEFAULT 'CLIENT',
    "kind" "MissionKind" NOT NULL,
    "eventName" TEXT NOT NULL,
    "targetValue" INTEGER NOT NULL,
    "timeWindowDays" INTEGER,
    "rewardType" "RewardType" NOT NULL,
    "rewardValue" INTEGER NOT NULL,
    "couponTemplateId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Mission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MissionProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "currentValue" INTEGER NOT NULL DEFAULT 0,
    "status" "MissionStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastEventAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "claimedAt" TIMESTAMP(3),

    CONSTRAINT "MissionProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MissionEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MissionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Mission_code_key" ON "Mission"("code");

-- CreateIndex
CREATE UNIQUE INDEX "MissionProgress_userId_missionId_key" ON "MissionProgress"("userId", "missionId");

-- AddForeignKey
ALTER TABLE "MissionProgress" ADD CONSTRAINT "MissionProgress_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionProgress" ADD CONSTRAINT "MissionProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionEvent" ADD CONSTRAINT "MissionEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
