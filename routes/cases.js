const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { checkRole } = require('../middleware/auth');
const { createNotification } = require('./notifications');

router.get('/new/:bookingId', checkRole(['Police']), async (req, res) => {
  const booking = await prisma.booking.findUnique({
    where: { id: parseInt(req.params.bookingId) },
    include: { person: true },
  });
  res.render('cases/new', { booking });
});

router.post('/', checkRole(['Police']), async (req, res) => {
  const { bookingId, caseNumber, crimeSceneDetails, interrogationLogs, preliminaryFindings } = req.body;
  try {
    const newCase = await prisma.case.create({
      data: {
        bookingId: parseInt(bookingId),
        caseNumber,
        status: 'New Arrest',
        crimeSceneDetails,
        interrogationLogs,
        preliminaryFindings,
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
      booking: {
        include: {
          person: true,
        },
      },
      evidence: true,
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
      comments: {
        include: {
          user: true,
        },
      },
      documents: {
        include: {
          user: true,
        },
      },
    },
  });
  const user = await prisma.user.findUnique({
    where: { id: req.session.userId },
    include: { role: true },
  });
  if (user.role.name === 'Prosecutor') {
    const prosecutors = await prisma.user.findMany({ where: { role: { name: 'Prosecutor' } } });
    res.render('prosecutor/case', { caseRecord, user, prosecutors });
  } else if (user.role.name === 'Court') {
    res.render('court/case', { caseRecord, user });
  } else {
    res.render('cases/show', { caseRecord, user });
  }
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

router.post('/:id/assign', checkRole(['Prosecutor']), async (req, res) => {
  const caseId = parseInt(req.params.id);
  const { assigneeId } = req.body;
  try {
    await prisma.case.update({
      where: { id: caseId },
      data: {
        assigneeId: parseInt(assigneeId),
      },
    });
    res.redirect(`/cases/${caseId}`);
  } catch (error) {
    res.redirect(`/cases/${caseId}`);
  }
});

router.post('/:id/comments', checkRole(['Prosecutor', 'Court']), async (req, res) => {
  const caseId = parseInt(req.params.id);
  const { content } = req.body;
  const userId = req.session.userId;

  try {
    await prisma.comment.create({
      data: {
        content,
        caseId: caseId,
        userId: userId,
      },
    });
    res.redirect(`/cases/${caseId}`);
  } catch (error) {
    res.redirect(`/cases/${caseId}`);
  }
});

const upload = require('../middleware/upload');

router.post('/:id/documents', checkRole(['Prosecutor', 'Court']), upload.single('document'), async (req, res) => {
    const caseId = parseInt(req.params.id);
    const { originalname, path } = req.file;
    const userId = req.session.userId;

    try {
        await prisma.document.create({
            data: {
                name: originalname,
                url: `/${path}`,
                caseId: caseId,
                userId: userId,
            },
        });
        res.redirect(`/cases/${caseId}`);
    } catch (error) {
        res.redirect(`/cases/${caseId}`);
    }
});

module.exports = router;
