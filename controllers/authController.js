// controllers/authController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');


exports.getLogin = (req, res) => {
  // The roles variable is no longer needed.
  res.render('login', { roles: [] });
};

exports.getRegister = (req, res) => {
  res.render('register', { errorMessages: req.flash('error') });
};

exports.postRegister = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    req.flash('error', 'Username and password are required');
    return res.status(400).redirect('/register');
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      req.flash('error', 'Username already exists');
      return res.status(400).redirect('/register');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Default new users to the 'Police' role (roleId: 2 from seed)
    await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        roleId: 2,
      },
    });

    req.flash('success', 'Registration successful! Please log in.');
    res.redirect('/login');
  } catch (error) {
    console.error('Registration error:', error);
    req.flash('error', 'An error occurred during registration.');
    res.status(500).redirect('/register');
  }
};

exports.postLogin = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    req.flash('error', 'Username and password are required');
    return res.status(400).redirect('/login');
  }

  try {
    const user = await prisma.user.findUnique({
      where: { username },
      include: { role: true }, // Include the role information
    });

    if (!user) {
      req.flash('error', 'Invalid username or password');
      return res.status(401).redirect('/login');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      req.flash('error', 'Invalid username or password');
      return res.status(401).redirect('/login');
    }

    // Store user info in session
    req.session.userId = user.id;
    req.session.user = {
      id: user.id,
      username: user.username,
      role: user.role.name,
    };

    req.flash('success', 'You are now logged in.');
    res.redirect('/dashboard');
  } catch (error) {
    console.error('Login error:', error);
    req.flash('error', 'An error occurred during login.');
    res.status(500).redirect('/login');
  }
};

exports.getLogout = (req, res, next) => {
  req.session.destroy(err => {
    if (err) return next(err);
    res.redirect('/login');
  });
};
