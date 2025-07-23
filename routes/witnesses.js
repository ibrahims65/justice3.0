const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { checkRole } = require('../middleware/auth');

router.get('/new/:caseId', checkRole(['Police']), (req, res) => {
  res.render('witnesses/new', { caseId: req.params.caseId });
});

router.post('/', checkRole(['Police']), async (req, res) => {
  const { name, statement, caseId } = req.body;
  try {
    await prisma.witness.create({
      data: {
        name,
        statement,
        caseId: parseInt(caseId),
      },
    });
    await prisma.actionHistory.create({
      data: {
        action: 'Witness Added',
        caseId: parseInt(caseId),
        userId: req.session.userId,
      },
    });
    res.redirect(`/cases/${caseId}`);
  } catch (error) {
    res.redirect(`/cases/${caseId}`);
  }
});

module.exports = router;
