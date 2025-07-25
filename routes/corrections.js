const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { checkRole } = require('../middleware/auth');

router.get('/', checkRole(['Corrections']), async (req, res) => {
  const { search, facility, page } = req.query;
  const pageNumber = parseInt(page) || 1;
  const pageSize = 10;
  let where = {
    bookings: {
      some: {
        case: {
          status: 'Convicted',
        },
      },
    },
  };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { bookings: { some: { case: { caseNumber: { contains: search, mode: 'insensitive' } } } } },
    ];
  }

  if (facility) {
    where.bookings.some.facilityName = { contains: facility, mode: 'insensitive' };
  }

  const people = await prisma.person.findMany({
    where,
    include: {
      bookings: {
        include: {
          case: true,
        },
      },
    },
    skip: (pageNumber - 1) * pageSize,
    take: pageSize,
  });

  res.render('corrections/index', { people });
});

router.get('/inmates/:personId', checkRole(['Corrections']), async (req, res) => {
  const person = await prisma.person.findUnique({
    where: { id: parseInt(req.params.personId) },
    include: {
      bookings: {
        include: {
          case: {
            include: {
              hearings: true,
              lawyers: { include: { visits: true } },
            },
          },
          medicalRecords: { include: { medications: true } },
        },
      },
      nextOfKin: true,
    },
  });
  res.render('corrections/inmateProfile', { person });
});

router.get('/disciplinary/new/:bookingId', checkRole(['Corrections']), (req, res) => {
  res.render('corrections/disciplinary/new', { bookingId: req.params.bookingId });
});

router.post('/disciplinary/:bookingId', checkRole(['Corrections']), async (req, res) => {
  const { date, infraction, sanction, notes } = req.body;
  const bookingId = parseInt(req.params.bookingId);
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  await prisma.disciplinaryAction.create({
    data: {
      bookingId,
      date: new Date(date),
      infraction,
      sanction,
      notes,
    },
  });
  res.redirect(`/corrections/inmates/${booking.personId}`);
});

router.get('/visitation/new/:bookingId', checkRole(['Corrections']), (req, res) => {
  res.render('corrections/visitation/new', { bookingId: req.params.bookingId });
});

router.post('/visitation/:bookingId', checkRole(['Corrections']), async (req, res) => {
  const { date, visitorName, notes } = req.body;
  const bookingId = parseInt(req.params.bookingId);
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  await prisma.visitationLog.create({
    data: {
      bookingId,
      date: new Date(date),
      visitorName,
      notes,
    },
  });
  res.redirect(`/corrections/inmates/${booking.personId}`);
});

router.post('/inmates/:bookingId', checkRole(['Corrections']), async (req, res) => {
  const { incarcerationStartDate, facilityName, rehabilitationPrograms, releaseDate, paroleEligibility } = req.body;
  const bookingId = parseInt(req.params.bookingId);
  try {
    const booking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        incarcerationStartDate: new Date(incarcerationStartDate),
        facilityName,
        rehabilitationPrograms,
        releaseDate: releaseDate ? new Date(releaseDate) : null,
        paroleEligibility: paroleEligibility ? new Date(paroleEligibility) : null,
        releasedAt: releaseDate ? new Date(releaseDate) : null,
      },
    });
    await prisma.actionHistory.create({
      data: {
        action: 'Inmate Status Updated',
        caseId: booking.case.id,
        userId: req.session.userId,
      },
    });
    res.redirect(`/corrections/inmates/${booking.personId}`);
  } catch (error) {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    res.redirect(`/corrections/inmates/${booking.personId}`);
  }
});

router.get('/bulk-update', checkRole(['Corrections']), async (req, res) => {
    const user = await prisma.user.findUnique({
        where: { id: req.session.userId },
        include: { role: true },
    });
    const people = await prisma.person.findMany({
        where: {
            bookings: {
                some: {
                    case: {
                        status: 'Convicted',
                    },
                },
            },
        },
        include: {
            bookings: {
                include: {
                    case: true,
                },
            },
        },
    });
    res.render('corrections/bulk-update', { user, people });
});

router.post('/bulk-update', checkRole(['Corrections']), async (req, res) => {
    const { personIds, status, facility } = req.body;
    const personIdInts = personIds.map(id => parseInt(id));

    await prisma.booking.updateMany({
        where: {
            personId: {
                in: personIdInts,
            },
        },
        data: {
            status: status,
            facilityName: facility,
        },
    });

    res.redirect('/corrections');
});

router.get('/reports', checkRole(['Corrections']), async (req, res) => {
    const user = await prisma.user.findUnique({
        where: { id: req.session.userId },
        include: { role: true },
    });

    const populationByFacility = await prisma.booking.groupBy({
        by: ['facilityName'],
        _count: {
            facilityName: true,
        },
        where: {
            case: {
                status: 'Convicted',
            },
        },
    });

    const disciplinaryActionsByInfraction = await prisma.disciplinaryAction.groupBy({
        by: ['infraction'],
        _count: {
            infraction: true,
        },
    });

    const visitationLogs = await prisma.visitationLog.findMany({
        include: {
            booking: {
                include: {
                    person: true,
                },
            },
        },
    });

    res.render('corrections/reports', {
        user,
        populationByFacility: populationByFacility.reduce((acc, curr) => {
            acc[curr.facilityName] = curr._count.facilityName;
            return acc;
        }, {}),
        disciplinaryActionsByInfraction: disciplinaryActionsByInfraction.reduce((acc, curr) => {
            acc[curr.infraction] = curr._count.infraction;
            return acc;
        }, {}),
        visitationLogs,
    });
});

module.exports = router;
