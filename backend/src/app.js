const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');

dotenv.config();

const authRoutes = require('./routes/authRoutes');
const inquiryRoutes = require('./routes/inquiryRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const { errorHandler, AppError } = require('./middleware/errorHandler');

const app = express();

// Trust proxy for secure cookies in reverse-proxy environments (e.g., Render, Railway, Heroku)
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// 1. Security Headers via Helmet
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// 2. CORS Configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
];

if (process.env.FRONTEND_URL) {
  // Support comma-separated origins if provided
  process.env.FRONTEND_URL.split(',').forEach(origin => {
    const trimmed = origin.trim();
    if (trimmed && !allowedOrigins.includes(trimmed)) {
      allowedOrigins.push(trimmed);
    }
  });
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    return callback(new Error('CORS policy: Not allowed by Access-Control-Allow-Origin'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Requested-With'],
}));

// 3. Body and Cookie Parsers
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// 4. Rate Limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // limit each IP to 500 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  }
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // max 20 login attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many login attempts. Please try again after 15 minutes.'
  }
});

const inquiryLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // max 50 inquiries per hour per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Submission rate limit reached. Please wait before submitting another inquiry.'
  }
});

// Apply global rate limiting
app.use('/api', globalLimiter);

// 5. Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 6. Mount Feature Routers with specific rate limiters where appropriate
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/inquiries', inquiryLimiter, inquiryRoutes);
app.use('/api/dashboard', dashboardRoutes);

// 7. Catch-all for undefined routes
app.use('*', (req, res, next) => {
  next(new AppError(`Cannot ${req.method} ${req.originalUrl}. Route not found.`, 404));
});

// 8. Centralized Error Handler
app.use(errorHandler);

module.exports = app;
