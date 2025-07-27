/*
  Warnings:

  - You are about to drop the column `investigatorId` on the `Investigation` table. All the data in the column will be lost.
  - You are about to drop the `Investigator` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `investigatorBadgeNumber` to the `Investigation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `investigatorName` to the `Investigation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `investigatorRank` to the `Investigation` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Investigation" DROP CONSTRAINT "Investigation_investigatorId_fkey";

-- AlterTable
ALTER TABLE "Investigation" DROP COLUMN "investigatorId",
ADD COLUMN     "investigatorBadgeNumber" TEXT NOT NULL,
ADD COLUMN     "investigatorName" TEXT NOT NULL,
ADD COLUMN     "investigatorRank" TEXT NOT NULL;

-- DropTable
DROP TABLE "Investigator";
