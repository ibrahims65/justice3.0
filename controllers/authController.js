// controllers/authController.js
const ldap = require('../src/ldap/ldap-db');

exports.getLogin = (req, res) => {
  res.render('login', {
    pageTitle: 'Login'
  });
};

exports.postLogin = (req, res, next) => {
  console.log('🔍 [DEBUG] postLogin invoked, body:', req.body);
  const { uid, password } = req.body;
  const dn = `uid=${uid},ou=users,dc=justice,dc=local`;

  ldap.getEntry(dn, (err, entry) => {
    if (err) {
      console.error('🔍 [ERROR] LDAP lookup failed for DN:', dn, err);
      return next(err);
    }

    console.log('🔍 [DEBUG] LDAP entry for', dn, ':', entry);

    // no user found
    if (!entry) {
      console.warn('🔍 [DEBUG] No entry found for DN:', dn);
      req.flash('error', 'Invalid credentials');
      return res.redirect('/login');
    }

    // bad password
    const passwordOk = ldap.verifyPassword(entry, password);
    console.log(`🔍 [DEBUG] Password verify for UID=${uid}:`, passwordOk);
    if (!passwordOk) {
      console.warn('🔍 [DEBUG] Password mismatch for UID:', uid);
      req.flash('error', 'Invalid credentials');
      return res.redirect('/login');
    }

    // success: store minimal info in session
    req.session.user = {
      uid:      entry.attributes.uid,
      cn:       entry.attributes.cn,
      memberof: entry.attributes.memberof
    };
    console.log('🔍 [DEBUG] session after assignment:', req.session);
    console.log('🔍 [DEBUG] sessionID:', req.sessionID);

    // force save then redirect
    req.session.save(saveErr => {
      if (saveErr) {
        console.error('🔍 [ERROR] session.save failed:', saveErr);
        return next(saveErr);
      }

      // NOTE: if Set-Cookie is undefined here, your session middleware is mis-configured
      const setCookie = res.getHeader('Set-Cookie');
      console.log('🔍 [DEBUG] outgoing Set-Cookie header:', setCookie);

      const group = entry.attributes.memberof.split('=')[1].toLowerCase();
      console.log('🔍 [DEBUG] redirecting to /' + group);
      res.redirect(`/${group}`);
    });
  });
};

exports.getLogout = (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('⚠️ [ERROR] session.destroy failed:', err);
    }
    res.redirect('/login');
  });
};
