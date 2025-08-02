const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { checkRole } = require('../middleware/auth');


router.get('/prosecutor', checkRole(['Prosecutor']), async (req, res) => {
  const user = req.session.user;

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

  res.render('dashboard', {
    user,
    cases,
    remandRequests,
    upcomingHearings,
    page: '/dashboard/prosecutor',
    breadcrumbs
  });
});

router.get('/court', checkRole(['Court']), async (req, res) => {
  const user = req.session.user;

  const hearings = await prisma.hearing.findMany({
    where: {
      hearingDate: {
        gte: new Date(),
      },
    },
    include: {
      case: true,
      court: true,
    },
  });

  const casesToAssign = await prisma.case.findMany({
    where: {
      status: 'Submitted to Court',
      hearings: {
        none: {},
      },
    },
  });

  const warrantsToApprove = await prisma.warrant.findMany({
    where: {
      status: 'Issued',
    },
  });

  const breadcrumbs = [
    { name: 'Dashboard', url: '/dashboard/court' }
  ];

  res.render('dashboard', {
    user,
    hearings,
    casesToAssign,
    warrantsToApprove,
    page: '/dashboard/court',
    breadcrumbs
  });
});


module.exports = router;
