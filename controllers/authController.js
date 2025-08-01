// controllers/authController.js
const ldap = require('../src/ldap/ldap-db');

exports.getLogin = (req, res) => {
  res.render('login', {
    pageTitle: 'Login'
  });
};

exports.postLogin = (req, res, next) => {
  const { uid, password } = req.body;
  const dn = `uid=${uid},ou=users,dc=justice,dc=local`;

  ldap.getEntry(dn, (err, entry) => {
    if (err) return next(err);

    // no user or bad password
    if (!entry || !ldap.verifyPassword(entry, password)) {
      req.flash('error', 'Invalid credentials');
      return res.redirect('/login');
    }

    // store minimal info in session
    req.session.user = {
      uid:      entry.attributes.uid,
      cn:       entry.attributes.cn,
      memberof: entry.attributes.memberof
    };

    // DEBUG: inspect session before save
    console.log('🔍 [DEBUG] session before save:', JSON.stringify(req.session));

    // force save then redirect by group
    req.session.save(saveErr => {
      if (saveErr) return next(saveErr);

      // DEBUG: inspect outgoing Set-Cookie header
      const setCookie = res.getHeader('Set-Cookie');
      console.log('🔍 [DEBUG] Set-Cookie header:', setCookie);

      const group = req.session.user.memberof.split('=')[1].toLowerCase();
      res.redirect(`/${group}`);
    });
  });
};

exports.getLogout = (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('⚠️ [ERROR] session destroy failed:', err);
    }
    res.redirect('/login');
  });
};
