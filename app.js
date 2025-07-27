const express = require('express');
const session = require('express-session');
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
    secret: 'secret-key',
    resave: false,
    saveUninitialized: true,
  })
);

app.use((req, res, next) => {
  res.locals.page = req.path;
  if (req.session.userId || req.path === '/auth/login' || req.path === '/auth/register') {
    next();
  } else {
    res.redirect('/auth/login');
  }
});

const allRoutes = require('./routes/all');
const policeRoutes = require('./routes/police');
const prosecutorRoutes = require('./routes/prosecutor');
const courtRoutes = require('./routes/court');
const dashboardRoutes = require('./routes/dashboard');
app.use(allRoutes);
app.use('/police', policeRoutes);
app.use('/prosecutor', prosecutorRoutes);
app.use('/court', courtRoutes);
app.use('/dashboard', dashboardRoutes);
const apiRoutes = require('./routes/api');
const jurisdictionRoutes = require('./routes/jurisdiction');
app.use('/api', apiRoutes);
app.use('/api/jurisdiction', jurisdictionRoutes);

app.get('/dashboard', async (req, res) => {
  logger.info(`User ${req.session.userId} visited the dashboard`);
  if (!req.session.userId) {
    return res.redirect('/auth/login');
  }
  const user = await prisma.user.findUnique({
    where: { id: req.session.userId },
    include: { role: true },
  });

  if (user.role.name === 'Police') {
    res.redirect('/dashboard/police');
  } else if (user.role.name === 'Prosecutor') {
    res.redirect('/dashboard/prosecutor');
  } else if (user.role.name === 'Court') {
    res.redirect('/dashboard/court');
  } else if (user.role.name === 'Corrections') {
    res.redirect('/corrections/dashboard');
  } else {
    res.status(403).send("Unknown role");
  }
});



app.get('/court', checkRole(['Court']), (req, res) => {
  res.send('Court Dashboard');
});

app.get('/corrections', checkRole(['Corrections']), (req, res) => {
  res.send('Corrections Dashboard');
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
