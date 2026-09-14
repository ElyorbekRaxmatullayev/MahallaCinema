-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "bonusApplied" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "customerName" TEXT,
ADD COLUMN     "customerPhone" TEXT,
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "provider" TEXT,
ADD COLUMN     "providerChargeId" TEXT,
ADD COLUMN     "telegramChargeId" TEXT;
