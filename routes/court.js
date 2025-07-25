const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { checkRole } = require('../middleware/auth');

router.get('/dashboard', checkRole(['Court']), async (req, res) => {
    const user = await prisma.user.findUnique({
        where: { id: req.session.userId },
        include: { role: true },
    });

  const hearings = await prisma.hearing.findMany({
    include: {
      case: true,
    },
  });

  const upcomingHearings = hearings.filter(h => !h.verdict);
  const casesAwaitingVerdict = hearings.filter(h => h.verdict === null);
  const recentVerdicts = hearings.filter(h => h.verdict !== null);

  res.render('court/dashboard', {
    user,
    page: '/court/dashboard',
    hearings,
    upcomingHearings,
    casesAwaitingVerdict,
    recentVerdicts,
  });
});

module.exports = router;
