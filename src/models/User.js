const { aql } = require('arangojs');
const { getDb, getUsersCollection } = require('../../db/connection');

const normalizeEmail = (email = '') => email.trim().toLowerCase();

const toUser = (doc) => {
  if (!doc) return null;
  return {
    id: doc._key,
    _key: doc._key,
    email: doc.email,
    name: doc.name,
    role: doc.role || 'user',
    passwordHash: doc.passwordHash,
    refreshToken: doc.refreshToken || null,
  };
};

async function findByEmail(email) {
  const db = getDb();
  const users = getUsersCollection();
  const cursor = await db.query(aql`
    FOR u IN ${users}
      FILTER u.email == ${normalizeEmail(email)}
      LIMIT 1
      RETURN u
  `);
  const doc = await cursor.next();
  return toUser(doc);
}

async function findById(id) {
  if (!id) return null;
  const users = getUsersCollection();
  try {
    const doc = await users.document(id);
    return toUser(doc);
  } catch (err) {
    return null;
  }
}

async function countUsers() {
  const db = getDb();
  const users = getUsersCollection();
  const cursor = await db.query(aql`
    RETURN LENGTH(${users})
  `);
  const count = await cursor.next();
  return count || 0;
}

async function createUser({ email, passwordHash, name, role }) {
  const users = getUsersCollection();
  const doc = {
    email: normalizeEmail(email),
    passwordHash,
    name: name || '',
    role,
    refreshToken: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const meta = await users.save(doc);
  const stored = await users.document(meta._key);
  return toUser(stored);
}

async function saveRefreshToken(userId, refreshToken) {
  const users = getUsersCollection();
  await users.update(userId, {
    refreshToken,
    updatedAt: new Date().toISOString(),
  });
  const updated = await users.document(userId);
  return toUser(updated);
}

module.exports = {
  findByEmail,
  findById,
  countUsers,
  createUser,
  saveRefreshToken,
};
