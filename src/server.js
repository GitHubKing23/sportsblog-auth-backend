const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
const authRoutes = require("./routes/ethereumAuthRoutes");

dotenv.config({ path: path.join(__dirname, "../.env") });

console.log("🔧 Loaded ENV variables:");
console.log("- PORT:", process.env.PORT);
console.log("- FRONTEND_URL:", process.env.FRONTEND_URL);
console.log("- MONGO_URI:", process.env.MONGO_URI ? "✅ Exists" : "❌ Missing");
console.log("- JWT_SECRET:", process.env.JWT_SECRET ? "✅ Exists" : "❌ Missing");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "https://sportifyinsider.com"],
    credentials: true,
  },
});
app.set("io", io);

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

// ✅ Middleware: Logs all requests and headers
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.url} | Host: ${req.headers.host}`);
  next();
});

// ✅ TEST ROUTES to identify proxy_pass hits
app.post("/nonce", (req, res, next) => {
  console.log("🎯 Hit /nonce");
  next();
});
app.post("/auth/nonce", (req, res, next) => {
  console.log("🎯 Hit /auth/nonce");
  next();
});
app.post("/api/auth/nonce", (req, res, next) => {
  console.log("🎯 Hit /api/auth/nonce");
  next();
});

// ✅ Route Mounting
// Mount routes at root — we rely on nginx to forward to here
app.use("/", authRoutes);

// ✅ Basic test route
app.get("/", (req, res) => {
  res.send("✅ Ethereum Auth API is running...");
});

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB Connected"))
.catch((err) => {
  console.error("❌ MongoDB connection failed:", err);
  process.exit(1);
});

io.on("connection", (socket) => {
  console.log("✅ A user connected:", socket.id);
  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5003;
server.listen(PORT, "0.0.0.0", () =>
  console.log(`🚀 Ethereum Auth Server running on http://0.0.0.0:${PORT}`)
);
