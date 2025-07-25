-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "custodyExpiresAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "RemandRequest" (
    "id" SERIAL NOT NULL,
    "bookingId" INTEGER NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "requestedDays" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "judgeId" INTEGER,
    "decisionDate" TIMESTAMP(3),

    CONSTRAINT "RemandRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReleaseRecord" (
    "id" SERIAL NOT NULL,
    "bookingId" INTEGER NOT NULL,
    "releasedBy" TEXT NOT NULL,
    "releaseDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "notes" TEXT,

    CONSTRAINT "ReleaseRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReleaseRecord_bookingId_key" ON "ReleaseRecord"("bookingId");

-- AddForeignKey
ALTER TABLE "RemandRequest" ADD CONSTRAINT "RemandRequest_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReleaseRecord" ADD CONSTRAINT "ReleaseRecord_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
