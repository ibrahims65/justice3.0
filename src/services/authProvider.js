// src/services/authProvider.js
const ldap = require('ldapjs');
require('dotenv').config();

function authenticate(username, password) {
  const client = ldap.createClient({ url: `ldap://localhost:${process.env.LDAP_PORT}` });
  const userDN = `uid=${username},${process.env.LDAP_USERS_OU},${process.env.LDAP_BASE_DN}`;
  return new Promise((resolve, reject) => {
    client.bind(userDN, password, err => {
      client.unbind();
      if (err) return reject(new Error('Invalid credentials'));
      resolve({ username, dn: userDN });
    });
  });
}

module.exports = { authenticate };
