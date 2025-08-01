require('dotenv').config();
const ldap = require('ldapjs');

const client = ldap.createClient({
  url: `ldap://localhost:${process.env.LDAP_PORT || 1389}`
});

const ADMIN_DN = process.env.LDAP_BIND_DN;
const ADMIN_PW = process.env.LDAP_BIND_PW;

const parentOUs = [
  'ou=users,dc=justice,dc=local',
  'ou=groups,dc=justice,dc=local'
];

client.bind(ADMIN_DN, ADMIN_PW, err => {
  if (err) {
    console.error('❌ Admin bind failed:', err.message);
    return client.unbind();
  }

  parentOUs.forEach(dn => {
    client.search(dn, { scope: 'base' }, (err, res) => {
      if (err) {
        console.error(`❌ Search failed for ${dn}:`, err.message);
        return;
      }

      let found = false;
      res.on('searchEntry', entry => {
        found = true;
        console.log(`✅ Found parent OU: ${entry.objectName}`);
      });
      res.on('end', () => {
        if (!found) console.warn(`⚠️  Parent OU missing: ${dn}`);
      });
    });
  });
});
