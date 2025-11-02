/**
 * Simple script to verify ArangoDB connection and required collections/indexes.
 * Run: node scripts/test-arango-connection.js
 */
const { Database } = require('arangojs');

(async function () {
  try {
    const url = process.env.ARANGO_URL || 'http://127.0.0.1:8529';
    const dbName = process.env.ARANGO_DB_NAME || 'AUTHBACKEND';
    const username = process.env.ARANGO_USERNAME || 'root';
    const password = process.env.ARANGO_PASSWORD || '';

    const db = new Database({ url });
    if (username) db.useBasicAuth(username, password);
    db.useDatabase(dbName);

    const ver = await db.version();
    console.log('ArangoDB version:', ver.version);

    const collections = ['users', 'comments', 'cmsdashboards'];
    for (const name of collections) {
      const col = db.collection(name);
      const exists = await col.exists();
      console.log(`Collection '${name}': ${exists ? 'exists' : 'MISSING'}`);
    }

    // try to inspect index on users
    try {
      const users = db.collection('users');
      const indexes = await users.indexes();
      const found = indexes.find(i => i.fields && i.fields.includes('ethereumAddress'));
      console.log('users.ethereumAddress index:', found ? JSON.stringify(found) : 'not found');
    } catch (e) {
      console.warn('Could not list indexes for users collection:', e.message || e);
    }

    console.log('✅ ArangoDB connection test completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ ArangoDB connection test failed:', err && err.message ? err.message : err);
    process.exit(2);
  }
})();
