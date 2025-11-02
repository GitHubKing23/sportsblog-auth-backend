const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB } = require('./config/db');

dotenv.config();
// initialize ArangoDB connection
connectDB();

const app = express();
app.use(cors());

// Protect against empty JSON body parsing errors (e.g. GET with Content-Type set but no body)
app.use((req, res, next) => {
  const ct = req.headers['content-type'] || '';
  const cl = req.headers['content-length'];
  if (ct.includes('application/json') && (cl === '0' || cl === undefined)) {
    delete req.headers['content-type'];
  }
  next();
});

// ensure JSON body parsing
app.use(express.json());

// Add JSON parse error handler (friendly response)
app.use((err, req, res, next) => {
  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Malformed JSON body' });
  }
  if (err && err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Malformed JSON body' });
  }
  next(err);
});

// Routes
const ethereumAuthRoutes = require('./routes/ethereumAuthRoutes');
const refreshRoutes = require('./routes/refreshRoutes');
const protectedRoutes = require('./routes/protected'); // added

// 🔍 Debug line to verify what is being exported
console.log('refreshRoutes type:', typeof refreshRoutes); // 👈 This should log "function"

app.use('/auth/ethereum', ethereumAuthRoutes);
app.use('/auth', refreshRoutes);
app.use('/protected', protectedRoutes); // added

app.get('/', (req, res) => {
  res.send('✅ Sports Blog Authentication Backend is running (Ethereum only)!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
