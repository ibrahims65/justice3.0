const express = require('express');
const session = require('express-session');
const authRouter = require('./routes/auth');
const { checkRole } = require('./middleware/auth');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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

app.use('/auth', authRouter);

const peopleRouter = require('./routes/people');
app.use('/people', peopleRouter);

const casesRouter = require('./routes/cases');
app.use('/cases', casesRouter);

const evidenceRouter = require('./routes/evidence');
app.use('/evidence', evidenceRouter);

const witnessesRouter = require('./routes/witnesses');
app.use('/witnesses', witnessesRouter);

const hearingsRouter = require('./routes/hearings');
app.use('/hearings', hearingsRouter);

const victimsRouter = require('./routes/victims');
app.use('/victims', victimsRouter);

const adminRouter = require('./routes/admin');
app.use('/admin', adminRouter);

const prosecutorRouter = require('./routes/prosecutor');
app.use('/prosecutor', prosecutorRouter);

const lawyersRouter = require('./routes/lawyers');
app.use('/lawyers', lawyersRouter);

const pleaBargainsRouter = require('./routes/pleaBargains');
app.use('/plea-bargains', pleaBargainsRouter);

const investigationsRouter = require('./routes/investigations');
app.use('/investigations', investigationsRouter);

const bailDecisionsRouter = require('./routes/bailDecisions');
app.use('/bail-decisions', bailDecisionsRouter);

const medicalRecordsRouter = require('./routes/medicalRecords');
app.use('/medical-records', medicalRecordsRouter);

const nextOfKinRouter = require('./routes/nextOfKin');
app.use('/next-of-kin', nextOfKinRouter);

const correctionsRouter = require('./routes/corrections');
app.use('/corrections', correctionsRouter);

const warrantsRouter = require('./routes/warrants');
app.use('/warrants', warrantsRouter);

const searchWarrantsRouter = require('./routes/searchWarrants');
app.use('/search-warrants', searchWarrantsRouter);

const reportsRouter = require('./routes/reports');
app.use('/reports', reportsRouter);

const printRouter = require('./routes/print');
app.use('/print', printRouter);

const { router: notificationsRouter } = require('./routes/notifications');
app.use('/notifications', notificationsRouter);

app.get('/dashboard', async (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/auth/login');
  }
  const user = await prisma.user.findUnique({
    where: { id: req.session.userId },
    include: { role: true },
  });

  const { search, status, facility } = req.query;
  let where = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { caseNumber: { contains: search, mode: 'insensitive' } },
    ];
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

app.get('/police', checkRole(['Police']), (req, res) => {
  res.send('Police Dashboard');
});

app.get('/prosecutor', checkRole(['Prosecutor']), (req, res) => {
  res.send('Prosecutor Dashboard');
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
