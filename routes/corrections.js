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

// Activities
router.get('/activities', checkRole(['Corrections']), async (req, res) => {
    const activities = await prisma.activity.findMany({
        include: {
            booking: {
                include: {
                    person: true,
                },
            },
        },
    });
    res.render('corrections/activities/index', { activities, user: req.user });
});

router.get('/activities/new', checkRole(['Corrections']), async (req, res) => {
    const bookings = await prisma.booking.findMany({
        where: {
            case: {
                status: 'Convicted',
            },
        },
        include: {
            person: true,
        },
    });
    res.render('corrections/activities/new', { bookings, user: req.user });
});

router.post('/activities', checkRole(['Corrections']), async (req, res) => {
    const { name, description, startTime, endTime, bookingId } = req.body;
    await prisma.activity.create({
        data: {
            name,
            description,
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            bookingId: parseInt(bookingId),
        },
    });
    res.redirect('/corrections/activities');
});

// Incidents
router.get('/incidents', checkRole(['Corrections']), async (req, res) => {
    const incidents = await prisma.incident.findMany({
        include: {
            booking: {
                include: {
                    person: true,
                },
            },
            reportedBy: true,
        },
    });
    res.render('corrections/incidents/index', { incidents, user: req.user });
});

router.get('/incidents/new', checkRole(['Corrections']), async (req, res) => {
    const bookings = await prisma.booking.findMany({
        where: {
            case: {
                status: 'Convicted',
            },
        },
        include: {
            person: true,
        },
    });
    res.render('corrections/incidents/new', { bookings, user: req.user });
});

router.post('/incidents', checkRole(['Corrections']), async (req, res) => {
    const { bookingId, date, description } = req.body;
    const reportedById = req.session.userId;
    await prisma.incident.create({
        data: {
            bookingId: parseInt(bookingId),
            date: new Date(date),
            description,
            reportedById,
        },
    });
    res.redirect('/corrections/incidents');
});

// Visitors
router.get('/visitors', checkRole(['Corrections']), async (req, res) => {
    const visitors = await prisma.visitor.findMany();
    res.render('corrections/visitors/index', { visitors, user: req.user });
});

router.get('/visitors/new', checkRole(['Corrections']), (req, res) => {
    res.render('corrections/visitors/new', { user: req.user });
});

router.post('/visitors', checkRole(['Corrections']), async (req, res) => {
    const { name, address, phone, email } = req.body;
    await prisma.visitor.create({
        data: {
            name,
            address,
            phone,
            email,
        },
    });
    res.redirect('/corrections/visitors');
});

router.get('/visitors/:id/edit', checkRole(['Corrections']), async (req, res) => {
    const visitor = await prisma.visitor.findUnique({ where: { id: parseInt(req.params.id) } });
    res.render('corrections/visitors/edit', { visitor, user: req.user });
});

router.post('/visitors/:id', checkRole(['Corrections']), async (req, res) => {
    const { name, address, phone, email } = req.body;
    await prisma.visitor.update({
        where: { id: parseInt(req.params.id) },
        data: {
            name,
            address,
            phone,
            email,
        },
    });
    res.redirect('/corrections/visitors');
});

router.post('/visitors/:id/delete', checkRole(['Corrections']), async (req, res) => {
    await prisma.visitor.delete({ where: { id: parseInt(req.params.id) } });
    res.redirect('/corrections/visitors');
});

module.exports = router;
