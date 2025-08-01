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
  console.log(`🧪 Attempting to add entry: ${dn}`);
  console.log(`📦 Attributes:`, attrs);

  if (!dn || typeof dn !== 'string') {
    console.error('❌ Invalid DN');
    return cb(new Error('Invalid DN'));
  }

  if (!attrs || typeof attrs !== 'object') {
    console.error('❌ Invalid attributes');
    return cb(new Error('Invalid attributes'));
  }

  db.findOne({ dn }, (err, existing) => {
    if (err) {
      console.error(`❌ DB lookup failed for ${dn}:`, err.message);
      return cb(err);
    }

    if (existing) {
      console.warn(`🔁 Entry already exists: ${dn}`);
      return cb(new Error('EntryAlreadyExists'));
    }

    const hashedPassword = attrs.userPassword
      ? bcrypt.hashSync(attrs.userPassword, 10)
      : undefined;

    const entry = {
      dn,
      attributes: attrs,
      userPassword: hashedPassword
    };

    db.insert(entry, (err, newDoc) => {
      if (err) {
        console.error(`❌ Failed to insert ${dn}:`, err.message);
        return cb(err);
      }
      console.log(`✅ Entry added: ${dn}`);
      return cb(null);
    });
  });
}

function search(baseDN, filter, cb) {
  db.find({ dn: new RegExp(`${baseDN}$`) }, (err, docs) => {
    if (err) return cb(err);
    const results = docs.filter(doc => filter.matches(doc.attributes));
    cb(null, results);
  });
}

module.exports = { getEntry, verifyPassword, addEntry, search };
