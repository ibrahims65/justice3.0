const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const PDFDocument = require('pdfkit-table');
const { createPdf, addBarcode, addFooter } = require('../services/printService');

router.get('/case/:id', async (req, res) => {
  const caseRecord = await prisma.case.findUnique({
    where: { id: parseInt(req.params.id) },
    include: {
      booking: { include: { person: true } },
      evidence: true,
      witnesses: true,
      victims: true,
    },
  });

  const doc = new PDFDocument();
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=case-${caseRecord.caseNumber}.pdf`);
  doc.pipe(res);

  createPdf(doc, `Case Summary: ${caseRecord.caseNumber}`);
  await addBarcode(doc, caseRecord.caseNumber);

  doc.font('Courier');
  doc.fontSize(12).text('Defendant Details', { underline: true });
  doc.fontSize(12).text(`Name: ${caseRecord.booking.person.name}`);
  doc.text(`Date of Birth: ${caseRecord.booking.person.dob.toDateString()}`);

  doc.moveDown();
  doc.fontSize(18).text('Charges', { underline: true });
  doc.fontSize(12).text(caseRecord.booking.charges);

  doc.moveDown();
  doc.fontSize(18).text('Evidence', { underline: true });
  caseRecord.evidence.forEach(item => {
    doc.fontSize(12).text(`- ${item.description}`);
  });

  doc.moveDown();
  doc.fontSize(18).text('Witnesses', { underline: true });
  caseRecord.witnesses.forEach(witness => {
    doc.fontSize(12).text(`- ${witness.name}: ${witness.statement}`);
  });

  doc.moveDown();
  doc.fontSize(18).text('Victims', { underline: true });
  caseRecord.victims.forEach(victim => {
    doc.fontSize(12).text(`- ${victim.name}: ${victim.statement}`);
  });

  addFooter(doc);
  doc.end();
});

router.get('/wrapsheet/:personId', async (req, res) => {
  const person = await prisma.person.findUnique({
    where: { id: parseInt(req.params.personId) },
    include: {
      bookings: {
        include: {
          case: {
            include: {
              hearings: true,
            },
          },
        },
      },
    },
  });

  const doc = new PDFDocument();
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=wrapsheet-${person.name}.pdf`);
  doc.pipe(res);

  createPdf(doc, 'Criminal Wrap Sheet', person.name);

  doc.font('Courier');
  const table = {
    headers: ['Booking Date', 'Charges', 'Case Number', 'Verdict'],
    rows: [],
  };

  for (const booking of person.bookings) {
    const row = [
      booking.bookingDate.toLocaleString(),
      booking.charges,
      booking.case ? booking.case.caseNumber : 'N/A',
      booking.case ? (booking.case.hearings[0]?.verdict || 'N/A') : 'N/A',
    ];
    table.rows.push(row);
  }

  doc.table(table, {
    prepareHeader: () => doc.font('Courier-Bold'),
    prepareRow: (row, i) => doc.font('Courier').fontSize(12),
  });

  addFooter(doc);
  doc.end();
});

module.exports = router;
