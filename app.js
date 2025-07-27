// app.js

const express = require('express');
const path = require('path');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

console.log('🚀 Justice 3.0 booting...');

process.on('uncaughtException', (err) => {
  console.error('🧨 Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🧨 Unhandled Rejection:', reason);
});

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');

const app = express();

// 🧱 View engine setup
try {
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
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(session({
    secret: 'justice-secret',
    resave: false,
    saveUninitialized: true,
  }));
  console.log('✅ Middleware configured');
} catch (err) {
  console.error('❌ Middleware setup failed:', err);
}

// 🛣️ Routes
try {
  app.use('/', indexRouter);
  app.use('/users', usersRouter);
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

module.exports = app;
