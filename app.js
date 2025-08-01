// app.js
require('dotenv').config();
const express       = require('express');
const path          = require('path');
const session       = require('express-session');
const flash         = require('connect-flash');
const cookieParser  = require('cookie-parser');
const logger        = require('morgan');

console.log('🚀 Justice 3.0 booting...');

// 🔒 Error guards
process.on('uncaughtException', (err) => {
  console.error('🧨 Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🧨 Unhandled Rejection:', reason);
});

// 🔧 Initialize app FIRST
const app = express();

// 🧱 View engine setup
try {
  const expressLayouts = require('express-ejs-layouts');
  app.use(expressLayouts);
  app.set('layout', 'layout'); // This looks for views/layout.ejs
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'ejs');
  console.log('✅ View engine configured');
} catch (err) {
  console.error('❌ View engine setup failed:', err);
}

// 🧩 Middleware
try {
  app.use(logger('dev'));
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());

  // Session must come before flash
  app.use(session({
    secret: process.env.SESSION_SECRET || 'justice-secret',
    resave: false,
    saveUninitialized: true
  }));

  // Flash for one-time messages
  app.use(flash());

  // Make session user + flash messages available in all views
  app.use((req, res, next) => {
    res.locals.user             = req.session.user;
    res.locals.successMessages  = req.flash('success');
    res.locals.errorMessages    = req.flash('error');
    next();
  });

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
  const indexRouter     = require('./routes/index');
  const usersRouter     = require('./routes/users');
  const authRouter      = require('./routes/auth');
  const dashboardRouter = require('./routes/dashboard');

  // Mount auth routes at root so /login and /logout work
  app.use('/', authRouter);

  // Other routes
  app.use('/', indexRouter);
  app.use('/users', usersRouter);
  app.use('/dashboard', dashboardRouter);
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

// 🚦 Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});

// ❗️ Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res
    .status(err.status || 500)
    .render('error', {
      message: err.message,
      error: app.get('env') === 'development' ? err : {},
      req: req
    });
});

module.exports = app;
