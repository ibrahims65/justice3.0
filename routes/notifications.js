const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { checkRole } = require('../middleware/auth');

router.get('/', async (req, res) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.session.userId },
    orderBy: { createdAt: 'desc' },
  });
  res.render('notifications/index', { notifications });
});

router.post('/:id/read', async (req, res) => {
  const notificationId = parseInt(req.params.id);
  await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });
  res.redirect('/notifications');
});

async function createNotification(userId, message) {
  await prisma.notification.create({
    data: {
      userId,
      message,
    },
  });
}

module.exports = { router, createNotification };
