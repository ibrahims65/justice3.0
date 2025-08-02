// middleware/auth.js

// ensure user is logged in
exports.ensureAuthenticated = (req, res, next) => {
  if (req.session.user) {
    return next();
  }
  req.flash('error', 'Please log in first');
  res.redirect('/login');
};

// check that session.user.memberof matches one of the allowed roles
exports.checkRole = (...allowedRoles) => (req, res, next) => {
  if (!req.session.user) {
    req.flash('error', 'Please log in first');
    return res.redirect('/login');
  }

  // memberof is like "cn=Police,ou=groups,dc=justice,dc=local"
  const group = req.session.user.memberof.split('=')[1];
  if (!allowedRoles.includes(group)) {
    req.flash('error', 'Permission denied');
    return res.redirect('/');
  }

  next();
};

// 🔐 ensure user is in the Admin group
exports.ensureAdmin = (req, res, next) => {
  if (!req.session.user) {
    req.flash('error', 'Please log in first');
    return res.redirect('/login');
  }

  const group = req.session.user.memberof.split('=')[1];
  if (group.toLowerCase() !== 'admin') {
    req.flash('error', 'Admin access required');
    return res.redirect('/');
  }

  next();
};
