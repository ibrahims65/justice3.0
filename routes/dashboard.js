const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { checkRole } = require('../middleware/auth');

router.get('/police', checkRole(['Police']), async (req, res) => {
  const user = req.session.user;

  const bookingsToday = await prisma.booking.count({
    where: {
      bookingDate: {
        gte: new Date(new Date().setHours(0, 0, 0, 0)),
      },
    },
  });

  const overdueHolds = await prisma.booking.count({
    where: {
      bookingDate: {
        lt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
      status: 'New Arrest',
    },
  });

  const pendingSubmissions = await prisma.booking.count({
    where: {
      case: {
        status: 'New Arrest',
      },
    },
  });

  const inCustody = await prisma.booking.count({
    where: {
      status: 'In-Custody',
    },
  });


  const breadcrumbs = [
    { name: 'Dashboard', url: '/dashboard/police' }
  ];

  const newAssignments = 5; // dummy data
  const totalOpenCases = 15; // dummy data
  const warrantsPending = 2; // dummy data
  const { sortBy = 'updated', filterBy = null } = req.query;
  let caseWhere = {
    actions: {
      some: {
        userId: user.id,
      },
    },
  };

  if (filterBy) {
    caseWhere.status = filterBy;
  }

  let caseOrderBy = {};
  if (sortBy === 'priority') {
    caseOrderBy = { priority: 'desc' };
  } else if (sortBy === 'date') {
    caseOrderBy = { createdAt: 'desc' };
  } else {
    caseOrderBy = { updatedAt: 'desc' };
  }

  const cases = await prisma.case.findMany({
    where: caseWhere,
    orderBy: caseOrderBy,
    include: {
      booking: {
        include: {
          person: true,
        },
      },
    },
  });

  const recentActivity = await prisma.actionHistory.findMany({
      where: {
          user: {
              role: {
                  name: 'Police',
              },
          },
      },
      orderBy: {
          timestamp: 'desc',
      },
      take: 10,
      include: {
          case: true,
          user: true,
      },
  });

  const upcomingEvents = await prisma.hearing.findMany({
      where: {
          hearingDate: {
              gte: new Date(),
              lte: new Date(new Date().setDate(new Date().getDate() + 7)),
          },
      },
      include: {
          case: true,
      },
  });


  res.render('dashboard', {
    user,
    bookingsToday,
    overdueHolds,
    pendingSubmissions,
    inCustody,
    recentActivity,
    page: '/dashboard/police',
    breadcrumbs,
    newAssignments,
    totalOpenCases,
    warrantsPending,
    cases,
    upcomingEvents,
    sortBy,
    filterBy
  });
});

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

router.get('/', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  const role = req.session.user.role; // Correctly access the role string
  switch (role) {
    case 'Police':
      // The police dashboard is at /dashboard/police, not /police/dashboard
      return res.redirect('/dashboard/police');
    case 'Prosecutor':
      return res.redirect('/prosecutor/dashboard');
    case 'Court':
      return res.redirect('/court/dashboard');
    case 'Corrections':
      return res.redirect('/corrections/dashboard');
    default:
      res.send(`Welcome, ${req.session.user?.username || 'Guest'}`);
  }
});

module.exports = router;
