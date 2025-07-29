const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    req.user = req.session.user; // make user available to downstream routes
    next();
  } else {
    res.redirect('/auth/login');
  }
};

function ensureAdmin(req, res, next) {
  const user = req.user || req.session.user;
  if (user && user.role && user.role.name === 'SuperAdmin') {
    return next();
  }
  return res.status(403).send('Forbidden');
}

const checkRole = (roles) => {
  return (req, res, next) => {
    if (req.session.user && roles.map(r => r.toLowerCase()).includes(req.session.user.role.name.toLowerCase())) {
      next();
    } else {
      res.status(403).send('Forbidden');
    }
  };
};

exports.ensureAuthenticated = isAuthenticated;
exports.ensureAdmin = ensureAdmin;

module.exports = { isAuthenticated, checkRole, ensureAdmin };
