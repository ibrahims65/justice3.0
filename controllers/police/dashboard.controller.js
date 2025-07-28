// controllers/police/dashboard.controller.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.renderDashboard = async (req, res) => {
  try {
    const officer = req.session.user;
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const overdueBookings = await prisma.booking.findMany({
      where: {
        status: 'Open',
        bookingDate: { lt: twentyFourHoursAgo },
      },
    });

    const newBookings = await prisma.booking.findMany({
      where: {
        bookingDate: { gte: twentyFourHoursAgo },
      },
    });

    const recentBookings = await prisma.booking.findMany({
      where: { arrestingOfficerId: officer.id },
      orderBy: { bookingDate: 'desc' },
      take: 5,
      include: { person: true, case: true },
    });

    res.render('police/dashboard', {
      officer,
      overdueBookings,
      newBookings,
      recentBookings,
      alerts: [], // Placeholder for future alerts
      req: req,
    });
  } catch (err) {
    console.error('Dashboard render error:', err);
    res.status(500).send('Internal Server Error');
  }
};
