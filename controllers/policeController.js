const { PrismaClient } = require('@prisma/client');
const { generateCaseNumber } = require('../utils/caseNumber');
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

exports.getDashboardData = async (req, res, next) => {
  try {
    // guard: did we actually log in and set req.session.user?
    const sessionUser = req.session.user;
    if (!sessionUser || !sessionUser.id) {
      req.flash('error', 'Please log in to view the dashboard');
      return res.redirect('/login');
    }

    const userId = sessionUser.id;

    const stats = await getDashboardStats(userId);
    const expiringCustody = await getExpiringCustody(userId);
    const userBookings = await getUserBookings(userId);
    const bookingStatusData = await getBookingStatusChart(userId);

    res.render('police/police_dashboard', {
      user: sessionUser,
      stats,
      expiringCustody,
      userBookings,
      bookingStatusData,
      req: req,
    });
  } catch (err) {
    next(err);
  }
};

exports.getManagementData = async (req, res) => {
    try {
        if (!req.session.user) {
            req.flash('error', 'You must be logged in to view this page.');
            return res.redirect('/login');
        }
        const officerId = req.session.user.id;
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
            user: req.session.user,
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
    console.log('Session caseData:', req.session.caseData);
    req.session.caseData = { step: 1 };
    res.render('police/case/step1', { user: req.user, req: req });
};

exports.postNewCaseStep1 = (req, res) => {
    console.log('Session caseData:', req.session.caseData);
    req.session.caseData = { ...req.session.caseData, ...req.body, step: 2 };
    res.redirect('/police/cases/new/step2');
};

exports.getNewCaseStep2 = async (req, res) => {
    console.log('Session caseData:', req.session.caseData);
    const policeStations = await prisma.policeStation.findMany();
    res.render('police/case/step2', {
        user: req.user,
        caseData: req.session.caseData,
        policeStations,
        req: req,
    });
};

exports.postNewCaseStep2 = async (req, res) => {
    console.log('Session caseData:', req.session.caseData);
    req.session.caseData = { ...req.session.caseData, ...req.body, step: 3 };
    res.redirect('/police/cases/new/step3');
};

exports.getNewCaseStep3 = async (req, res) => {
    console.log('Session caseData:', req.session.caseData);
    const { name, email, dob, caseNumber, status, policeStationId } = req.session.caseData;
    const policeStation = await prisma.policeStation.findUnique({ where: { id: parseInt(policeStationId) } });
    res.render('police/case/step3', {
        user: req.user,
        person: { name, email, dob },
        caseDetails: { caseNumber, status },
        policeStation,
        req: req,
    });
};

exports.postNewCaseConfirm = async (req, res, next) => {
    try {
        const { name, email, dob, status, policeStationId } = req.session.caseData;

        // --- Refactored Query Start ---
        // 1. Fetch Police Station
        const policeStation = await prisma.policeStation.findUnique({
            where: { id: parseInt(policeStationId) },
        });
        if (!policeStation) throw new Error('Police station not found');

        // 2. Fetch City
        const city = await prisma.city.findUnique({
            where: { id: policeStation.cityId },
        });
        if (!city) throw new Error('City not found');

        // 3. Fetch District
        const district = await prisma.district.findUnique({
            where: { id: city.districtId },
        });
        if (!district) throw new Error('District not found');

        // 4. Fetch Region
        const region = await prisma.region.findUnique({
            where: { id: district.regionId },
        });
        if (!region) throw new Error('Region not found');
        // --- Refactored Query End ---

        const caseNumber = generateCaseNumber(region.name, city.name);

        // --- Find or Create Person Logic ---
        let person = await prisma.person.findUnique({
            where: { email: email },
        });

        if (!person) {
            person = await prisma.person.create({
                data: {
                    name,
                    email,
                    dob: new Date(dob),
                },
            });
        }
        // --- End Find or Create Person Logic ---
    const booking = await prisma.booking.create({
        data: {
            personId: person.id,
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
        data: {
            case: {
                connect: { id: createdCase.id },
            },
        },
    });
    delete req.session.caseData;
    res.redirect('/police/management');
    } catch (error) {
        next(error);
    }
};

exports.listBookings = async (req, res) => {
    try {
        const bookings = await prisma.booking.findMany({
            include: {
                person: true,
                case: true,
            },
            orderBy: {
                bookingDate: 'desc',
            },
        });
        res.render('police/bookings', {
            user: req.user,
            bookings,
            req: req,
        });
    } catch (err) {
        console.error('Error listing bookings:', err);
        res.status(500).send('Internal Server Error');
    }
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
    const { q } = req.query;
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

exports.getNewPerson = (req, res) => {
    res.render('police/new-person', { user: req.user, req: req });
};

exports.postNewPerson = async (req, res) => {
    const { name, email, dob } = req.body;
    const person = await prisma.person.create({
        data: {
            name,
            email,
            dob: new Date(dob),
        },
    });
    res.redirect('/police/management');
};
