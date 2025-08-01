// scripts/bootstrap-ldap-db.js

require('dotenv').config();
const db = require('../src/ldap/ldap-db');   // your nedb wrapper
const BASE = process.env.LDAP_BASE_DN;
const OU_USERS  = process.env.LDAP_USERS_OU;
const OU_GROUPS = process.env.LDAP_GROUPS_OU;
const ADMIN_PW  = process.env.LDAP_BIND_PW;

// Helper to upsert an entry into Nedb
function upsert(dn, attrs) {
  return new Promise(res => {
    db.addEntry(dn, { ...attrs, userPassword: ADMIN_PW }, () => res());
  });
}

;(async () => {
  // 1) domain entry
  await upsert(BASE, {
    objectClass: ['domain'],
    dc: BASE.split(',')[0].split('=')[1]
  });

  // 2) users OU
  await upsert(
    `${OU_USERS},${BASE}`,
    { objectClass: ['organizationalUnit'], ou: OU_USERS }
  );

  // 3) groups OU
  await upsert(
    `${OU_GROUPS},${BASE}`,
    { objectClass: ['organizationalUnit'], ou: OU_GROUPS }
  );

  // 4) admin user (so -D bind actually exists)
  await upsert(
    `${process.env.LDAP_BIND_DN}`,
    {
      objectClass: ['inetOrgPerson'],
      cn: 'admin',
      sn: 'administrator',
      uid: 'admin'
    }
  );

  console.log('Bootstrapped domain, OUs, and admin into LDAP DB file');
  process.exit(0);
})();
