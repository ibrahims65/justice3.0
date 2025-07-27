const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const { checkRole } = require('./middleware/auth');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const logger = require('./logger');

const app = express();

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

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

// Routes
const allRoutes = require('./routes/all');
const policeRoutes = require('./routes/police');
const prosecutorRoutes = require('./routes/prosecutor');
const courtRoutes = require('./routes/court');
const dashboardRoutes = require('./routes/dashboard');
const apiRoutes = require('./routes/api');

app.use(allRoutes);
app.use('/police', policeRoutes);
app.use('/prosecutor', prosecutorRoutes);
app.use('/court', courtRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/api', apiRoutes);

// Dashboard redirect logic
app.get('/dashboard', async (req, res) => {
  logger.info(`User ${req.session.user?.id} visited the dashboard`);

  if (!req.session.user) {
    return res.redirect('/auth/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: req.session.user.id },
    include: { role: true },
  });

  const role = user.role.name;

  if (role === 'Police') {
    res.redirect('/dashboard/police');
  } else if (role === 'Prosecutor') {
    res.redirect('/dashboard/prosecutor');
  } else if (role === 'Court') {
    res.redirect('/dashboard/court');
  } else if (role === 'Corrections') {
    res.redirect('/corrections/dashboard');
  } else {
    res.status(403).send('Unknown role');
  }
});

// Role-based dashboards
app.get('/court', checkRole(['Court']), (req, res) => {
  res.send('Court Dashboard');
});

app.get('/corrections', checkRole(['Corrections']), (req, res) => {
  res.send('Corrections Dashboard');
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
