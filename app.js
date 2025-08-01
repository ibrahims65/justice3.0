// app.js
require('dotenv').config();
const express       = require('express');
const path          = require('path');
const session       = require('express-session');
const cookieParser  = require('cookie-parser');
const logger        = require('morgan');

console.log('🚀 Justice 3.0 booting...');

// 🔒 Global error guards
process.on('uncaughtException', (err) => {
  console.error('🧨 Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('🧨 Unhandled Rejection:', reason);
});

const app = express();

// 🧩 Middleware
try {
  // 🧱 View engine setup
  const expressLayouts = require('express-ejs-layouts');
  app.use(expressLayouts);
  app.set('layout', 'layout');
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'ejs');
  console.log('✅ View engine configured');

  app.use(logger('dev'));
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  // initialize cookie-parser with your session secret
  // app.use(cookieParser(process.env.SESSION_SECRET || 'justice-secret'));
  app.use(cookieParser()); // no secret


  // session must come before flash
  app.use(session({
    name: 'justice.sid',
    secret: process.env.SESSION_SECRET || 'justice-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,         // 🔒 ensures cookie is not accessible via JS
      secure: false,          // 🔐 set to true if using HTTPS
      sameSite: 'lax',        // 🛡️ protects against CSRF
      maxAge: 1000 * 60 * 60  // ⏱️ 1 hour
    }
  }));

  app.get('/test-session', (req, res) => {
  req.session.foo = 'bar';
  res.send('Session set');
});


  // make session available in views
  app.use((req, res, next) => {
    res.locals.user            = req.session.user || null;
    next();
  });

  // breadcrumbs util
  const { getBreadcrumbs } = require('./utils/breadcrumbs');
  app.locals.getBreadcrumbs = getBreadcrumbs;

  app.use(express.static(path.join(__dirname, 'public')));
  app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));
  console.log('✅ Middleware configured');
} catch (err) {
  console.error('❌ Middleware setup failed:', err);
}

// 🛣️ Routes
try {
  const indexRouter = require('./routes/index');
  const authRouter  = require('./routes/auth');

  // auth (login, logout)
  app.use('/', authRouter);

  // public home, dashboard, etc.
  app.use('/', indexRouter);
  app.use('/police', require('./routes/police'));
  app.use('/cases', require('./routes/cases'));
  app.use('/reports', require('./routes/reports'));
  app.use('/prosecutor', require('./routes/prosecutor'));
  app.use('/court', require('./routes/court'));
  app.use('/corrections', require('./routes/corrections'));
  app.use('/remand', require('./routes/remand'));
  app.use('/warrants', require('./routes/warrants'));
  app.use('/api/search', require('./routes/api/search.routes'));
  app.use('/api/bookings', require('./routes/api/bookings'));
  app.use('/api/admin', require('./routes/api/admin'));
  app.use('/admin', require('./routes/admin'));

  console.log('✅ Routes registered');
} catch (err) {
  console.error('❌ Route registration failed:', err);
}

// 🧪 Health check
app.get('/health', (req, res) => {
  res.send('Justice 3.0 is alive');
});

// ❗️ Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res
    .status(err.status || 500)
    .render('error', {
      message: err.message,
      error:   app.get('env') === 'development' ? err : {},
      req
    });
});

// 🚦 Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});

module.exports = app;
