import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  walletAddress: {
    type: String,
    required: [true, 'Wallet address is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  nonce: {
    type: String,
    required: true,
    default: () => Math.random().toString(36).substring(2, 15), // readable nonce
  },
  authMethods: {
    type: [String],
    default: ['ethereum'],
  },
  roles: {
    type: [String],
    default: ['Commenter'],
  },
});

// Optional: prevent duplicate model registration in dev
export default mongoose.models.User || mongoose.model('User', UserSchema);
