const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
  const token = req.cookies.auth_token;

  if (!token) {
    return res.status(401).redirect('/login');
  }

  jwt.verify(token, process.env.JWT_SECRET || 'super-secret-key', (err, decoded) => {
    if (err) {
      return res.status(401).redirect('/login');
    }
    req.user = decoded;
    next();
  });
}

function checkRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).redirect('/login');
        }

        const group = req.user.memberof.split(',')[0].split('=')[1];
        if (!allowedRoles.includes(group)) {
            return res.status(403).send('Forbidden');
        }

        next();
    };
}

module.exports = {
    verifyToken,
    checkRole
};
