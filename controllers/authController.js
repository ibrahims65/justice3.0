// controllers/authController.js
const ldap = require('../src/ldap/ldap-db');

exports.getLogin = (req, res) => {
  res.render('login', { pageTitle: 'Login' });
};

exports.postLogin = (req, res, next) => {
  console.log('🔍 [DEBUG] postLogin invoked, body:', req.body);

  // support form fields named "uid" or "username"
  const uid   = req.body.uid || req.body.username;
  const pwd   = req.body.password;

  if (!uid || !pwd) {
    console.warn('🔍 [DEBUG] Missing credentials:', { uid, pwd });
    req.flash('error', 'Invalid credentials');
    return res.redirect('/login');
  }

  const dn = `uid=${uid},ou=users,dc=justice,dc=local`;
  console.log('🔍 [DEBUG] constructed DN:', dn);

  ldap.getEntry(dn, (err, entry) => {
    if (err) {
      console.error('🔍 [ERROR] LDAP lookup failed for DN:', dn, err);
      return next(err);
    }

    console.log('🔍 [DEBUG] LDAP entry:', entry);

    if (!entry) {
      console.warn('🔍 [DEBUG] No entry for DN:', dn);
      req.flash('error', 'Invalid credentials');
      return res.redirect('/login');
    }

    const ok = ldap.verifyPassword(entry, pwd);
    console.log(`🔍 [DEBUG] password verify for "${uid}":`, ok);
    if (!ok) {
      req.flash('error', 'Invalid credentials');
      return res.redirect('/login');
    }

    // success: stash user
    req.session.user = {
      uid:      entry.attributes.uid,
      cn:       entry.attributes.cn,
      memberof: entry.attributes.memberof
    };
    console.log('🔍 [DEBUG] session after assignment:', req.session);

    req.session.save(saveErr => {
      if (saveErr) {
        console.error('🔍 [ERROR] session.save failed:', saveErr);
        return next(saveErr);
      }

      // should now show your cookie header
      console.log('🔍 [DEBUG] Set-Cookie header:', res.getHeader('Set-Cookie'));

      // redirect by group
      const group = entry.attributes.memberof.split('=')[1].toLowerCase();
      res.redirect(`/${group}`);
    });
  });
};

exports.getLogout = (req, res) => {
  req.session.destroy(err => {
    if (err) console.error('⚠️ session.destroy failed:', err);
    res.redirect('/login');
  });
};
