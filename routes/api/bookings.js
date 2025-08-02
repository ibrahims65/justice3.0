const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

router.get('/:id/counts', async (req, res) => {
  const { id } = req.params;
  const booking = await prisma.booking.findUnique({
    where: { id: parseInt(id) },
    include: {
      case: {
        include: {
          victims: true,
          evidence: true,
          witnesses: true,
          hearings: true,
        },
      },
    },
  });

  res.json({
    info: 1,
    victims: booking.case ? booking.case.victims.length : 0,
    evidence: booking.case ? booking.case.evidence.length : 0,
    witnesses: booking.case ? booking.case.witnesses.length : 0,
    hearings: booking.case ? booking.case.hearings.length : 0,
    notes: booking.officerNotes ? 1 : 0,
  });
});

router.get('/:id/victims', async (req, res) => {
  const { id } = req.params;
  const booking = await prisma.booking.findUnique({
    where: { id: parseInt(id) },
    include: { case: { include: { victims: true } } },
  });
  res.render('police/partials/victims-list', { victims: booking.case.victims });
});

router.get('/:id/evidence', async (req, res) => {
  const { id } = req.params;
  const booking = await prisma.booking.findUnique({
    where: { id: parseInt(id) },
    include: { case: { include: { evidence: true } } },
  });
  res.render('police/partials/evidence-list', { evidence: booking.case.evidence });
});

router.get('/:id/witnesses', async (req, res) => {
  const { id } = req.params;
  const booking = await prisma.booking.findUnique({
    where: { id: parseInt(id) },
    include: { case: { include: { witnesses: true } } },
  });
  res.render('police/partials/witnesses-list', { witnesses: booking.case.witnesses });
});

router.get('/:id/hearings', async (req, res) => {
  const { id } = req.params;
  const booking = await prisma.booking.findUnique({
    where: { id: parseInt(id) },
    include: { case: { include: { hearings: true } } },
  });
  res.render('police/partials/hearings-list', { hearings: booking.case.hearings });
});

module.exports = router;
