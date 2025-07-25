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
  const breadcrumbs = req.path.split('/').filter(Boolean).map((part, index, arr) => {
    const url = '/' + arr.slice(0, index + 1).join('/');
    return { name: part.charAt(0).toUpperCase() + part.slice(1), url };
  });
  res.locals.breadcrumbs = breadcrumbs;
  if (req.session.userId || req.path === '/auth/login' || req.path === '/auth/register') {
    next();
  } else {
    res.redirect('/auth/login');
  }
});

const allRoutes = require('./routes/all');
app.use(allRoutes);

app.get('/dashboard', async (req, res) => {
  logger.info(`User ${req.session.userId} visited the dashboard`);
  if (!req.session.userId) {
    return res.redirect('/auth/login');
  }
  const user = await prisma.user.findUnique({
    where: { id: req.session.userId },
    include: { role: true },
  });

  const { search, status, facility, startDate, endDate, page } = req.query;
  const pageNumber = parseInt(page) || 1;
  const pageSize = 10;
  let where = {};

  if (search) {
    where.OR = [
      { person: { name: { contains: search, mode: 'insensitive' } } },
      { case: { caseNumber: { contains: search, mode: 'insensitive' } } },
    ];
  }

  if (startDate && endDate) {
    where.bookingDate = {
      gte: new Date(startDate),
      lte: new Date(endDate),
    };
  }

  if (status) {
    if (status === 'Bail Granted' || status === 'Bail Denied') {
      where.bailDecisions = { some: { status: status.split(' ')[1] } };
    } else {
      where.status = status;
    }
  }

  if (facility) {
    where.facilityName = { contains: facility, mode: 'insensitive' };
  }

  let cases = [];
  let bookings = [];
  let people = [];
  if (user.role.name === 'Police') {
    bookings = await prisma.booking.findMany({
      where,
      include: {
        person: true,
      },
      skip: (pageNumber - 1) * pageSize,
      take: pageSize,
    });
    cases = await prisma.case.findMany({
      where,
      include: {
        booking: {
          include: {
            person: true,
          },
        },
      },
    });
    people = await prisma.person.findMany({ where });
  } else if (user.role.name === 'Prosecutor') {
    cases = await prisma.case.findMany({
      where: { ...where, status: 'Prosecutor Review' },
      include: {
        booking: {
          include: {
            person: true,
          },
        },
      },
    });
  } else if (user.role.name === 'Court') {
    cases = await prisma.case.findMany({
      where: { ...where, status: 'Accepted' },
      include: {
        booking: {
          include: {
            person: true,
          },
        },
        hearings: true,
      },
    });
  } else if (user.role.name === 'Corrections') {
    people = await prisma.person.findMany({
      where: {
        ...where,
        bookings: {
          some: {
            case: {
              status: 'Convicted',
            },
          },
        },
      },
      include: {
        bookings: {
          include: {
            case: true,
          },
        },
      },
    });
  }

  res.render('dashboard', { user, cases, bookings, people });
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
