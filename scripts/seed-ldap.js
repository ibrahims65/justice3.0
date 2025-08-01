// scripts/seed-ldap.js
const ldap = require('ldapjs');
const fs   = require('fs');
const users = require('./initial-users.json');
require('dotenv').config();

const client = ldap.createClient({ url: `ldap://localhost:${process.env.LDAP_PORT || 1389}` });

const ADMIN_DN = process.env.LDAP_BIND_DN;
const ADMIN_PW = process.env.LDAP_BIND_PW;
const BASE_DN  = process.env.LDAP_BASE_DN;

function safeAdd(dn, entry) {
  return new Promise((resolve) => {
    client.add(dn, entry, (err) => {
      if (err) {
        const name = err.name || '';
        const msg  = err.message || '';

        if (name === 'EntryAlreadyExistsError' || msg.includes('EntryAlreadyExists')) {
          console.log(`🔁 Skipping existing entry: ${dn}`);
        } else if (name === 'OperationsError' && msg.includes('EntryAlreadyExists')) {
          console.log(`🔁 Skipping existing entry (OperationsError): ${dn}`);
        } else {
          console.error(`❌ Failed to add ${dn}:`, msg);
        }
      } else {
        console.log(`✅ Added: ${dn}`);
      }
      resolve();
    });
  });
}

client.bind(ADMIN_DN, ADMIN_PW, async (err) => {
  if (err) {
    console.error('❌ Admin bind failed:', err.message);
    client.unbind();
    return;
  }

  // Step 1: Seed parent OUs
  await safeAdd(`ou=users,${BASE_DN}`, {
    objectClass: ['organizationalUnit'],
    ou: 'users'
  });

  await safeAdd(`ou=groups,${BASE_DN}`, {
    objectClass: ['organizationalUnit'],
    ou: 'groups'
  });

  // Step 2: Seed users
  for (const u of users) {
    const dn = `uid=${u.username},ou=users,${BASE_DN}`;
    const entry = {
      cn: u.cn,
      sn: u.sn,
      uid: u.username,
      objectClass: ['inetOrgPerson'],
      userPassword: u.userPassword,
      ...(u.memberOf && { memberOf: u.memberOf })
    };
    await safeAdd(dn, entry);
  }

  console.log('🏁 All entries processed.');
  client.unbind();
});
