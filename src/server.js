const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Initialize Express
const app = express();

// Middleware setup
app.use(express.json());
app.use(cors());

// Import Routes
const ethereumAuthRoutes = require('./routes/ethereumAuthRoutes');

// Use Routes
app.use('/auth/ethereum', ethereumAuthRoutes);

// Basic route for testing
app.get('/', (req, res) => {
  res.send('Sports Blog Authentication Backend is running!');
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
