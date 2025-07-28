const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcrypt');
const prisma  = require('../lib/prisma');

// GET login page
router.get('/login', (req, res) => {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }

  res.render('login', {
    _csrf:       req.csrfToken(),
    error_msg:   null,
    success_msg: null
  });
});

// POST login credentials
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where:  { username },
      include:{ role: true },
    });

    if (!user) {
      return res.render('login', {
        _csrf:       req.csrfToken(),
        error_msg:   'Invalid username or password.',
        success_msg: null
      });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.render('login', {
        _csrf:       req.csrfToken(),
        error_msg:   'Invalid username or password.',
        success_msg: null
      });
    }

    if (!user.role || !user.role.name) {
      return res.render('login', {
        _csrf:       req.csrfToken(),
        error_msg:   'User role is missing.',
        success_msg: null
      });
    }

    // Successful login → set session
    req.session.user = {
      id:       user.id,
      username: user.username,
      role:     user.role.name
    };

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
    return res.render('login', {
      _csrf:       req.csrfToken(),
      error_msg:   'Something went wrong. Please try again.',
      success_msg: null
    });
  }
});

// Optional logout route
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    // you could flash a “Logged out successfully” message here
    res.redirect('/auth/login');
  });
});

module.exports = router;
