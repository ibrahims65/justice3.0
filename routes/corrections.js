const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { checkRole } = require('../middleware/auth');

router.get('/', checkRole(['Corrections']), async (req, res) => {
  const { search, facility } = req.query;
  let where = {
    status: 'Convicted',
  };

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Facility search is not directly supported by the new schema in this context.
  // This would require a more complex query joining through ArrestEvent and Person.
  // For now, we will omit this functionality.

  const cases = await prisma.case.findMany({
    where,
  });

  res.render('corrections/index', { cases });
});

router.get('/inmates/:caseId', checkRole(['Corrections']), async (req, res) => {
  const caseRecord = await prisma.case.findUnique({
    where: { id: parseInt(req.params.caseId) },
    include: {
      arrests: true,
      healthRecords: true,
    },
  });
  res.render('corrections/inmateProfile', { caseRecord });
});

router.get('/disciplinary/new/:caseId', checkRole(['Corrections']), (req, res) => {
  res.render('corrections/disciplinary/new', { caseId: req.params.caseId });
});

router.post('/disciplinary/:caseId', checkRole(['Corrections']), async (req, res) => {
  const { action, reason, date } = req.body;
  const caseId = parseInt(req.params.caseId);
  // The schema does not have a DisciplinaryAction model.
  // This functionality needs to be re-evaluated against the new schema.
  console.log('Disciplinary action submitted, but no model exists to store it.');
  res.redirect(`/corrections/inmates/${caseId}`);
});

router.get('/visitation/new/:caseId', checkRole(['Corrections']), (req, res) => {
  res.render('corrections/visitation/new', { caseId: req.params.caseId });
});

router.post('/visitation/:caseId', checkRole(['Corrections']), async (req, res) => {
  const { visitorName, visitDate, notes } = req.body;
  const caseId = parseInt(req.params.caseId);
  // The schema does not have a VisitationLog model.
  // This functionality needs to be re-evaluated against the new schema.
  console.log('Visitation log submitted, but no model exists to store it.');
  res.redirect(`/corrections/inmates/${caseId}`);
});

router.post('/inmates/:caseId', checkRole(['Corrections']), async (req, res) => {
  const { status, notes } = req.body;
  const caseId = parseInt(req.params.caseId);
  try {
    await prisma.case.update({
      where: { id: caseId },
      data: {
        status: status,
        description: notes, // Using description for notes for now
      },
    });
    res.redirect(`/corrections/inmates/${caseId}`);
  } catch (error) {
    res.redirect(`/corrections/inmates/${caseId}`);
  }
});

router.get('/dashboard', checkRole(['Corrections']), async (req, res) => {
  const totalInmates = await prisma.case.count({
    where: { status: 'Convicted' },
  });

  const recentReleases = await prisma.case.findMany({
    where: {
      status: 'Released',
      updatedAt: {
        gte: new Date(new Date().setDate(new Date().getDate() - 7)),
      },
    },
    take: 5,
  });

  res.render('corrections/dashboard', {
    user: req.session.user,
    totalInmates,
    recentReleases,
    page: '/corrections/dashboard',
  });
});

module.exports = router;
