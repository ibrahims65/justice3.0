const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { checkRole } = require('../middleware/auth');

router.get('/new/:bookingId', checkRole(['Police', 'Corrections']), (req, res) => {
  res.render('medical/new', { bookingId: req.params.bookingId });
});

router.post('/', checkRole(['Police', 'Corrections']), async (req, res) => {
  const { condition, allergies, notes, bookingId } = req.body;
  try {
    const medicalRecord = await prisma.medicalRecord.create({
      data: {
        condition,
        allergies,
        notes,
        bookingId: parseInt(bookingId),
      },
    });
    const booking = await prisma.booking.findUnique({ where: { id: parseInt(bookingId) } });
    await prisma.actionHistory.create({
      data: {
        action: 'Medical Record Created',
        caseId: booking.case.id,
        userId: req.session.userId,
      },
    });
    res.redirect(`/people/${booking.personId}`);
  } catch (error) {
    const booking = await prisma.booking.findUnique({ where: { id: parseInt(bookingId) } });
    res.redirect(`/people/${booking.personId}`);
  }
});

router.get('/:medicalId/medications/new', checkRole(['Corrections']), (req, res) => {
  res.render('medical/medications/new', { medicalId: req.params.medicalId });
});

router.post('/:medicalId/medications', checkRole(['Corrections']), async (req, res) => {
  const { medication, dosage, frequency, startDate, endDate } = req.body;
  const { medicalId } = req.params;
  try {
    await prisma.medicationSchedule.create({
      data: {
        medication,
        dosage,
        frequency,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        medicalId: parseInt(medicalId),
      },
    });
    const medicalRecord = await prisma.medicalRecord.findUnique({ where: { id: parseInt(medicalId) }, include: { booking: true } });
    await prisma.actionHistory.create({
      data: {
        action: 'Medication Schedule Added',
        caseId: medicalRecord.booking.case.id,
        userId: req.session.userId,
      },
    });
    res.redirect(`/corrections/inmates/${medicalRecord.booking.personId}`);
  } catch (error) {
    const medicalRecord = await prisma.medicalRecord.findUnique({ where: { id: parseInt(medicalId) }, include: { booking: true } });
    res.redirect(`/corrections/inmates/${medicalRecord.booking.personId}`);
  }
});

module.exports = router;
