const isAuthenticated = (req, res, next) => {
  if (req.session.userId) {
    next();
  } else {
    res.redirect('/auth/login');
  }
};

const checkRole = (roles) => {
  return (req, res, next) => {
    if (req.session.userId && roles.includes(req.session.role)) {
      next();
    } else {
      res.status(403).send('Forbidden');
    }
  };
};

module.exports = { isAuthenticated, checkRole };
