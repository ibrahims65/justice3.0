-- CreateTable
CREATE TABLE "DisciplinaryAction" (
    "id" SERIAL NOT NULL,
    "bookingId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "infraction" TEXT NOT NULL,
    "sanction" TEXT NOT NULL,
    "notes" TEXT,

    CONSTRAINT "DisciplinaryAction_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DisciplinaryAction" ADD CONSTRAINT "DisciplinaryAction_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
