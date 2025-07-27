const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const prisma = require('../lib/prisma');

const express = require('express');
const router = express.Router();

// 🧪 Login stub
router.get('/login', (req, res) => {
  res.send('Login route is alive');
});

module.exports = router;

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
      include: { role: true }, // ensure role.name is available
    });

    if (!user) {
      return res.render('login', { error: 'Invalid username or password.' });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.render('login', { error: 'Invalid username or password.' });
    }

    // Store session with role name directly
    req.session.user = {
      id: user.id,
      username: user.username,
      role: user.role.name, // store role name directly
    };

    console.log('Logged in:', req.session.user);

    // Redirect based on role
    if (user.role.name === 'Police') {
      return res.redirect('/police/dashboard');
    } else if (user.role.name === 'Prosecutor') {
      return res.redirect('/prosecutor/dashboard');
    } else if (user.role.name === 'Court') {
      return res.redirect('/court/dashboard');
    } else if (user.role.name === 'Corrections') {
      return res.redirect('/corrections/dashboard');
    } else {
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
