console.log('🚀 Starting Justice 3.0...');
const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const { checkRole } = require('./middleware/auth');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const logger = require('./logger');

const app = express();

// View engine and static assets
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Added for API support
app.use(express.static('public'));

// Session config
app.use(
  session({
    secret: 'secret-key', // use env var in production
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // true in production with HTTPS
      maxAge: 1000 * 60 * 60, // 1 hour
    },
  })
);

app.use(flash());

// Flash and session locals
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success');
  res.locals.error_msg = req.flash('error');
  res.locals.page = req.path;
  next();
});

// Auth gatekeeping
app.use((req, res, next) => {
  const publicPaths = ['/auth/login', '/auth/register', '/login'];
  if (req.session.user || publicPaths.includes(req.path)) {
    next();
  } else {
    res.redirect('/auth/login');
  }
});

// 🔌 Route modules
const allRoutes = require('./routes/all');
const policeRoutes = require('./routes/police'); // Existing police routes
const prosecutorRoutes = require('./routes/prosecutor');
const courtRoutes = require('./routes/court');
const dashboardRoutes = require('./routes/dashboard');
const apiRoutes = require('./routes/api');

// 🆕 New central route hub (includes police dashboard)
const unifiedRoutes = require('./routes'); // <-- This is your new `routes/index.js`

// 🧭 Route registration
app.use(allRoutes);
app.use(unifiedRoutes);
