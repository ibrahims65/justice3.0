const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const prisma = require('../lib/prisma');

// GET login page
router.get('/login', (req, res) => {
  res.render('login', { error: null });
});

// POST login credentials
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { username },
      include: { role: true },
    });

    if (!user) {
      return res.render('login', { error: 'Invalid username or password.' });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.render('login', { error: 'Invalid username or password.' });
    }

    req.session.user = {
      id: user.id,
      username: user.username,
      role: user.role.name,
    };

    console.log('Logged in:', req.session.user);

    switch (user.role.name) {
      case 'Police':
        return res.redirect('/police/dashboard');
      case 'Prosecutor':
        return res.redirect('/prosecutor/dashboard');
      case 'Court':
        return res.redirect('/court/dashboard');
      case 'Corrections':
        return res.redirect('/corrections/dashboard');
      default:
        return res.redirect('/dashboard');
    }
  } catch (err) {
    console.error('Login error:', err);
    res.render('login', { error: 'Something went wrong. Please try again.' });
  }
});

// Optional logout route
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

module.exports = router;
