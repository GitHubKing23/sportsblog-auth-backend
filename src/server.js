import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import authRoutes from '../routes/auth.js';
import path from 'path';
import { fileURLToPath } from 'url';

// 🔧 Ensure .env is loaded from the project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// 🔍 Show what env variables we’re loading
console.log("🔧 Loaded ENV variables:");
console.log("- PORT:", process.env.PORT);
console.log("- FRONTEND_URL:", process.env.FRONTEND_URL);
console.log("- MONGO_URI:", process.env.MONGO_URI ? "✅ Exists" : "❌ Missing");
console.log("- JWT_SECRET:", process.env.JWT_SECRET ? "✅ Exists" : "❌ Missing");

const app = express();
app.use(express.json());

// ✅ CORS setup
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));

// ✅ MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => {
    console.error("❌ MongoDB connection failed:");
    console.error(err);
    process.exit(1); // Optional: Exit if DB fails
  });

// ✅ Ethereum Auth Routes
app.use('/auth', authRoutes);

// ✅ Health Check
app.get('/', (req, res) => {
  res.send('✅ Ethereum Auth API is running...');
});

// ✅ Start Server
const PORT = process.env.PORT || 5003;
console.log("🚀 Starting Ethereum Auth Server on port:", PORT);
app.listen(PORT, () => console.log(`🚀 Ethereum Auth Server running on port ${PORT}`));
