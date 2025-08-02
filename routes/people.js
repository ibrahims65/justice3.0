const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { checkRole } = require('../middleware/auth');
const { check, validationResult } = require('express-validator');
const upload = require('../middleware/upload');
const { customAlphabet } = require('nanoid');
const nanoid = customAlphabet('1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ', 10);

router.get('/new', checkRole(['Police']), (req, res) => {
  res.render('people/new');
});

router.post('/', checkRole(['Police']), upload.single('photo'), async (req, res) => {
    const { name, dob, address, phone, email } = req.body;
      try {
        const newPerson = await prisma.person.create({
          data: {
            name,
            dob: new Date(dob),
            address,
            phone,
            email,
            photoUrl: req.file ? `/uploads/${req.file.filename}` : null,
          },
        });
        res.redirect(`/people/${newPerson.id}`);
      } catch (error) {
        res.redirect('/people/new');
      }
});

router.get('/:id', async (req, res) => {
  const person = await prisma.person.findFirst({
    where: { id: parseInt(req.params.id) },
    include: {
      arrests: {
        include: {
          case: true,
        },
      },
    },
  });
  res.render('people/show', { person });
});

router.post('/:id/delete', checkRole(['Police']), async (req, res) => {
  // Soft delete is not in the schema for Person. This needs re-evaluation.
  console.log(`Request to delete person ${req.params.id}, but soft delete is not implemented.`);
  res.redirect('/dashboard');
});

router.get('/:id/arrests/new', checkRole(['Police']), async (req, res) => {
  res.render('arrests/new', { personId: req.params.id });
});

router.post('/:id/arrests', checkRole(['Police']), [
  check('location').notEmpty().withMessage('Location is required.'),
  check('arrestType').notEmpty().withMessage('Arrest type is required.'),
], async (req, res) => {
  const errors = validationResult(req);
  const personId = parseInt(req.params.id);
  if (!errors.isEmpty()) {
    return res.status(400).render('arrests/new', {
      errors: errors.array(),
      personId,
      ...req.body,
    });
  }

  const { location, arrestType, notes, title, description } = req.body;
  try {
    const newArrest = await prisma.arrestEvent.create({
      data: {
        officerId: req.session.userId,
        arrestedAt: new Date(),
        location,
        arrestType,
        notes,
        case: {
          create: {
            title: title || `Arrest of Person #${personId}`,
            description: description,
            status: 'New Arrest',
          }
        }
      },
      include: {
        case: true
      }
    });
    await prisma.person.update({
        where: { id: personId },
        data: {
            arrests: {
                connect: { id: newArrest.id }
            }
        }
    });
    res.redirect(`/cases/${newArrest.case.id}`);
  } catch (error) {
    res.redirect(`/people/${personId}`);
  }
});

router.get('/:id/remand/new', checkRole(['Police']), (req, res) => {
  // This route seems incorrect. Remand should be against a case or arrest.
  res.redirect(`/people/${req.params.id}`);
});

router.get('/:id/release/new', checkRole(['Police']), (req, res) => {
  // This route seems incorrect. Release should be against a case or arrest.
  res.redirect(`/people/${req.params.id}`);
});

router.get('/:id/cases', async (req, res) => {
  const cases = await prisma.case.findMany({
    where: {
      arrests: {
        some: {
          // There is no direct link from ArrestEvent to Person in the schema
          // This requires a more complex query or schema change.
        },
      },
    },
  });
  res.json(cases);
});

module.exports = router;
