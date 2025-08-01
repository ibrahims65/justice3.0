// middleware/auth.js

exports.ensureAuthenticated = (req, res, next) => {
  if (req.session.user) {
    return next();
  }
  req.flash('error', 'Please log in first');
  res.redirect('/login');
};
