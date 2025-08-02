const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

router.get('/:id/counts', async (req, res) => {
  const { id } = req.params;
  const arrestEvent = await prisma.arrestEvent.findUnique({
    where: { id: parseInt(id) },
    include: {
      case: {
        include: {
          victims: true,
          evidences: true,
          witnesses: true,
          courtEvents: true,
        },
      },
    },
  });

  res.json({
    info: 1,
    victims: arrestEvent.case ? arrestEvent.case.victims.length : 0,
    evidence: arrestEvent.case ? arrestEvent.case.evidences.length : 0,
    witnesses: arrestEvent.case ? arrestEvent.case.witnesses.length : 0,
    hearings: arrestEvent.case ? arrestEvent.case.courtEvents.length : 0,
    notes: arrestEvent.notes ? 1 : 0,
  });
});

router.get('/:id/victims', async (req, res) => {
  const { id } = req.params;
  const arrestEvent = await prisma.arrestEvent.findUnique({
    where: { id: parseInt(id) },
    include: { case: { include: { victims: true } } },
  });
  res.render('police/partials/victims-list', { victims: arrestEvent.case.victims });
});

router.get('/:id/evidence', async (req, res) => {
  const { id } = req.params;
  const arrestEvent = await prisma.arrestEvent.findUnique({
    where: { id: parseInt(id) },
    include: { case: { include: { evidences: true } } },
  });
  res.render('police/partials/evidence-list', { evidence: arrestEvent.case.evidences });
});

router.get('/:id/witnesses', async (req, res) => {
  const { id } = req.params;
  const arrestEvent = await prisma.arrestEvent.findUnique({
    where: { id: parseInt(id) },
    include: { case: { include: { witnesses: true } } },
  });
  res.render('police/partials/witnesses-list', { witnesses: arrestEvent.case.witnesses });
});

router.get('/:id/hearings', async (req, res) => {
  const { id } = req.params;
  const arrestEvent = await prisma.arrestEvent.findUnique({
    where: { id: parseInt(id) },
    include: { case: { include: { courtEvents: true } } },
  });
  res.render('police/partials/hearings-list', { hearings: arrestEvent.case.courtEvents });
});

module.exports = router;
