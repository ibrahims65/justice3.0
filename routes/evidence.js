const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { checkRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/new/:caseId', checkRole(['Police']), (req, res) => {
  res.render('evidence/new', { caseId: req.params.caseId });
});

router.post('/', checkRole(['Police']), (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      res.render('evidence/new', { msg: err, caseId: req.body.caseId });
    } else {
      if (req.file == undefined) {
        res.render('evidence/new', { msg: 'Error: No File Selected!', caseId: req.body.caseId });
      } else {
        const { description, caseId, receivedFrom, storageLocation, dateReceived } = req.body;
        try {
          await prisma.evidence.create({
            data: {
              description,
              fileUrl: `/uploads/${req.file.filename}`,
              caseId: parseInt(caseId),
              receivedFrom,
              storageLocation,
              dateReceived: new Date(dateReceived),
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
      }
    }
  });
});

module.exports = router;
