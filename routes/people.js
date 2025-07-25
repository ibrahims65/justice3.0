const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { checkRole } = require('../middleware/auth');
const { hasPermission } = require('../middleware/permission');
const upload = require('../middleware/upload');
const { customAlphabet } = require('nanoid');
const { body, validationResult } = require('express-validator');
const nanoid = customAlphabet('1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ', 10);

router.get('/', checkRole(['Police']), async (req, res) => {
  const { name, id, gender, age, registrationDate } = req.query;
  let where = {};
  if (name) {
    where.name = { contains: name, mode: 'insensitive' };
  }
  if (id) {
    where.id = parseInt(id);
  }
  if (gender) {
    where.gender = gender;
  }
  if (age) {
    const today = new Date();
    const birthDate = new Date(today.getFullYear() - age, today.getMonth(), today.getDate());
    where.dob = { lte: birthDate };
  }
  if (registrationDate) {
    where.createdAt = { gte: new Date(registrationDate) };
  }

  const page = parseInt(req.query.page) || 1;
  const pageSize = 10;
  const people = await prisma.person.findMany({
    where,
    include: {
      bookings: true,
    },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });
  const totalPeople = await prisma.person.count({ where });
  const totalPages = Math.ceil(totalPeople / pageSize);
  const user = await prisma.user.findUnique({
    where: { id: req.session.userId },
    include: { role: true },
  });
  res.render('people/index', {
    people,
    user,
    page: '/people',
    breadcrumbs: [{ name: 'People', url: '/people' }],
    currentPage: page,
    totalPages,
  });
});

router.get('/new', checkRole(['Police']), hasPermission('create:person'), async (req, res) => {
    const user = await prisma.user.findUnique({
        where: { id: req.session.userId },
        include: { role: true },
    });
  res.render('people/new', { user, page: '/people/new' });
});

router.get('/new-flow', checkRole(['Police']), async (req, res) => {
    const policeStations = await prisma.policeStation.findMany();
    const user = await prisma.user.findUnique({
        where: { id: req.session.userId },
        include: { role: true },
    });
  res.render('people/new-flow', { step: 1, personId: null, policeStations: policeStations, error: null, user: user, page: '/people/new-flow' });
});

router.post(
    '/new-flow',
    checkRole(['Police']),
    upload.single('photo'),
    [
        body('name').notEmpty().withMessage('Name is required'),
        body('dob').isISO8601().withMessage('Date of birth must be a valid date'),
        body('email').isEmail().withMessage('Email must be a valid email address'),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const policeStations = await prisma.policeStation.findMany();
            const user = await prisma.user.findUnique({
                where: { id: req.session.userId },
                include: { role: true },
            });
            return res.status(400).render('people/new-flow', {
                step: 1,
                personId: null,
                policeStations: policeStations,
                error: errors.array()[0].msg,
                user: user,
                page: '/people/new-flow',
            });
        }

        const { name, dob, address, phone, email } = req.body;
        const { step } = req.query;
        const user = await prisma.user.findUnique({
            where: { id: req.session.userId },
            include: { role: true },
        });

        if (step == 1) {
            try {
                const newPerson = await prisma.person.create({
                    data: {
                        name,
                        dob: new Date(dob),
                        address,
                        phone,
                        email,
                        photoUrl: req.file ? `/uploads/${req.file.filename}` : null,
                    },
                });
                const policeStations = await prisma.policeStation.findMany();
                res.render('people/new-flow', { step: 2, personId: newPerson.id, policeStations: policeStations, error: null, user: user, page: '/people/new-flow' });
            } catch (error) {
                const policeStations = await prisma.policeStation.findMany();
                res.render('people/new-flow', { step: 1, personId: null, policeStations: policeStations, error: 'Failed to create person.', user: user, page: '/people/new-flow' });
            }
        } else {
            const { charges, policeStationId, arrestingOfficerName, arrestingOfficerRank } = req.body;
            const personId = parseInt(req.body.personId);
            try {
                const newBooking = await prisma.booking.create({
                    data: {
                        personId,
                        status: 'New Booking',
                        charges,
                        policeStationId: parseInt(policeStationId),
                        arrestingOfficerName,
                        arrestingOfficerRank,
                        custodyExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    },
                });
                await prisma.person.update({
                    where: { id: personId },
                    data: { rebookedAt: new Date() },
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
                res.redirect('/dashboard');
            } catch (error) {
                const policeStations = await prisma.policeStation.findMany();
                res.render('people/new-flow', { step: 2, personId: personId, policeStations: policeStations, error: 'Failed to create booking.', user: user, page: '/people/new-flow' });
            }
        }
    }
);

router.post(
    '/',
    checkRole(['Police']),
    upload.single('photo'),
    [
        body('name').notEmpty().withMessage('Name is required'),
        body('dob').isISO8601().withMessage('Date of birth must be a valid date'),
        body('email').isEmail().withMessage('Email must be a valid email address'),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const user = await prisma.user.findUnique({
                where: { id: req.session.userId },
                include: { role: true },
            });
            return res.status(400).render('people/new', {
                error: errors.array()[0].msg,
                user: user,
                page: '/people/new',
            });
        }

        const { name, dob, address, phone, email } = req.body;
        try {
            const newPerson = await prisma.person.create({
                data: {
                    name,
                    dob: new Date(dob),
                    address,
                    phone,
                    email,
                    photoUrl: req.file ? `/uploads/${req.file.filename}` : null,
                },
            });
            req.flash('success_msg', 'Person created successfully');
            res.redirect(`/people/${newPerson.id}`);
        } catch (error) {
            const user = await prisma.user.findUnique({
                where: { id: req.session.userId },
                include: { role: true },
            });
            res.status(400).render('people/new', {
                error: 'Failed to create person.',
                user: user,
                page: '/people/new',
            });
        }
    }
);

router.get('/:id', async (req, res) => {
  const person = await prisma.person.findFirst({
    where: { id: parseInt(req.params.id) },
    include: {
      bookings: {
        include: {
          case: {
            include: {
              lawyers: {
                include: {
                  visits: true,
                },
              },
              medicalRecords: {
                include: {
                  medications: true,
                },
              },
            },
          },
        },
      },
      nextOfKin: true,
    },
  });
  const user = await prisma.user.findUnique({
    where: { id: req.session.userId },
    include: { role: true },
  });
  res.render('people/show', { person, user });
});

router.post('/:id/delete', checkRole(['Police']), async (req, res) => {
  await prisma.person.update({
    where: { id: parseInt(req.params.id) },
    data: { deletedAt: new Date() },
  });
  res.redirect('/dashboard');
});

router.get('/:id/bookings/new', checkRole(['Police']), async (req, res) => {
    const policeStations = await prisma.policeStation.findMany();
    const user = await prisma.user.findUnique({
        where: { id: req.session.userId },
        include: { role: true },
    });
  res.render('bookings/new', { personId: req.params.id, policeStations, user, page: '/bookings/new' });
});

router.post(
    '/:id/bookings',
    checkRole(['Police']),
    [
        body('charges').notEmpty().withMessage('Charges are required'),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const policeStations = await prisma.policeStation.findMany();
            const user = await prisma.user.findUnique({
                where: { id: req.session.userId },
                include: { role: true },
            });
            return res.status(400).render('bookings/new', {
                personId: req.params.id,
                policeStations,
                error: errors.array()[0].msg,
                user: user,
                page: '/bookings/new',
            });
        }

        const { status, charges, policeStationId, arrestingOfficerName, arrestingOfficerRank } = req.body;
        const personId = parseInt(req.params.id);
        try {
            const newBooking = await prisma.booking.create({
                data: {
                    personId,
                    status: 'New Booking',
                    charges,
                    policeStationId: parseInt(policeStationId),
                    arrestingOfficerName,
                    arrestingOfficerRank,
                    custodyExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                },
            });
            await prisma.person.update({
                where: { id: personId },
                data: { rebookedAt: new Date() },
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
            req.flash('success_msg', 'Booking created successfully');
            req.flash('success_msg', 'Booking created successfully');
            res.redirect('/dashboard');
        } catch (error) {
            const policeStations = await prisma.policeStation.findMany();
            const user = await prisma.user.findUnique({
                where: { id: req.session.userId },
                include: { role: true },
            });
            res.status(400).render('bookings/new', {
                personId: req.params.id,
                policeStations,
                error: 'Failed to create booking.',
                user: user,
                page: '/bookings/new',
            });
        }
    }
);

router.get('/:id/remand/new', checkRole(['Police']), (req, res) => {
  res.render('remand/new', { bookingId: req.params.id });
});

router.get('/:id/release/new', checkRole(['Police']), (req, res) => {
  res.render('release/new', { bookingId: req.params.id });
});

module.exports = router;
