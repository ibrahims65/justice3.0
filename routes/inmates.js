const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { checkRole } = require('../middleware/auth');

router.get('/new', checkRole(['Police']), (req, res) => {
  res.render('inmates/new');
});

const upload = require('../middleware/upload');

router.post('/', checkRole(['Police']), (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      res.render('inmates/new', { msg: err });
    } else {
      if (req.file == undefined) {
        res.render('inmates/new', { msg: 'Error: No File Selected!' });
      } else {
        const { name, dob, status } = req.body;
        try {
          const newInmate = await prisma.inmate.create({
            data: {
              name,
              dob: new Date(dob),
              status,
              photoUrl: `/uploads/${req.file.filename}`,
            },
          });
          res.redirect(`/inmates/${newInmate.id}`);
        } catch (error) {
          res.redirect('/inmates/new');
        }
      }
    }
  });
});

router.get('/:id', async (req, res) => {
  const inmate = await prisma.inmate.findUnique({
    where: { id: parseInt(req.params.id) },
    include: { case: true },
  });
  res.render('inmates/show', { inmate });
});

module.exports = router;
