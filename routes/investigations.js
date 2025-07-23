const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { checkRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/new/:caseId', checkRole(['Police']), async (req, res) => {

  res.render('investigations/new', { caseId: req.params.caseId });
});

router.post('/', checkRole(['Police']), upload.array('media'), async (req, res) => {
  const { details, caseId, investigatorName, investigatorBadgeNumber, investigatorRank } = req.body;

  try {
    const investigation = await prisma.investigation.create({
      data: {
        details,
        caseId: parseInt(caseId),

        investigatorName,
        investigatorBadgeNumber,
        investigatorRank,
      },
    });

    if (req.files) {
      for (const file of req.files) {
        await prisma.media.create({
          data: {
            url: `/uploads/${file.filename}`,
            type: file.mimetype,
            investigationId: investigation.id,
          },
        });
      }
    }

    res.redirect(`/cases/${caseId}`);
  } catch (error) {
    res.redirect(`/cases/${caseId}`);
  }
});

module.exports = router;
