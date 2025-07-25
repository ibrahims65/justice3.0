const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { checkRole } = require('../middleware/auth');

router.post('/cases/:caseId/notes', checkRole(['Prosecutor', 'Court']), async (req, res) => {
  const { caseId } = req.params;
  const { content } = req.body;
  const userId = req.session.userId;

  try {
    await prisma.prosecutorNote.create({
      data: {
        content,
        caseId: parseInt(caseId),
        userId,
      },
    });
    res.redirect(`/cases/${caseId}`);
  } catch (error) {
    res.redirect(`/cases/${caseId}`);
  }
});

router.get('/my-cases', checkRole(['Prosecutor']), async (req, res) => {
    const user = await prisma.user.findUnique({
        where: { id: req.session.userId },
        include: { role: true },
    });
    const cases = await prisma.case.findMany({
        where: {
            assigneeId: req.session.userId,
        },
        include: {
            booking: {
                include: {
                    person: true,
                },
            },
        },
    });
    res.render('prosecutor/my-cases', { user, cases });
});

module.exports = router;
