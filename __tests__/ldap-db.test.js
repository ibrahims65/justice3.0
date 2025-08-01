const fs = require('fs');
const path = require('path');
const ldap = require('ldapjs');
const db = require('../src/ldap/ldap-db');

const TEST_DB_PATH = path.join(__dirname, 'test-ldap-db.json');

beforeAll(() => {
  process.env.LDAP_DB_FILE = TEST_DB_PATH;
});

afterAll(() => {
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
  }
});

describe('ldap-db', () => {
  const testDN = 'uid=testuser,ou=users,dc=justice,dc=local';
  const testAttrs = {
    cn: 'Test User',
    sn: 'User',
    uid: 'testuser',
    objectClass: 'inetOrgPerson',
    userPassword: 'password123',
  };

  test('addEntry should add a new entry to the database', (done) => {
    db.addEntry(testDN, { ...testAttrs }, (err, numReplaced, newDoc) => {
      expect(err).toBeNull();
      // with upsert: true, numReplaced is the new document
      expect(newDoc).toBeDefined();
      done();
    });
  });

  test('getEntry should retrieve an entry by DN', (done) => {
    db.getEntry(testDN, (err, entry) => {
      expect(err).toBeNull();
      expect(entry).toBeDefined();
      expect(entry.dn).toBe(testDN);
      expect(entry.attributes.cn).toBe('Test User');
      done();
    });
  });

  test('verifyPassword should correctly verify a password', (done) => {
    db.getEntry(testDN, (err, entry) => {
      expect(err).toBeNull();
      const isValid = db.verifyPassword(entry, 'password123');
      expect(isValid).toBe(true);
      const isInvalid = db.verifyPassword(entry, 'wrongpassword');
      expect(isInvalid).toBe(false);
      done();
    });
  });

  test('search should find entries matching a filter', (done) => {
    const filter = ldap.parseFilter('(uid=testuser)');
    db.search('ou=users,dc=justice,dc=local', filter, (err, results) => {
      expect(err).toBeNull();
      expect(results.length).toBe(1);
      expect(results[0].dn).toBe(testDN);
      done();
    });
  });

  test('search should not find entries not matching a filter', (done) => {
    const filter = ldap.parseFilter('(uid=nonexistent)');
    db.search('ou=users,dc=justice,dc=local', filter, (err, results) => {
      expect(err).toBeNull();
      expect(results.length).toBe(0);
      done();
    });
  });
});
