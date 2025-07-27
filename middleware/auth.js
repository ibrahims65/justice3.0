const isAuthenticated = (req, res, next) => {
  if (req.session.userId) {
    next();
  } else {
    res.redirect('/auth/login');
  }
};

const checkRole = (roles) => {
  return (req, res, next) => {
    if (req.session.user && roles.includes(req.session.user.role.name)) {
      next();
    } else {
      res.status(403).send('Forbidden');
    }
  };
};

module.exports = { isAuthenticated, checkRole };
