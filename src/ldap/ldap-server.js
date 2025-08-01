// src/ldap/ldap-server.js

// 1. Load environment and introspect the JSON file
require('dotenv').config();
const fs   = require('fs');
const path = require('path');

const dataFile = process.env.LDAP_DB_FILE || './data/ldap-db.json';
const absPath  = path.resolve(dataFile);

console.log('⚙️  LDAP will use data file:', absPath);
console.log('📂  File exists?', fs.existsSync(absPath));

try {
  const lines = fs.readFileSync(absPath, 'utf8')
    .split('\n')
    .filter(Boolean);

  const dns = lines.map((line, i) => {
    try {
      const entry = JSON.parse(line);
      return entry.dn;
    } catch (err) {
      console.warn(`⚠️  Line ${i + 1} is malformed and will be skipped.`);
      return null;
    }
  }).filter(Boolean);

  console.log('✅ Loaded DNs:', dns);

  const dnCounts = dns.reduce((acc, dn) => {
    acc[dn] = (acc[dn] || 0) + 1;
    return acc;
  }, {});
  const duplicates = Object.entries(dnCounts).filter(([_, count]) => count > 1);
  if (duplicates.length) {
    console.warn('🚨 Duplicate DNs found:', duplicates);
  }
} catch (err) {
  console.error('❌ Could not read LDAP DB file:', err.message);
}

// 2. Load ldapjs and db module
const ldap = require('ldapjs');
const db   = require('./ldap-db');

const BASE_DN  = process.env.LDAP_BASE_DN;
const ADMIN_DN = process.env.LDAP_BIND_DN;
const ADMIN_PW = process.env.LDAP_BIND_PW;

const server = ldap.createServer();

// Admin bind
server.bind(ADMIN_DN, (req, res, next) => {
  if (req.credentials !== ADMIN_PW) {
    return next(new ldap.InvalidCredentialsError());
  }
  res.end();
  return next();
});

// User bind
server.bind(BASE_DN, (req, res, next) => {
  const dn       = req.dn.toString();
  const password = req.credentials;
  db.getEntry(dn, (err, entry) => {
    if (err || !entry || !db.verifyPassword(entry, password)) {
      return next(new ldap.InvalidCredentialsError());
    }
    res.end();
    return next();
  });
});

// Search
server.search(BASE_DN, (req, res, next) => {
  db.search(req.dn.toString(), req.filter, (err, entries) => {
    if (err) return next(err);
    entries.forEach(e => res.send({ dn: e.dn, attributes: e.attributes }));
    res.end();
    return next();
  });
});

// Add — wildcard handler for all DNs
server.add('', (req, res, next) => {
  const dn = req.dn.toString();
  console.log(`📥 Incoming ADD request for: ${dn}`);

  let attrs;
  try {
    const raw = req.toObject();
    console.log(`🔍 Raw req.toObject():`, raw);

    attrs = raw.attributes.reduce((acc, a) => {
      if (!a.type || !a.vals || !Array.isArray(a.vals) || a.vals.length === 0) {
        console.warn(`⚠️ Malformed attribute:`, a);
        return acc;
      }
      acc[a.type] = a.vals[0];
      return acc;
    }, {});
  } catch (parseErr) {
    console.error(`❌ Failed to parse attributes for ${dn}:`, parseErr.message);
    return next(new ldap.OperationsError('Attribute parsing failed'));
  }

  console.log(`📦 Parsed attributes:`, attrs);

  db.addEntry(dn, attrs, err => {
    if (err) {
      console.error(`❌ db.addEntry failed for ${dn}:`, err.message || err);
      return next(new ldap.OperationsError(err.message || 'Unknown error'));
    }
    console.log(`✅ Entry successfully added: ${dn}`);
    res.end();
    return next();
  });
});

// Start listening
const port = parseInt(process.env.LDAP_PORT, 10) || 1389;
server.listen(port, '0.0.0.0', () => {
  console.log(`Embedded LDAP running at ldap://0.0.0.0:${port}`);
});
