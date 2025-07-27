const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    req.user = req.session.user; // make user available to downstream routes
    next();
  } else {
    res.redirect('/auth/login');
  }
};

const checkRole = (roles) => {
  return (req, res, next) => {
    if (req.session.user && roles.includes(req.session.user.role)) {
      next();
    } else {
      res.status(403).send('Forbidden');
    }
  };
};

module.exports = { isAuthenticated, checkRole };
