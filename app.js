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

app.use('/auth', authRouter);

const inmatesRouter = require('./routes/inmates');
app.use('/inmates', inmatesRouter);

const casesRouter = require('./routes/cases');
app.use('/cases', casesRouter);

app.get('/dashboard', async (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/auth/login');
  }
  const user = await prisma.user.findUnique({
    where: { id: req.session.userId },
    include: { role: true },
  });
  res.render('dashboard', { user });
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
