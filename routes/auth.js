const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');

router.get('/register', (req, res) => {
  res.render('register');
});

router.post('/register', async (req, res) => {
  const { username, password, role } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const newRole = await prisma.role.create({
      data: {
        name: role,
      },
    });
    const newUser = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        roleId: newRole.id,
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
  const user = await prisma.user.findUnique({
    where: { username },
    include: { role: true },
  });

  if (user && (await bcrypt.compare(password, user.password))) {
    req.session.userId = user.id;
    req.session.role = user.role.name;
    res.redirect('/dashboard');
  } else {
    res.redirect('/auth/login');
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/auth/login');
});

module.exports = router;
