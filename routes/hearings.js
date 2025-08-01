const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { checkRole } = require('../middleware/auth');

router.get('/new/:caseId', checkRole(['Court']), async (req, res) => {
  const courts = await prisma.court.findMany();
  res.render('hearings/new', { caseId: req.params.caseId, courts });
});

router.post('/', checkRole(['Court']), async (req, res) => {
  const { courtId, hearingDate, caseId } = req.body;
  try {
    const caseRecord = await prisma.case.findUnique({
      where: { id: parseInt(caseId) },
    });

    if (caseRecord.status !== 'Accepted') {
      req.flash('error', 'Cannot schedule a hearing until the charge-sheet has been approved by the prosecutor.');
      return res.redirect(`/cases/${caseId}`);
    }

    await prisma.hearing.create({
      data: {
        courtId: parseInt(courtId),
        hearingDate: new Date(hearingDate),
        caseId: parseInt(caseId),
      },
    });
    await prisma.actionHistory.create({
      data: {
        action: 'Hearing Scheduled',
        caseId: parseInt(caseId),
        userId: req.session.userId,
      },
    });
    res.redirect(`/cases/${caseId}`);
  } catch (error) {
    res.redirect(`/cases/${caseId}`);
  }
});

router.post('/:id/verdict', checkRole(['Court']), async (req, res) => {
  const { verdict } = req.body;
  const hearingId = parseInt(req.params.id);
  const hearing = await prisma.hearing.findUnique({
    where: { id: hearingId },
  });
  await prisma.hearing.update({
    where: { id: hearingId },
    data: { verdict },
  });
  await prisma.actionHistory.create({
    data: {
      action: `Verdict Recorded: ${verdict}`,
      caseId: hearing.caseId,
      userId: req.session.userId,
    },
  });

  if (verdict === 'Guilty') {
    const updatedCase = await prisma.case.update({
      where: { id: hearing.caseId },
      data: { status: 'Convicted' },
      include: { booking: true },
    });

    await prisma.booking.update({
      where: { id: updatedCase.booking.id },
      data: {
        incarcerationStartDate: new Date(),
        facilityName: 'Unassigned',
      },
    });
  }

  res.redirect(`/cases/${hearing.caseId}`);
});

module.exports = router;
