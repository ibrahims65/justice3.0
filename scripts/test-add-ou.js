require('dotenv').config();
const ldap = require('ldapjs');

const client = ldap.createClient({
  url: `ldap://localhost:${process.env.LDAP_PORT || 1389}`
});

const ADMIN_DN = process.env.LDAP_BIND_DN;
const ADMIN_PW = process.env.LDAP_BIND_PW;

const testDN = `ou=testou,${process.env.LDAP_BASE_DN}`;
const entry = {
  objectClass: ['organizationalUnit'],
  ou: 'testou'
};

client.bind(ADMIN_DN, ADMIN_PW, err => {
  if (err) {
    console.error('❌ Admin bind failed:', err.message);
    return client.unbind();
  }

  console.log(`🧪 Attempting to add: ${testDN}`);
  client.add(testDN, entry, err => {
    if (err) {
      console.error('❌ Add failed:', err.name, err.message);
      console.error('🧵 Full error:', err);
    } else {
      console.log(`✅ Successfully added: ${testDN}`);
    }
    client.unbind();
  });
});
