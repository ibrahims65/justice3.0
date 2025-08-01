// controllers/authController.js

// roles you want to spoof
const ALLOWED_ROLES = ['admin', 'officer', 'user'];

exports.getLogin = (req, res) => {
  // render login.ejs with the roles list
  res.render('login', { roles: ALLOWED_ROLES });
};

exports.postLogin = (req, res) => {
  const { username, role } = req.body;

  if (!username) {
    req.flash('error', 'Username is required');
    return res.redirect('/login');
  }
  if (!ALLOWED_ROLES.includes(role)) {
    req.flash('error', 'Invalid role selected');
    return res.redirect('/login');
  }

  // fake login: stash a minimal user object
  req.session.user = {
    id:       username,   // use username as ID
    username,
    role
  };

  req.flash('success', `Logged in as ${role}`);
  return res.redirect('/dashboard');
};

exports.getLogout = (req, res, next) => {
  req.session.destroy(err => {
    if (err) return next(err);
    res.redirect('/login');
  });
};
