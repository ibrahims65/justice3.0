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

router.post('/login', async (req, res, next) => {
  console.log('--- New Login Attempt ---');
  try {
    const { username, password } = req.body;
    console.log(`[1/6] Attempting login for email: ${username}`);

    const user = await prisma.user.findUnique({ where: { username }, include: { role: true } });

    if (!user) {
      console.log('[2/6] User not found in database.');
      req.flash('error', 'Invalid username or password.');
      return res.redirect('/auth/login');
    }
    console.log('[2/6] User found in database.');

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      console.log('[3/6] Password validation failed.');
      req.flash('error', 'Invalid username or password.');
      return res.redirect('/auth/login');
    }
    console.log('[3/6] Password validation successful.');

    // Create a plain, serializable object for the session
    const userSessionData = {
      id: user.id,
      username: user.username,
      role: user.role.name
    };
    console.log('[4/6] Created plain user object for session.');

    req.session.user = userSessionData;

    console.log('[5/6] Attempting to save session...');
    req.session.save((err) => {
      if (err) {
        console.error('[ERROR] Session save failed:', err);
        return next(err);
      }
      console.log(`[6/6] Session saved successfully. Redirecting user with role: ${user.role.name}`);

      // Redirect based on role
      switch (user.role.name) {
        case 'Police':
          return res.redirect('/dashboard/police');
        case 'Admin':
          return res.redirect('/admin');
        // Add other roles as needed
        default:
          return res.redirect('/');
      }
    });

  } catch (error) {
    console.error('[FATAL] An unexpected error occurred during login:', error);
    next(error);
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/auth/login');
});

module.exports = router;
