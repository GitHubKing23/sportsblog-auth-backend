/**
 * Simple script to verify ArangoDB connection and the users collection/index.
 * Run: node scripts/test-arango-connection.js
 */
const { Database, aql } = require('arangojs');

(async function run() {
  try {
    const url = process.env.ARANGO_URL || 'http://127.0.0.1:8529';
    const dbName = process.env.ARANGO_DB_NAME || 'AUTHBACKEND';
    const username = process.env.ARANGO_USERNAME || 'root';
    const password = process.env.ARANGO_PASSWORD || '';

    const db = new Database({
      url,
      databaseName: dbName,
      auth: username ? { username, password } : undefined,
    });

    const { version } = await db.version();
    console.log('ArangoDB version:', version);

    const users = db.collection('users');
    const exists = await users.exists();
    console.log(`Collection 'users': ${exists ? 'exists' : 'MISSING'}`);

    if (exists) {
      const indexes = await users.indexes();
      const emailIndex = indexes.find((idx) => idx.fields && idx.fields.includes('email'));
      console.log(`users.email index: ${emailIndex ? 'present' : 'missing'}`);

      const countCursor = await db.query(aql`RETURN LENGTH(${users})`);
      const count = await countCursor.next();
      console.log(`User documents: ${count || 0}`);
    }

    console.log('✅ ArangoDB connection test completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ ArangoDB connection test failed:', error.message || error);
    process.exit(2);
  }
})();
