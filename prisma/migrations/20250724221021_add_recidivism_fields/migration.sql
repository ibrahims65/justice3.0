/*
  Warnings:

  - You are about to drop the column `deletedAt` on the `Booking` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Booking" DROP COLUMN "deletedAt",
ADD COLUMN     "releasedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Person" ADD COLUMN     "rebookedAt" TIMESTAMP(3);
