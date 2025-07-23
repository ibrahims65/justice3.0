const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { checkRole } = require('../middleware/auth');

router.post('/', checkRole(['Court']), async (req, res) => {
  const { amount, status, conditions, judgeName, caseId } = req.body;
  try {
    await prisma.bailDecision.create({
      data: {
        amount: parseFloat(amount),
        status,
        conditions,
        judgeName,
        caseId: parseInt(caseId),
      },
    });
    await prisma.actionHistory.create({
      data: {
        action: `Bail ${status}`,
        notes: `Amount: ${amount}, Conditions: ${conditions}`,
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
