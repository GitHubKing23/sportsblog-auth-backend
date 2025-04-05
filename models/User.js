import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  ethereumAddress: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  nonce: {
    type: String,
    required: true,
    default: () => Math.random().toString(36).substring(2, 15) // Optional: More readable nonce
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

export default mongoose.model('User', UserSchema);
