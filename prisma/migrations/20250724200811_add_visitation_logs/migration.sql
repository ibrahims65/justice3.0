-- CreateTable
CREATE TABLE "VisitationLog" (
    "id" SERIAL NOT NULL,
    "bookingId" INTEGER NOT NULL,
    "visitorName" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,

    CONSTRAINT "VisitationLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "VisitationLog" ADD CONSTRAINT "VisitationLog_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
