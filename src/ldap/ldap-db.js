// src/ldap/ldap-db.js
const Datastore = require('nedb');
const bcrypt    = require('bcryptjs');
const path      = process.env.LDAP_DB_FILE;

const db = new Datastore({ filename: path, autoload: true });

function getEntry(dn, cb) {
  db.findOne({ dn }, cb);
}

function verifyPassword(entry, pwd) {
  return bcrypt.compareSync(pwd, entry.userPassword);
}

function addEntry(dn, attrs, cb) {
  attrs.userPassword = bcrypt.hashSync(attrs.userPassword, 10);
  db.update({ dn }, { dn, attributes: attrs, userPassword: attrs.userPassword }, { upsert: true }, cb);
}

function search(baseDN, filter, cb) {
  db.find({ dn: new RegExp(`${baseDN}$`) }, (err, docs) => {
    if (err) return cb(err);
    const results = docs.filter(doc => filter.matches(doc.attributes));
    cb(null, results);
  });
}

module.exports = { getEntry, verifyPassword, addEntry, search };
