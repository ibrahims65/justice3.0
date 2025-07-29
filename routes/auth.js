const express = require('express');
const bcrypt = require('bcrypt');
const prisma = require('../lib/prisma');

const router = express.Router();

// GET: Render login page
router.get('/login', (req, res) => {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }

  res.render('login', { error_msg: null });
});

// POST: Handle login credentials
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { username },
      include: { role: true },
    });

    if (!user) {
      return res.render('login', { error_msg: 'Invalid username or password.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.render('login', { error_msg: 'Invalid username or password.' });
    }

    if (!user.role || !user.role.name) {
      return res.render('login', { error_msg: 'User role is missing.' });
    }

    // Store user session
    req.session.user = user;
    req.user = user;

    console.log('Logged in:', req.session.user);

    // Redirect based on role
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
    res.render('login', { error_msg: 'Something went wrong. Please try again.' });
  }
});

// GET: Logout route
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/auth/login');
  });
});

module.exports = router;
