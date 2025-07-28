const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getDashboardData(req, res) {
  try {
    const officerId = req.user?.id;

    const overdueBookings = await prisma.booking.findMany({
      where: {
        arrestingOfficerId: officerId,
        status: 'Open',
        bookingDate: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } // older than 24h
      },
      orderBy: { bookingDate: 'desc' }
    });

    const alerts = await prisma.alert.findMany({
      where: {
        userId: officerId,
        read: false
      },
      orderBy: { createdAt: 'desc' }
    });

    const recentActivity = await prisma.booking.findMany({
      where: { arrestingOfficerId: officerId },
      orderBy: { bookingDate: 'desc' },
      take: 10,
      include: { person: true, case: true },
    });

    res.render('police/dashboard', {
      user: req.user,
      overdueBookings,
      alerts,
      recentActivity,
      req: req,
    });
  } catch (error) {
    console.error(error);
    res.render('error', {
      message: 'Error loading police dashboard.',
      error,
      req: req,
    });
  }
}

module.exports = { getDashboardData };
