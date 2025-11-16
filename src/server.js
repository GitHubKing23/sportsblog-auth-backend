const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB } = require('../db/connection');

dotenv.config();
// initialize ArangoDB connection
connectDB()
  .then(() => console.log('✅ ArangoDB connection ready'))
  .catch((error) => {
    console.error('❌ Failed to connect to ArangoDB:', error);
    process.exit(1);
  });

const app = express();

const allowedOrigins = [
  'http://localhost:3000',
  'https://cms.sportifyinsider.com',
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

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
const authRoutes = require('./routes/authRoutes');
const protectedRoutes = require('./routes/protected');

app.use('/api/auth', authRoutes);
app.use('/protected', protectedRoutes);

app.get('/', (req, res) => {
  res.send('✅ Sports Blog Authentication Backend is running (Email + ArangoDB)!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
