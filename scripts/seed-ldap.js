// scripts/seed-ldap.js
const ldap = require('ldapjs');
const fs   = require('fs');
const users = require('./initial-users.json');
require('dotenv').config();

const client = ldap.createClient({ url: 'ldap://localhost:1389' });

client.bind(process.env.LDAP_BIND_DN, process.env.LDAP_BIND_PW, (err) => {
  if (err) {
    console.error('Bind failed:', err);
    client.unbind();
    return;
  }

  let completed = 0;
  users.forEach((u) => {
    const entry = {
      cn: u.cn,
      sn: u.sn,
      uid: u.username,
      objectClass: ['inetOrgPerson'],
      userPassword: u.userPassword,
      memberOf: u.memberOf,
    };
    const dn = `uid=${u.username},ou=users,${process.env.LDAP_BASE_DN}`;

    client.add(dn, entry, (err) => {
      completed++;
      if (err) {
        console.error(`Error adding ${u.username}:`, err.message);
      } else {
        console.log(`Added ${u.username}`);
      }

      if (completed === users.length) {
        console.log('All users processed.');
        client.unbind();
      }
    });
  });
});
