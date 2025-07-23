const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { checkRole } = require('../../middleware/auth');

router.get('/', checkRole(['Admin']), async (req, res) => {
  const investigators = await prisma.investigator.findMany();
  res.render('admin/investigators/index', { investigators });
});

router.get('/new', checkRole(['Admin']), (req, res) => {
  res.render('admin/investigators/new');
});

router.post('/', checkRole(['Admin']), async (req, res) => {
  const { name, badgeNumber, rank } = req.body;
  try {
    await prisma.investigator.create({
      data: {
        name,
        badgeNumber,
        rank,
      },
    });
    res.redirect('/admin/investigators');
  } catch (error) {
    res.render('admin/investigators/new', { msg: 'Error creating investigator' });
  }
});

module.exports = router;
