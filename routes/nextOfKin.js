const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { checkRole } = require('../middleware/auth');

router.get('/new/:personId', checkRole(['Police', 'Corrections']), (req, res) => {
  res.render('nextOfKin/new', { personId: req.params.personId });
});

router.post('/', checkRole(['Police', 'Corrections']), async (req, res) => {
  const { name, relationship, phone, address, personId } = req.body;
  // This model does not exist in the new schema.
  // This functionality needs to be re-evaluated.
  console.log('Next of kin submitted, but no model exists to store it.');
  res.redirect(`/people/${personId}`);
});

module.exports = router;
