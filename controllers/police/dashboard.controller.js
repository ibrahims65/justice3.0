// controllers/police/dashboard.controller.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.renderDashboard = async (req, res) => {
  try {
    const officerId = req.session?.user?.id;
    if (!officerId) {
      return res.status(401).send('Unauthorized');
    }

    const recentBookings = await prisma.booking.findMany({
      where: { officerId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { person: true }
    });

    const alerts = await prisma.systemAlert.findMany({
      where: { role: 'POLICE' },
      orderBy: { createdAt: 'desc' },
      take: 3
    });

    const activityLog = await prisma.activity.findMany({
      where: { actorId: officerId },
      orderBy: { timestamp: 'desc' },
      take: 5
    });

    res.render('police-dashboard', {
      officer: req.session.user,
      recentBookings,
      alerts,
      activityLog
    });
  } catch (err) {
    console.error('Dashboard render error:', err);
    res.status(500).send('Internal Server Error');
  }
};
