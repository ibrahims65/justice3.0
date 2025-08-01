// controllers/authController.js
const { authenticate } = require('../src/services/authProvider');

exports.getLogin = (req, res) => {
  res.render('login', { error: req.flash('error') });
};

exports.postLogin = async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await authenticate(username, password);
    req.session.user = user; // or generate JWT
    res.redirect('/police');
  } catch (e) {
    req.flash('error', 'Invalid credentials');
    res.redirect('/login');
  }
};

exports.getLogout = (req, res, next) => {
  req.session.destroy(err => {
    if (err) return next(err);
    res.redirect('/login');
  });
};
