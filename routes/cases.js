const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { checkRole } = require('../middleware/authJwt');
const { createNotification } = require('./notifications');

router.get('/new/:arrestId', checkRole(['Police']), async (req, res) => {
  const arrestEvent = await prisma.arrestEvent.findUnique({
    where: { id: parseInt(req.params.arrestId) },
  });
  res.render('cases/new', { arrestEvent });
});

router.post('/', checkRole(['Police']), async (req, res) => {
  const { arrestId, title, description, status } = req.body;
  try {
    const newCase = await prisma.case.create({
      data: {
        title,
        description,
        status,
        arrests: {
            connect: { id: parseInt(arrestId) }
        }
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
    res.redirect(`/people`);
  }
});

router.get('/:id', async (req, res) => {
  const caseRecord = await prisma.case.findFirst({
    where: { id: parseInt(req.params.id) },
    include: {
      arrests: true,
      evidences: true,
      witnesses: true,
      hearings: {
        include: {
          court: true,
        },
      },
      victims: true,
      actions: {
        include: {
          user: true,
        },
      },
      prosecutorNotes: {
        include: {
          user: true,
        },
      },
      pleaBargains: true,
      investigations: {
        include: {
          media: true,
        },
      },
      bailDecisions: true,
      warrants: true,
      searchWarrants: true,
      lawyers: {
        include: {
          visits: true,
        },
      },
      medicalRecords: {
        include: {
          medications: true,
        },
      },
    },
  });
  const user = await prisma.user.findUnique({
    where: { id: req.session.userId },
    include: { role: true },
  });
  res.render('cases/show', { caseRecord, user });
});

router.post('/:id/delete', checkRole(['Police']), async (req, res) => {
  await prisma.case.update({
    where: { id: parseInt(req.params.id) },
    data: { deletedAt: new Date() },
  });
  res.redirect('/dashboard');
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
  const prosecutors = await prisma.user.findMany({ where: { role: { name: 'Prosecutor' } } });
  for (const prosecutor of prosecutors) {
    await createNotification(prosecutor.id, `Case #${caseId} has been submitted for review.`);
  }
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
  const { notes } = req.body;
  await prisma.case.update({
    where: { id: caseId },
    data: { status: 'Rejected' },
  });
  await prisma.actionHistory.create({
    data: {
      action: 'Case Rejected',
      notes,
      caseId: caseId,
      userId: req.session.userId,
    },
  });
  res.redirect(`/cases/${caseId}`);
});

router.post('/:id/request-info', checkRole(['Prosecutor']), async (req, res) => {
  const caseId = parseInt(req.params.id);
  const { notes } = req.body;
  await prisma.case.update({
    where: { id: caseId },
    data: { status: 'Information Requested' },
  });
  await prisma.actionHistory.create({
    data: {
      action: 'Information Requested',
      notes,
      caseId: caseId,
      userId: req.session.userId,
    },
  });
  res.redirect(`/cases/${caseId}`);
});

router.post('/:id/submit-to-court', checkRole(['Prosecutor']), async (req, res) => {
  const caseId = parseInt(req.params.id);
  await prisma.case.update({
    where: { id: caseId },
    data: { status: 'Submitted to Court' },
  });
  await prisma.actionHistory.create({
    data: {
      action: 'Submitted to Court',
      caseId: caseId,
      userId: req.session.userId,
    },
  });
  res.redirect(`/cases/${caseId}`);
});

router.post('/:id/assign', checkRole(['Court']), async (req, res) => {
  const caseId = parseInt(req.params.id);
  // In a real app, you'd assign to a specific judge. Here, we'll just update status.
  await prisma.case.update({
    where: { id: caseId },
    data: { status: 'Assigned' },
  });
  await prisma.actionHistory.create({
    data: {
      action: 'Case Assigned',
      caseId: caseId,
      userId: req.session.userId,
    },
  });
  res.redirect('/dashboard');
});

router.post('/:id/send-back', checkRole(['Court']), async (req, res) => {
  const caseId = parseInt(req.params.id);
  const { notes } = req.body;
  await prisma.case.update({
    where: { id: caseId },
    data: { status: 'Sent Back to Prosecutor' },
  });
  await prisma.actionHistory.create({
    data: {
      action: 'Sent Back to Prosecutor',
      notes,
      caseId: caseId,
      userId: req.session.userId,
    },
  });
  res.redirect(`/cases/${caseId}`);
});

router.get('/:id/edit', checkRole(['Police']), async (req, res) => {
  const caseRecord = await prisma.case.findUnique({
    where: { id: parseInt(req.params.id) },
  });
  res.render('cases/edit', { caseRecord });
});

router.post('/:id', checkRole(['Police']), async (req, res) => {
  const { crimeSceneDetails, interrogationLogs, preliminaryFindings } = req.body;
  const caseId = parseInt(req.params.id);
  try {
    await prisma.case.update({
      where: { id: caseId },
      data: {
        crimeSceneDetails,
        interrogationLogs,
        preliminaryFindings,
      },
    });
    await prisma.actionHistory.create({
      data: {
        action: 'Case Updated',
        caseId: caseId,
        userId: req.session.userId,
      },
    });
    res.redirect(`/cases/${caseId}`);
  } catch (error) {
    res.redirect(`/cases/${caseId}/edit`);
  }
});

router.post('/:id/evaluation', checkRole(['Prosecutor']), async (req, res) => {
  const { recommendedCharges, riskAssessment, evidenceStrengthRating } = req.body;
  const caseId = parseInt(req.params.id);
  try {
    await prisma.case.update({
      where: { id: caseId },
      data: {
        recommendedCharges,
        riskAssessment,
        evidenceStrengthRating: parseInt(evidenceStrengthRating),
      },
    });
    await prisma.actionHistory.create({
      data: {
        action: 'Case Evaluation Updated',
        caseId: caseId,
        userId: req.session.userId,
      },
    });
    res.redirect(`/cases/${caseId}`);
  } catch (error) {
    res.redirect(`/cases/${caseId}`);
  }
});

router.post('/:caseId/victims', async (req, res) => {
  const caseId = parseInt(req.params.caseId, 10);
  const { name, statement } = req.body;
  await prisma.victim.create({
    data: {
      name,
      statement,
      caseId,
      dateOfBirth: new Date(),
      contactInfo: 'N/A',
      gender: 'N/A',
      address: 'N/A',
    },
  });
  res.redirect(`/cases/${caseId}`);
});

router.post('/:caseId/evidence', async (req, res) => {
  const caseId = parseInt(req.params.caseId, 10);
  const { type, description } = req.body;
  await prisma.evidence.create({
    data: {
      type,
      description,
      caseId,
      collectedAt: new Date(),
      fileUpload: '',
      chainOfCustodyStatus: 'Collected',
      storageLocation: 'Evidence Room',
    },
  });
  res.redirect(`/cases/${caseId}`);
});

router.post('/:caseId/witnesses', async (req, res) => {
    const caseId = parseInt(req.params.caseId, 10);
    const { name, testimony } = req.body;
    await prisma.witness.create({
        data: {
            name,
            testimony,
            caseId,
            contactInfo: 'N/A',
            anonymityFlag: false,
            dateInterviewed: new Date(),
        },
    });
    res.redirect(`/cases/${caseId}`);
});

router.post('/:caseId/hearings', async (req, res) => {
    const caseId = parseInt(req.params.caseId, 10);
    const { dateTime, outcome } = req.body;
    await prisma.courtEvent.create({
        data: {
            dateTime: new Date(dateTime),
            outcome,
            caseId,
            eventType: 'Hearing',
            courtLocation: 'N/A',
            presidingJudge: 'N/A',
        },
    });
    res.redirect(`/cases/${caseId}`);
});

router.post('/:arrestId/notes', async (req, res) => {
    const arrestId = parseInt(req.params.arrestId, 10);
    const { notes } = req.body;
    const arrestEvent = await prisma.arrestEvent.update({
        where: { id: arrestId },
        data: { notes },
    });
    res.redirect(`/cases/${arrestEvent.caseId}`);
});

module.exports = router;
