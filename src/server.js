import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import authRoutes from '../routes/auth.js'; // adjust if needed
import path from 'path';
import { fileURLToPath } from 'url';

// ✅ Load environment variables from .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// ✅ Debug: Show loaded ENV variables
console.log("🔧 Loaded ENV variables:");
console.log("- PORT:", process.env.PORT);
console.log("- FRONTEND_URL:", process.env.FRONTEND_URL);
console.log("- MONGO_URI:", process.env.MONGO_URI ? "✅ Exists" : "❌ Missing");
console.log("- JWT_SECRET:", process.env.JWT_SECRET ? "✅ Exists" : "❌ Missing");

const app = express();

// ✅ Multi-Origin CORS Setup
const allowedOrigins = [
  'http://localhost:3000',
  'https://sportifyinsider.com',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`❌ Blocked by CORS: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// ✅ Body parser
app.use(express.json());

// ✅ Request Logger (for debugging)
app.use((req, res, next) => {
  console.log(`📥 Incoming request: ${req.method} ${req.url}`);
  next();
});

// ✅ MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => {
    console.error("❌ MongoDB connection failed:");
    console.error(err);
    process.exit(1); // Exit if DB fails
  });

// ✅ Ethereum Auth Routes
app.use('/auth', authRoutes);

// ✅ Health check endpoint
app.get('/', (req, res) => {
  res.send('✅ Ethereum Auth API is running...');
});

// ✅ Start server and allow external connections
const PORT = process.env.PORT || 5003;
console.log("🚀 Starting Ethereum Auth Server on port:", PORT);

app.listen(PORT, '0.0.0.0', () =>
  console.log(`🚀 Ethereum Auth Server running on http://0.0.0.0:${PORT}`)
);
