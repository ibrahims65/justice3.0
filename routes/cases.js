const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { checkRole } = require('../middleware/auth');

router.get('/new/:inmateId', checkRole(['Police']), async (req, res) => {
  const inmate = await prisma.inmate.findUnique({
    where: { id: parseInt(req.params.inmateId) },
  });
  res.render('cases/new', { inmate });
});

router.post('/', checkRole(['Police']), async (req, res) => {
  const { caseNumber, status, inmateId } = req.body;
  try {
    const newCase = await prisma.case.create({
      data: {
        caseNumber,
        status,
        inmateId: parseInt(inmateId),
      },
    });
    await prisma.actionHistory.create({
      data: {
        action: 'Case Created',
        caseId: newCase.id,
        userId: req.session.userId,
      },
    });
    res.redirect(`/cases/${newCase.id}`);
  } catch (error) {
    res.redirect(`/inmates/${inmateId}`);
  }
});

router.get('/:id', async (req, res) => {
  const caseRecord = await prisma.case.findUnique({
    where: { id: parseInt(req.params.id) },
    include: {
      inmate: true,
      evidence: true,
      witnesses: true,
      hearings: true,
      actions: {
        include: {
          user: true,
        },
      },
    },
  });
  res.render('cases/show', { caseRecord, user: req.session });
});

router.post('/:id/submit', checkRole(['Police']), async (req, res) => {
  const caseId = parseInt(req.params.id);
  await prisma.case.update({
    where: { id: caseId },
    data: { status: 'Prosecutor Review' },
  });
  await prisma.actionHistory.create({
    data: {
      action: 'Submitted to Prosecutor',
      caseId: caseId,
      userId: req.session.userId,
    },
  });
  res.redirect(`/cases/${caseId}`);
});

router.post('/:id/accept', checkRole(['Prosecutor']), async (req, res) => {
  const caseId = parseInt(req.params.id);
  await prisma.case.update({
    where: { id: caseId },
    data: { status: 'Accepted' },
  });
  await prisma.actionHistory.create({
    data: {
      action: 'Case Accepted',
      caseId: caseId,
      userId: req.session.userId,
    },
  });
  res.redirect(`/cases/${caseId}`);
});

router.post('/:id/reject', checkRole(['Prosecutor']), async (req, res) => {
  const caseId = parseInt(req.params.id);
  await prisma.case.update({
    where: { id: caseId },
    data: { status: 'Rejected' },
  });
  await prisma.actionHistory.create({
    data: {
      action: 'Case Rejected',
      caseId: caseId,
      userId: req.session.userId,
    },
  });
  res.redirect(`/cases/${caseId}`);
});

router.post('/:id/request-info', checkRole(['Prosecutor']), async (req, res) => {
  const caseId = parseInt(req.params.id);
  await prisma.case.update({
    where: { id: caseId },
    data: { status: 'Information Requested' },
  });
  await prisma.actionHistory.create({
    data: {
      action: 'Information Requested',
      caseId: caseId,
      userId: req.session.userId,
    },
  });
  res.redirect(`/cases/${caseId}`);
});

module.exports = router;
