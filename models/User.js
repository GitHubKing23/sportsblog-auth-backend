import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    walletAddress: { type: String, required: true, unique: true },
    nonce: { type: Number, required: true, default: () => Math.floor(Math.random() * 1000000) }
});

export default mongoose.model('User', UserSchema);
