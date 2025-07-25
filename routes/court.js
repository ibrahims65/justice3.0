const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { checkRole } = require('../middleware/auth');

router.get('/', checkRole(['Court']), async (req, res) => {
  const cases = await prisma.case.findMany({
    where: {
      status: {
        in: ['Submitted to Court', 'Accepted'],
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

  res.render('court/dashboard', {
    user: req.user,
    cases,
    page: '/court/dashboard',
  });
});

module.exports = router;
