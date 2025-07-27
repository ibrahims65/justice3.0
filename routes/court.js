const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { checkRole } = require('../middleware/auth');

router.get('/dashboard/court', checkRole(['Court']), async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.session.userId },
    include: { role: true },
  });

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
  res.render('court/dashboard', {
    user,
    hearings,
    casesToAssign,
    warrantsToApprove,
    page: '/court/dashboard',
    breadcrumbs
  });
});

module.exports = router;
