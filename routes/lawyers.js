const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { checkRole } = require('../middleware/auth');

router.get('/new/:personId', checkRole(['Police', 'Prosecutor', 'Court']), (req, res) => {
  res.render('lawyers/new', { personId: req.params.personId });
});

router.post('/', checkRole(['Police', 'Prosecutor', 'Court']), async (req, res) => {
  const { name, firm, license, personId } = req.body;
  try {
    await prisma.lawyer.create({
      data: {
        name,
        firm,
        license,
        personId: parseInt(personId),
      },
    });
    res.redirect(`/people/${personId}`);
  } catch (error) {
    res.redirect(`/people/${personId}`);
  }
});

router.get('/:lawyerId/visits/new', checkRole(['Police', 'Prosecutor', 'Court']), (req, res) => {
  res.render('lawyers/visits/new', { lawyerId: req.params.lawyerId });
});

router.post('/:lawyerId/visits', checkRole(['Police', 'Prosecutor', 'Court']), async (req, res) => {
  const { notes } = req.body;
  const { lawyerId } = req.params;
  try {
    const lawyer = await prisma.lawyer.findUnique({ where: { id: parseInt(lawyerId) } });
    await prisma.lawyerVisit.create({
      data: {
        notes,
        lawyerId: parseInt(lawyerId),
      },
    });
    res.redirect(`/people/${lawyer.personId}`);
  } catch (error) {
    const lawyer = await prisma.lawyer.findUnique({ where: { id: parseInt(lawyerId) } });
    res.redirect(`/people/${lawyer.personId}`);
  }
});

module.exports = router;
