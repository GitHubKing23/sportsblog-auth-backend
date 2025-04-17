import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
  },
  passwordHash: {
    type: String,
  },
  ethereumAddress: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
  },
  nonce: {
    type: String,
    default: null,
  },
  roles: {
    type: [String],
    default: ['Commenter'],
  },
  authMethods: {
    type: [String],
    enum: ['email', 'ethereum'],
    default: [],
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
export default User;
