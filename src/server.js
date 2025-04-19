const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
const authRoutes = require("./routes/ethereumAuthRoutes");

// ✅ Load .env file
dotenv.config({ path: path.join(__dirname, "../.env") });

console.log("🔧 Loaded ENV variables:");
console.log("- PORT:", process.env.PORT);
console.log("- FRONTEND_URL:", process.env.FRONTEND_URL);
console.log("- MONGO_URI:", process.env.MONGO_URI ? "✅ Exists" : "❌ Missing");
console.log("- JWT_SECRET:", process.env.JWT_SECRET ? "✅ Exists" : "❌ Missing");

const app = express();
const server = http.createServer(app);

// ✅ Socket setup
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "https://sportifyinsider.com"],
    credentials: true,
  },
});
app.set("io", io);

// ✅ CORS config
const allowedOrigins = ["http://localhost:3000", "https://sportifyinsider.com"];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`❌ Blocked by CORS: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());

// ✅ Log all incoming requests
app.use((req, res, next) => {
  console.log(`📥 Incoming request: ${req.method} ${req.url}`);
  next();
});

// ✅ DB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB Connected"))
.catch((err) => {
  console.error("❌ MongoDB connection failed:", err);
  process.exit(1);
});

// ✅ Mount routes at root (not /api/auth) to avoid NGINX double prefix issue
app.use("/", authRoutes);

// ✅ Test route
app.get("/", (req, res) => {
  res.send("✅ Ethereum Auth API is running...");
});

// ✅ Socket events
io.on("connection", (socket) => {
  console.log("✅ A user connected:", socket.id);
  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});

// ✅ Start server
const PORT = process.env.PORT || 5003;
server.listen(PORT, "0.0.0.0", () =>
  console.log(`🚀 Ethereum Auth Server running on http://0.0.0.0:${PORT}`)
);
