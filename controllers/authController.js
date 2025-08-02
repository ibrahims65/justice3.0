const ldap = require('../src/ldap/ldap-db');
const jwt = require('jsonwebtoken');

exports.getLogin = (req, res) => {
  res.render('login', { pageTitle: 'Login' });
};

exports.postLogin = (req, res, next) => {
  const uid = req.body.uid || req.body.username;
  const pwd = req.body.password;

  if (!uid || !pwd) {
    return res.redirect('/login');
  }

  const dn = `uid=${uid},ou=users,dc=justice,dc=local`;

  ldap.getEntry(dn, (err, entry) => {
    if (err) {
      return next(err);
    }

    if (!entry) {
      return res.redirect('/login');
    }

    const ok = ldap.verifyPassword(entry, pwd);
    if (!ok) {
      return res.redirect('/login');
    }

    // Create a clean user object for the JWT payload
    const userPayload = {
      uid:      String(entry.attributes.uid || ''),
      cn:       String(entry.attributes.cn || ''),
      memberof: String(entry.attributes.memberof || '')
    };

    // Sign the JWT
    const token = jwt.sign(
        userPayload,
        process.env.JWT_SECRET || 'super-secret-key',
        { expiresIn: '1h' }
    );

    // Send the token in an httpOnly cookie
    res.cookie('auth_token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });

    const group = userPayload.memberof.split(',')[0].split('=')[1].toLowerCase();
    res.redirect(`/${group}`);
  });
};

exports.getLogout = (req, res) => {
    res.clearCookie('auth_token');
    res.redirect('/login');
};
