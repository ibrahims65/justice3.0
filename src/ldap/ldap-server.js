// src/ldap/ldap-server.js
const ldap   = require('ldapjs');
const db     = require('./ldap-db');
require('dotenv').config();

const BASE_DN      = process.env.LDAP_BASE_DN;
const ADMIN_DN     = process.env.LDAP_BIND_DN;
const ADMIN_PW     = process.env.LDAP_BIND_PW;

const server = ldap.createServer();

// Admin bind
server.bind(ADMIN_DN, (req, res, next) => {
  if (req.credentials !== ADMIN_PW) {
    return next(new ldap.InvalidCredentialsError());
  }
  res.end(); return next();
});

// User bind (authentication)
server.bind(BASE_DN, (req, res, next) => {
  const dn       = req.dn.toString();
  const password = req.credentials;
  db.getEntry(dn, (err, entry) => {
    if (err || !entry || !db.verifyPassword(entry, password)) {
      return next(new ldap.InvalidCredentialsError());
    }
    res.end(); return next();
  });
});

// Search
server.search(BASE_DN, (req, res, next) => {
  db.search(req.dn.toString(), req.filter, (err, entries) => {
    if (err) return next(err);
    entries.forEach(e => res.send({ dn: e.dn, attributes: e.attributes }));
    res.end(); return next();
  });
});

// Add (for admin UI/scripts)
server.add(BASE_DN, (req, res, next) => {
  const dn    = req.dn.toString();
  const attrs = req.toObject().attributes.reduce((acc, a) => {
    acc[a.type] = a.vals[0]; return acc;
  }, {});
  db.addEntry(dn, attrs, err => {
    if (err) return next(new ldap.EntryAlreadyExistsError(dn));
    res.end(); return next();
  });
});

// Start listening
const port = parseInt(process.env.LDAP_PORT, 10);
server.listen(port, '0.0.0.0', () => {
  console.log(`Embedded LDAP running at ldap://0.0.0.0:${port}`);
});
