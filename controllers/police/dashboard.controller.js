// controllers/police/dashboard.controller.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getDashboard = async (req, res) => {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const overdueBookings = await prisma.arrestEvent.count({
      where: {
        arrestType: 'Pending', // Assuming 'arrestType' is the equivalent of 'status'
        arrestedAt: {
          lt: twentyFourHoursAgo,
        },
      },
    });

    res.render('police/dashboard', {
      title: 'Police Dashboard',
      user: req.user,
      overdueBookings,
      alerts: [],
      recentActivity: [],
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
};
