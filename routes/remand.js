const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { checkRole } = require('../middleware/auth');

router.post('/', checkRole(['Police']), async (req, res) => {
  const { bookingId, reason, requestedDays } = req.body;
  await prisma.remandRequest.create({
    data: {
      bookingId: parseInt(bookingId),
      requestedBy: req.session.userId.toString(),
      reason,
      requestedDays: parseInt(requestedDays),
      status: 'pending',
    },
  });
  res.redirect(`/people/${(await prisma.booking.findUnique({ where: { id: parseInt(bookingId) } })).personId}`);
});

router.get('/', checkRole(['Court']), async (req, res) => {
  const requests = await prisma.remandRequest.findMany({
    where: { status: 'pending' },
    include: { booking: { include: { person: true } } },
  });
  res.render('remand/index', { requests });
});

router.post('/:id/approve', checkRole(['Court']), async (req, res) => {
  const requestId = parseInt(req.params.id);
  const request = await prisma.remandRequest.findUnique({
    where: { id: requestId },
    include: { booking: true },
  });
  const newExpiryDate = new Date(request.booking.custodyExpiresAt);
  newExpiryDate.setDate(newExpiryDate.getDate() + request.requestedDays);
  await prisma.booking.update({
    where: { id: request.bookingId },
    data: { custodyExpiresAt: newExpiryDate },
  });
  await prisma.remandRequest.update({
    where: { id: requestId },
    data: {
      status: 'approved',
      judgeId: req.session.userId,
      decisionDate: new Date(),
    },
  });
  res.redirect('/remand');
});

router.post('/:id/reject', checkRole(['Court']), async (req, res) => {
  const requestId = parseInt(req.params.id);
  await prisma.remandRequest.update({
    where: { id: requestId },
    data: {
      status: 'rejected',
      judgeId: req.session.userId,
      decisionDate: new Date(),
    },
  });
  res.redirect('/remand');
});

module.exports = router;
