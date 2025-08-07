/*
  Warnings:

  - A unique constraint covering the columns `[fcmToken]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "fcmToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_fcmToken_key" ON "User"("fcmToken");
