const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { checkRole } = require('../middleware/auth');

router.use(checkRole(['SuperAdmin']));

router.get('/', (req, res) => {
  res.render('admin/jurisdiction', { user: req.session.user, page: '/admin' });
});

module.exports = router;
