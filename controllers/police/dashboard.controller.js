// controllers/police/dashboard.controller.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getDashboard = async (req, res) => {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const overdueBookings = await prisma.booking.count({
      where: {
        status: 'Pending',
        bookingDate: {
          lt: twentyFourHoursAgo,
        },
      },
    });

    const alerts = await prisma.alert.findMany({
      where: {
        userId: req.user.id,
        read: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const recentActivity = await prisma.activityLog.findMany({
      where: {
        userId: req.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    res.render('police/dashboard', {
      title: 'Police Dashboard',
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
};
