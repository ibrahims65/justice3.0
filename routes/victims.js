const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { checkRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/new/:caseId', checkRole(['Police']), (req, res) => {
  res.render('victims/new', { caseId: req.params.caseId });
});

router.post('/', checkRole(['Police']), upload.single('media'), async (req, res) => {
    if (err) {
      res.render('victims/new', { msg: err, caseId: req.body.caseId });
      const { name, dob, address, phone, email, statement, caseId } = req.body;
      try {
        await prisma.victim.create({
          data: {
            name,
            dob: new Date(dob),
            address,
            phone,
            email,
            statement,
            photoUrl: req.file ? `/uploads/${req.file.filename}` : null,
            caseId: parseInt(caseId),
          },
        });
        await prisma.actionHistory.create({
          data: {
            action: 'Victim Added',
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
