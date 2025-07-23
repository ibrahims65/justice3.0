const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { checkRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/new/:caseId', checkRole(['Police']), (req, res) => {
  res.render('evidence/new', { caseId: req.params.caseId });
});

router.post('/', checkRole(['Police']), upload.single('file'), async (req, res) => {
  const { description, tags, caseId } = req.body;
  try {
    await prisma.evidence.create({
      data: {
        description,
        fileUrl: `/uploads/${req.file.filename}`,
        tags,
        caseId: parseInt(caseId),
      },
    });
    await prisma.actionHistory.create({
      data: {
        action: 'Evidence Added',
        caseId: parseInt(caseId),
        userId: req.session.userId,
      },
    });
    res.redirect(`/cases/${caseId}`);
  } catch (error) {
    res.redirect(`/cases/${caseId}`);
  }
});

router.post('/:id/new-version', checkRole(['Police']), upload.single('file'), async (req, res) => {
  const evidenceId = parseInt(req.params.id);
  const { description, tags } = req.body;
  const originalEvidence = await prisma.evidence.findUnique({ where: { id: evidenceId } });

  try {
    await prisma.evidence.create({
      data: {
        description,
        fileUrl: `/uploads/${req.file.filename}`,
        tags,
        version: originalEvidence.version + 1,
        caseId: originalEvidence.caseId,
      },
    });
    await prisma.actionHistory.create({
      data: {
        action: `Evidence Updated (v${originalEvidence.version + 1})`,
        caseId: originalEvidence.caseId,
        userId: req.session.userId,
      },
    });
    res.redirect(`/cases/${originalEvidence.caseId}`);
  } catch (error) {
    res.redirect(`/cases/${originalEvidence.caseId}`);
  }
});

module.exports = router;
