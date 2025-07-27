const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const prisma = require('../lib/prisma'); // Adjust path if needed

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
    });

    if (!user) {
      return res.render('login', { error: 'Invalid username or password.' });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.render('login', { error: 'Invalid username or password.' });
    }

    // Store user session
    req.session.user = {
      id: user.id,
      username: user.username,
      role: user.role,
    };

    // Redirect based on role (customize as needed)
    if (user.role === 'police') {
      return res.redirect('/police/dashboard');
    } else if (user.role === 'admin') {
      return res.redirect('/admin/dashboard');
    } else {
      return res.redirect('/dashboard');
    }
  } catch (err) {
    console.error('Login error:', err);
    res.render('login', { error: 'Something went wrong. Please try again.' });
  }
});

// Optional: logout route
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

module.exports = router;
