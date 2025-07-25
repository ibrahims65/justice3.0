const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { checkRole } = require('../middleware/auth');

router.get('/', checkRole(['Police']), async (req, res) => {
  const warrants = await prisma.warrant.findMany({
    where: { status: 'Issued' },
    include: { case: { include: { booking: { include: { person: true } } } } },
  });
  res.render('warrants/index', { warrants });
});

router.post('/', checkRole(['Court']), async (req, res) => {
  const { details, expiresAt, caseId } = req.body;
  try {
    await prisma.warrant.create({
      data: {
        details,
        status: 'Issued',
        expiresAt: new Date(expiresAt),
        caseId: parseInt(caseId),
      },
    });
    await prisma.actionHistory.create({
      data: {
        action: 'Warrant Issued',
        caseId: parseInt(caseId),
        userId: req.session.userId,
      },
    });
    res.redirect(`/cases/${caseId}`);
  } catch (error) {
    res.redirect(`/cases/${caseId}`);
  }
});

router.post('/:id/execute', checkRole(['Police']), async (req, res) => {
  const warrantId = parseInt(req.params.id);
  const warrant = await prisma.warrant.findUnique({ where: { id: warrantId } });
  await prisma.warrant.update({
    where: { id: warrantId },
    data: { status: 'Executed' },
  });
  await prisma.actionHistory.create({
    data: {
      action: 'Warrant Executed',
      caseId: warrant.caseId,
      userId: req.session.userId,
    },
  });
  res.redirect('/warrants');
});

module.exports = router;
