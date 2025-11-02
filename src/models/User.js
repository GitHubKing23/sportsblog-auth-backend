/**
 * Lightweight ArangoDB-backed User model wrapper.
 * Provides the minimal API controllers expect:
 * - User.findOne({ ethereumAddress })
 * - User.findById(id)
 * - new User(obj).save()
 * - instances expose properties like ethereumAddress, nonce, roles, refreshToken
 */
const { connectDB, getUsersCollection } = require('../config/db');
const { aql } = require('arangojs');

// Ensure DB connection has been attempted by requiring connectDB in server startup.

class User {
  constructor(doc = {}) {
    // map document fields
    this._key = doc._key || (doc._id && doc._id.split('/')[1]) || doc._key;
    this._id = doc._id || (this._key ? `users/${this._key}` : undefined);
    this.ethereumAddress = doc.ethereumAddress;
    this.nonce = doc.nonce || null;
    this.roles = doc.roles || ['Commenter'];
    this.authMethods = doc.authMethods || ['ethereum'];
    this.refreshToken = doc.refreshToken || null;
    this.username = doc.username || null;
    // keep raw doc for updates
    this._raw = doc;
  }

  static async collection() {
    const col = getUsersCollection();
    if (!col) throw new Error('Users collection not initialized - ensure connectDB() ran');
    return col;
  }

  static async findOne(query = {}) {
    const dbCol = await User.collection();

    if (query.ethereumAddress) {
      const address = query.ethereumAddress.toLowerCase();
      // query by ethereumAddress
      const cursor = await dbCol.database.query(aql`
        FOR u IN ${dbCol}
          FILTER LOWER(u.ethereumAddress) == ${address}
          LIMIT 1
          RETURN u
      `);
      const data = await cursor.next();
      return data ? new User(data) : null;
    }

    // fallback: simple by example (first matching document)
    try {
      const data = await dbCol.firstExample(query);
      return new User(data);
    } catch (e) {
      return null;
    }
  }

  static async findById(id) {
    const dbCol = await User.collection();
    if (!id) return null;
    try {
      // id might be collection/KEY or just KEY
      let doc;
      if (id.includes('/')) {
        doc = await dbCol.document(id);
      } else {
        // try by key
        doc = await dbCol.document(id);
      }
      return new User(doc);
    } catch (e) {
      // not found
      return null;
    }
  }

  async save() {
    const dbCol = await User.collection();
    const doc = {
      ethereumAddress: this.ethereumAddress && this.ethereumAddress.toLowerCase(),
      nonce: this.nonce || null,
      roles: this.roles || ['Commenter'],
      authMethods: this.authMethods || ['ethereum'],
      refreshToken: this.refreshToken || null,
      username: this.username || null,
      updatedAt: new Date().toISOString()
    };

    try {
      if (this._key) {
        // update existing
        await dbCol.update(this._key, doc);
        const updated = await dbCol.document(this._key);
        Object.assign(this, updated);
        this._key = updated._key;
        this._id = updated._id;
        return this;
      } else {
        // insert new
        const meta = await dbCol.save(doc);
        const inserted = await dbCol.document(meta._key);
        Object.assign(this, inserted);
        this._key = inserted._key;
        this._id = inserted._id;
        return this;
      }
    } catch (err) {
      // try to detect unique conflict on ethereumAddress by finding existing and updating
      if (err && err.isArangoError) {
        // fallback: try find by address then update
        if (this.ethereumAddress) {
          const existing = await User.findOne({ ethereumAddress: this.ethereumAddress });
          if (existing) {
            this._key = existing._key;
            return this.save();
          }
        }
      }
      throw err;
    }
  }
}

module.exports = User;
