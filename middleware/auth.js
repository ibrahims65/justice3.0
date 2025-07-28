const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    req.user = req.session.user; // make user available to downstream routes
    next();
  } else {
    res.redirect('/auth/login');
  }
};

const ensureAdmin = (req, res, next) => {
  if (req.session.user && req.session.user.role && req.session.user.role.name === 'SuperAdmin') {
    return next();
  }
  res.status(403).send('Forbidden');
};

const checkRole = (roles) => {
  return (req, res, next) => {
    if (req.session.user && roles.map(r => r.toLowerCase()).includes(req.session.user.role.name.toLowerCase())) {
      next();
    } else {
      res.status(403).send('Forbidden');
    }
  };
};

module.exports = { isAuthenticated, checkRole, ensureAdmin };
