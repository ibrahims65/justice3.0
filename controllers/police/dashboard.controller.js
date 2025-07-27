// controllers/police/dashboard.controller.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.renderDashboard = async (req, res) => {
  try {
    const officerId = req.session?.user?.id;
    if (!officerId) {
      return res.status(401).send('Unauthorized');
    }

    console.log('Session user:', req.session.user);
    const recentBookings = await prisma.booking.findMany({
      where: { arrestingOfficerName: req.session.user.username },
      orderBy: { bookingDate: 'desc' },
      take: 5,
      include: { person: true }
    });

    res.render('police-dashboard', {
      officer: req.session.user,
      recentBookings,
      alerts: [],
      activityLog: []
    });
  } catch (err) {
    console.error('Dashboard render error:', err);
    res.status(500).send('Internal Server Error');
  }
};
