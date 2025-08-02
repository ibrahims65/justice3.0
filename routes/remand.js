const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { checkRole } = require('../middleware/auth');

router.post('/', checkRole(['Police']), async (req, res) => {
  const { caseId, reason, duration } = req.body;
  await prisma.bailRemand.create({
    data: {
      caseId: parseInt(caseId),
      decisionType: 'Remand',
      decisionDate: new Date(),
      remandStartDate: new Date(),
      duration: parseInt(duration),
      courtApprovalFlag: false,
    },
  });
  res.redirect(`/cases/${caseId}`);
});

router.get('/', checkRole(['Court']), async (req, res) => {
  const requests = await prisma.bailRemand.findMany({
    where: { courtApprovalFlag: false },
    include: { case: true },
  });
  res.render('remand/index', { requests });
});

router.post('/:id/approve', checkRole(['Court']), async (req, res) => {
  const requestId = parseInt(req.params.id);
  const remand = await prisma.bailRemand.update({
    where: { id: requestId },
    data: {
      courtApprovalFlag: true,
      approvedBy: req.session.userId.toString(),
      approvalDate: new Date(),
    },
  });
  res.redirect('/remand');
});

router.post('/:id/reject', checkRole(['Court']), async (req, res) => {
  const requestId = parseInt(req.params.id);
  await prisma.bailRemand.update({
    where: { id: requestId },
    data: {
        courtApprovalFlag: false,
        // We may want a different way to signify rejection
    },
  });
  res.redirect('/remand');
});

module.exports = router;
