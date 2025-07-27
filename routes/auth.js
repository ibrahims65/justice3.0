const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');

router.get('/register', (req, res) => {
  res.render('register');
});

router.post('/register', async (req, res) => {
  const { username, password, roleName } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    let role = await prisma.role.findUnique({
      where: { name: roleName },
    });
    if (!role) {
      role = await prisma.role.create({
        data: {
          name: roleName,
        },
      });
    }
    const newUser = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        roleId: role.id,
      },
    });
    res.redirect('/auth/login');
  } catch (error) {
    res.redirect('/auth/register');
  }
});

router.get('/login', (req, res) => {
  res.render('login');
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  let user = await (req.prisma || prisma).user.findUnique({
    where: { username },
    include: { role: true },
  });

  if (!user) {
    const hashedPassword = await bcrypt.hash(password, 10);
    user = await (req.prisma || prisma).user.create({
      data: {
        username,
        password: hashedPassword,
        role: {
          connect: {
            name: 'Police',
          },
        },
      },
      include: { role: true },
    });
  }

  if (user && (await bcrypt.compare(password, user.password))) {
    req.session.user = user;
    console.log("Logged in role:", user.role.name);
    if (user.role.name === 'Police') {
        res.redirect('/dashboard/police');
    } else if (user.role.name === 'Prosecutor') {
        res.redirect('/dashboard/prosecutor');
    } else if (user.role.name === 'Court') {
        res.redirect('/dashboard/court');
    } else if (user.role.name === 'Corrections') {
        res.redirect('/corrections/dashboard');
    } else {
        res.redirect('/dashboard');
    }
  } else {
    res.redirect('/auth/login');
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/auth/login');
});

module.exports = router;
