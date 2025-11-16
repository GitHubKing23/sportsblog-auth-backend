const { Database } = require('arangojs');

let dbInstance;
let usersCollection;

async function connectDB() {
  if (dbInstance && usersCollection) {
    return { db: dbInstance, usersCollection };
  }

  const url = process.env.ARANGO_URL || 'http://127.0.0.1:8529';
  const databaseName = process.env.ARANGO_DB_NAME || 'AUTHBACKEND';
  const username = process.env.ARANGO_USERNAME || 'root';
  const password = process.env.ARANGO_PASSWORD || '';

  dbInstance = new Database({
    url,
    databaseName,
    auth: username ? { username, password } : undefined,
  });

  usersCollection = dbInstance.collection('users');
  const exists = await usersCollection.exists();
  if (!exists) {
    await usersCollection.create();
    console.log('🗂️ Created ArangoDB collection: users');
  }

  try {
    await usersCollection.ensureIndex({
      type: 'hash',
      fields: ['email'],
      unique: true,
      sparse: true,
    });
    console.log('🔐 Ensured unique index on users.email');
  } catch (err) {
    console.warn('⚠️ Unable to ensure unique index on users.email:', err.message || err);
  }

  return { db: dbInstance, usersCollection };
}

function getDb() {
  if (!dbInstance) {
    throw new Error('Database has not been initialized. Call connectDB() first.');
  }
  return dbInstance;
}

function getUsersCollection() {
  if (!usersCollection) {
    throw new Error('Users collection has not been initialized. Call connectDB() first.');
  }
  return usersCollection;
}

module.exports = {
  connectDB,
  getDb,
  getUsersCollection,
};
