// controllers/police/dashboard.controller.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.renderDashboard = async (req, res) => {
  try {
    const officer = req.session.user;

    const recentBookings = await prisma.booking.findMany({
      orderBy: { bookingDate: 'desc' },
      take: 5,
      include: { person: true }
    });

    res.render('police-dashboard', {
      officer,
      results: [], // default empty search results
      recentBookings,
      alerts: [],
      activityLog: []
    });
  } catch (err) {
    console.error('Dashboard render error:', err);
    res.status(500).send('Internal Server Error');
  }
};
