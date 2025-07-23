const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { checkRole } = require('../middleware/auth');

router.post('/', checkRole(['Prosecutor']), async (req, res) => {
  const { offer, caseId } = req.body;
  try {
    await prisma.pleaBargain.create({
      data: {
        offer,
        status: 'Proposed',
        caseId: parseInt(caseId),
      },
    });
    await prisma.actionHistory.create({
      data: {
        action: 'Plea Bargain Proposed',
        caseId: parseInt(caseId),
        userId: req.session.userId,
      },
    });
    res.redirect(`/cases/${caseId}`);
  } catch (error) {
    res.redirect(`/cases/${caseId}`);
  }
});

router.post('/:id/accept', checkRole(['Court']), async (req, res) => {
  const pleaBargainId = parseInt(req.params.id);
  const pleaBargain = await prisma.pleaBargain.findUnique({ where: { id: pleaBargainId } });
  await prisma.pleaBargain.update({
    where: { id: pleaBargainId },
    data: { status: 'Accepted' },
  });
  await prisma.case.update({
    where: { id: pleaBargain.caseId },
    data: { status: 'Plea Bargain Accepted' },
  });
  await prisma.actionHistory.create({
    data: {
      action: 'Plea Bargain Accepted',
      caseId: pleaBargain.caseId,
      userId: req.session.userId,
    },
  });
  res.redirect(`/cases/${pleaBargain.caseId}`);
});

router.post('/:id/reject', checkRole(['Court']), async (req, res) => {
  const pleaBargainId = parseInt(req.params.id);
  const pleaBargain = await prisma.pleaBargain.findUnique({ where: { id: pleaBargainId } });
  await prisma.pleaBargain.update({
    where: { id: pleaBargainId },
    data: { status: 'Rejected' },
  });
  await prisma.actionHistory.create({
    data: {
      action: 'Plea Bargain Rejected',
      caseId: pleaBargain.caseId,
      userId: req.session.userId,
    },
  });
  res.redirect(`/cases/${pleaBargain.caseId}`);
});

module.exports = router;
