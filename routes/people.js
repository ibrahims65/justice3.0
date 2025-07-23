const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { checkRole } = require('../middleware/auth');

router.get('/new', checkRole(['Police']), (req, res) => {
  res.render('people/new');
});

const upload = require('../middleware/upload');

router.post('/', checkRole(['Police']), (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      res.render('people/new', { msg: err });
    } else {
      const { name, dob } = req.body;
      try {
        const newPerson = await prisma.person.create({
          data: {
            name,
            dob: new Date(dob),
            photoUrl: req.file ? `/uploads/${req.file.filename}` : null,
          },
        });
        res.redirect(`/people/${newPerson.id}`);
      } catch (error) {
        res.redirect('/people/new');
      }
    }
  });
});

router.get('/:id', async (req, res) => {
  const person = await prisma.person.findUnique({
    where: { id: parseInt(req.params.id) },
    include: { bookings: { include: { case: true } } },
  });
  res.render('people/show', { person, user: req.session });
});

router.get('/:id/bookings/new', checkRole(['Police']), (req, res) => {
  res.render('bookings/new', { personId: req.params.id });
});

const { customAlphabet } = require('nanoid');
const nanoid = customAlphabet('1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ', 10);

router.post('/:id/bookings', checkRole(['Police']), async (req, res) => {
  const { status } = req.body;
  const personId = parseInt(req.params.id);
  try {
    const newBooking = await prisma.booking.create({
      data: {
        personId,
        status,
      },
    });
    const newCase = await prisma.case.create({
      data: {
        caseNumber: `CASE-${nanoid()}`,
        status: 'New Arrest',
        bookingId: newBooking.id,
      },
    });
    await prisma.actionHistory.create({
      data: {
        action: 'Case Created',
        caseId: newCase.id,
        userId: req.session.userId,
      },
    });
    res.redirect(`/cases/${newCase.id}`);
  } catch (error) {
    res.redirect(`/people/${personId}`);
  }
});

module.exports = router;
