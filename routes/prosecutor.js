const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { checkRole } = require('../middleware/auth');

router.post('/cases/:caseId/notes', checkRole(['Prosecutor', 'Court']), async (req, res) => {
  const { caseId } = req.params;
  const { content } = req.body;
  const userId = req.session.userId;

  try {
    await prisma.prosecutorNote.create({
      data: {
        content,
        caseId: parseInt(caseId),
        userId,
      },
    });
    res.redirect(`/cases/${caseId}`);
  } catch (error) {
    res.redirect(`/cases/${caseId}`);
  }
});

router.get('/dashboard/prosecutor', checkRole(['Prosecutor']), async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.session.userId },
    include: { role: true },
  });

  const cases = await prisma.case.findMany({
    where: {
      actions: {
        some: {
          userId: user.id,
        },
      },
    },
    include: {
      booking: {
        include: {
          person: true,
        },
      },
    },
  });

  const remandRequests = await prisma.remandRequest.findMany({
    where: { status: 'pending' },
    include: {
      booking: {
        include: {
          person: true,
          case: true,
        },
      },
    },
  });

  const upcomingHearings = await prisma.hearing.findMany({
    where: {
      case: {
        actions: {
          some: {
            userId: user.id,
          },
        },
      },
      hearingDate: {
        gte: new Date(),
      },
    },
  });

  const breadcrumbs = [
    { name: 'Dashboard', url: '/dashboard/prosecutor' }
  ];
  res.render('prosecutor/dashboard', {
    user,
    cases,
    remandRequests,
    upcomingHearings,
    page: '/prosecutor/dashboard',
    breadcrumbs
  });
});

module.exports = router;
