const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getDashboardStats(officerId) {
  const activeCases = await prisma.case.count({
    where: {
      booking: {
        arrestingOfficerId: officerId,
      },
      status: 'Open',
    },
  });

  const totalCases = await prisma.case.count({
    where: {
      booking: {
        arrestingOfficerId: officerId,
      },
    },
  });

  const registeredPersons = await prisma.person.count({
    where: {
      bookings: {
        some: {
          arrestingOfficerId: officerId,
        },
      },
    },
  });

  return {
    active: activeCases,
    total: totalCases,
    registered: registeredPersons,
  };
}

async function getExpiringCustody(officerId) {
  const now = new Date();
  const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  return prisma.booking.findMany({
    where: {
      arrestingOfficerId: officerId,
      custodyExpiresAt: {
        gte: now,
        lte: twentyFourHoursFromNow,
      },
    },
    include: {
      person: true,
    },
  });
}

async function getUserBookings(officerId) {
  return prisma.booking.findMany({
    where: {
      arrestingOfficerId: officerId,
    },
    include: {
      person: true,
      case: true,
    },
    orderBy: {
      bookingDate: 'desc',
    },
    take: 10,
  });
}

async function getBookingStatusChart(officerId) {
  const statuses = await prisma.booking.groupBy({
    by: ['status'],
    where: {
      arrestingOfficerId: officerId,
    },
    _count: {
      status: true,
    },
  });

  return {
    labels: statuses.map(s => s.status),
    data: statuses.map(s => s._count.status),
  };
}

exports.getDashboardData = async (req, res) => {
  try {
    const officer = req.user;
    const stats = await getDashboardStats(officer.id);
    const expiringCustody = await getExpiringCustody(officer.id);
    const userBookings = await getUserBookings(officer.id);
    const bookingStatusData = await getBookingStatusChart(officer.id);

    res.render('police/police_dashboard', {
      user: officer,
      stats,
      expiringCustody,
      userBookings,
      bookingStatusData,
      req: req,
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).send('Internal Server Error');
  }
};

exports.getManagementData = async (req, res) => {
    try {
        const officerId = req.user.id;
        const cases = await prisma.case.findMany({
            where: {
                booking: {
                    arrestingOfficerId: officerId,
                },
            },
            include: {
                booking: true,
            },
        });

        const people = await prisma.person.findMany({
            where: {
                bookings: {
                    some: {
                        arrestingOfficerId: officerId,
                    },
                },
            },
        });

        res.render('police/management', {
            user: req.user,
            cases,
            people,
            req: req,
        });
    } catch (err) {
        console.error('Management data error:', err);
        res.status(500).send('Internal Server Error');
    }
};

exports.getNewCaseStep1 = (req, res) => {
    res.render('police/case/step1', { user: req.user, req: req });
};

exports.postNewCaseStep1 = async (req, res) => {
    const { name, email, dob } = req.body;
    const person = await prisma.person.create({
        data: {
            name,
            email,
            dob: new Date(dob),
        },
    });
    res.redirect(`/police/case/new/step2?personId=${person.id}`);
};

exports.getNewCaseStep2 = async (req, res) => {
    const policeStations = await prisma.policeStation.findMany();
    res.render('police/case/step2', {
        user: req.user,
        personId: req.query.personId,
        policeStations,
        req: req,
    });
};

exports.postNewCaseStep2 = async (req, res) => {
    const { personId, caseNumber, status, policeStationId } = req.body;
    const booking = await prisma.booking.create({
        data: {
            personId: parseInt(personId),
            policeStationId: parseInt(policeStationId),
            bookingDate: new Date(),
            status: 'Open',
            arrestingOfficerId: req.session.user.id,
        },
    });
    const createdCase = await prisma.case.create({
        data: {
            bookingId: booking.id,
            caseNumber,
            status,
        },
    });
    await prisma.booking.update({
        where: { id: booking.id },
        data: { caseId: createdCase.id },
    });
    res.redirect('/police/management');
};

exports.getPerson = async (req, res) => {
    const person = await prisma.person.findUnique({
        where: { id: parseInt(req.params.id) },
        include: {
            bookings: {
                include: {
                    case: true,
                },
            },
        },
    });
    res.render('police/person', { person, user: req.user, req: req });
};

exports.getBooking = async (req, res) => {
    const booking = await prisma.booking.findUnique({
        where: { id: parseInt(req.params.id) },
        include: {
            person: true,
            case: true,
            policeStation: true,
        },
    });
    res.render('police/booking', { booking, user: req.user, req: req });
};

exports.getEditBooking = async (req, res) => {
    const booking = await prisma.booking.findUnique({
        where: { id: parseInt(req.params.id) },
        include: {
            person: true,
            case: true,
            policeStation: true,
        },
    });
    const policeStations = await prisma.policeStation.findMany();
    res.render('police/edit-booking', { booking, policeStations, user: req.user, req: req });
};

exports.postEditBooking = async (req, res) => {
    const { caseNumber, status, policeStationId } = req.body;
    await prisma.case.update({
        where: { id: parseInt(req.params.id) },
        data: {
            caseNumber,
            status,
        },
    });
    await prisma.booking.update({
        where: { id: parseInt(req.params.id) },
        data: {
            policeStationId: parseInt(policeStationId),
        },
    });
    res.redirect(`/police/bookings/${req.params.id}`);
};

exports.search = async (req, res) => {
    const { q } = req.body;
    const cases = await prisma.case.findMany({
        where: {
            OR: [
                { caseNumber: { contains: q, mode: 'insensitive' } },
                { booking: { person: { name: { contains: q, mode: 'insensitive' } } } },
            ],
        },
        include: {
            booking: {
                include: {
                    person: true,
                },
            },
        },
    });
    res.render('police/search-results', { cases, user: req.user, req: req });
};

exports.printPersonRecord = async (req, res) => {
    const person = await prisma.person.findUnique({
        where: { id: parseInt(req.params.id) },
        include: {
            bookings: {
                include: {
                    case: true,
                    policeStation: true,
                },
            },
        },
    });
    res.render('police/print-record', { person, layout: false });
};
