const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { checkRole } = require('../middleware/auth');

router.get('/new/:caseId', checkRole(['Police', 'Corrections']), (req, res) => {
  res.render('medical/new', { caseId: req.params.caseId });
});

router.post('/', checkRole(['Police', 'Corrections']), async (req, res) => {
  const { condition, allergies, notes, caseId } = req.body;

  try {
    const medicalRecord = await prisma.medicalRecord.create({
      data: {
        condition,
        allergies,
        notes,
        caseId: parseInt(caseId),
      },
    });
    await prisma.actionHistory.create({
      data: {
        action: 'Medical Record Created',
        caseId: parseInt(caseId),
        userId: req.session.userId,
      },
    });
    res.redirect(`/cases/${caseId}`);
  } catch (error) {
    res.redirect(`/cases/${caseId}`);

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
