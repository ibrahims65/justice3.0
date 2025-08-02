const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).send('No token');

  jwt.verify(token, process.env.JWT_SECRET || 'super-secret-key', (err, payload) => {
    if (err) return res.status(401).send('Invalid token');
    req.user = payload;
    next();
  });
}

module.exports = verifyToken;
