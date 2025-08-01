const bcrypt = require('bcryptjs');
const Datastore = require('nedb');
require('dotenv').config();

const db = new Datastore({ filename: process.env.LDAP_DB_FILE, autoload: true });

const dn = 'uid=policetestuser,ou=users,dc=justice,dc=local';
const newPassword = 'test123';

const hashed = bcrypt.hashSync(newPassword, 10);

db.update({ dn }, { $set: { userPassword: hashed } }, {}, (err, numReplaced) => {
  if (err) {
    console.error('❌ Failed to update password:', err.message);
  } else {
    console.log(`✅ Password updated for ${dn}`);
  }
});
