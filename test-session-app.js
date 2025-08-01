const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');

const app = express();
const port = 3001;

app.use(cookieParser());

app.use(session({
  name: 'test.sid',
  secret: 'a-very-secret-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60
  }
}));

app.use(flash());

// EXACT SAME res.locals middleware as in app.js
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.successMessages = req.flash('success');
  res.locals.errorMessages = req.flash('error');
  next();
});

app.get('/set', (req, res) => {
  req.session.user = { id: 1, name: 'test' }; // Set a user object
  req.session.test = 'hello world';
  req.flash('success', 'This is a success flash message!');
  console.log('Session set:', req.session);
  res.send('Session variable and flash message set. Check /get');
});

app.get('/get', (req, res) => {
  console.log('Session get:', req.session);
  if (req.session.test) {
    res.send(`User: ${JSON.stringify(res.locals.user)}, Session variable: ${req.session.test}`);
  } else {
    res.send('Session variable not found.');
  }
});

app.listen(port, () => {
  console.log(`Minimal repro app listening on port ${port}`);
});
