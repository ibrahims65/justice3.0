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
