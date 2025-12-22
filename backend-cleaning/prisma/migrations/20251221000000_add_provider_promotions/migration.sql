-- CreateTable
CREATE TABLE "ProviderPromotion" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "title" TEXT,
    "percentOff" INTEGER NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT FALSE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProviderPromotion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProviderPromotion_providerId_idx" ON "ProviderPromotion"("providerId");

-- AddForeignKey
ALTER TABLE "ProviderPromotion" ADD FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;
