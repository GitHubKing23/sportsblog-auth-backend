// ArangoDB connection using arangojs
const { Database } = require('arangojs');

let db;
let usersCollection;

const connectDB = async () => {
  try {
    const url = process.env.ARANGO_URL || 'http://127.0.0.1:8529';
    const dbName = process.env.ARANGO_DB_NAME || 'sportsblog_auth';
    const username = process.env.ARANGO_USERNAME || 'root';
    const password = process.env.ARANGO_PASSWORD || '';

    db = new Database({
      url,
      databaseName: dbName,
      auth: username ? { username, password } : undefined,
    });

    const info = await db.version();
    console.log('🔗 ArangoDB Connected, version:', info.version);

    // ensure required collections exist: users, comments, cmsdashboards
    const ensureCollection = async (name) => {
      const col = db.collection(name);
      const ex = await col.exists();
      if (!ex) {
        await col.create();
        console.log(`🗂 Created ArangoDB collection: ${name}`);
      }
      return col;
    };

    usersCollection = await ensureCollection('users');
    await ensureCollection('comments');
    await ensureCollection('cmsdashboards');
    // ensure unique index on ethereumAddress to avoid duplicate addresses
    try {
      // arangojs doesn't support createHashIndex in older versions; use ensureIndex if available
      if (typeof usersCollection.createHashIndex === 'function') {
        await usersCollection.createHashIndex(['ethereumAddress'], { unique: true });
      } else if (typeof usersCollection.ensureIndex === 'function') {
        await usersCollection.ensureIndex({ type: 'hash', fields: ['ethereumAddress'], unique: true });
      }
      console.log('🔐 Ensured unique index on users.ethereumAddress');
    } catch (err) {
      // index may already exist or the driver may throw - ignore non-fatal
      console.warn('⚠️ Could not ensure unique index on users.ethereumAddress -', err.message || err);
    }
  } catch (error) {
    console.error('❌ ArangoDB Connection Error:', error.message || error);
    process.exit(1);
  }
};

const getDb = () => db;
const getUsersCollection = () => usersCollection;

module.exports = { connectDB, getDb, getUsersCollection };
