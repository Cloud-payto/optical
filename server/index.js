const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

// Import security middleware
const {
  apiLimiter,
  webhookLimiter,
  authLimiter,
  expensiveOpsLimiter,
  sanitizeInputs,
  helmetConfig,
  requestLogger,
  secureErrorHandler
} = require('./middleware/security');

// Import routes
const webhookRoutes = require('./routes/webhook');
const inventoryRoutes = require('./routes/inventory');
const emailsRoutes = require('./routes/emails');
const ordersRoutes = require('./routes/orders');
const safiloRoutes = require('./routes/safilo');
const vendorRoutes = require('./routes/vendors');
const healthRoutes = require('./routes/health');
const parseRoutes = require('./routes/parse');
const enrichRoutes = require('./routes/enrich');
const statsRoutes = require('./routes/stats');
const catalogRoutes = require('./routes/catalog');
const feedbackRoutes = require('./routes/feedback');

// Import Supabase client
const { supabase } = require('./lib/supabase');

const app = express();
const PORT = process.env.PORT || 3001;

// Test Supabase connection on startup
(async () => {
  try {
    const { data, error } = await supabase.from('emails').select('count').limit(1);
    if (error) throw error;
    console.log('✅ Supabase connection established');
  } catch (error) {
    console.error('❌ Supabase connection failed:', error.message);
    console.log('Please check your SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables');
  }
})();

// CORS configuration - Allow multiple origins for deployments
const allowedOrigins = [
  // Development
  'http://localhost:5173',
  'http://localhost:3000',

  // Production domains
  'https://optiprofit.app',
  'https://www.optiprofit.app',

  // Vercel deployments
  'https://optical-software-kohl.vercel.app',
  /^https:\/\/optical-software-[a-z0-9-]+\.vercel\.app$/,
  /^https:\/\/[a-z0-9-]+\.vercel\.app$/
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Check if origin matches any allowed origin (string or regex)
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return allowedOrigin === origin;
      }
      // Regex pattern
      return allowedOrigin.test(origin);
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

// ==============================================
// SECURITY MIDDLEWARE (Applied First)
// ==============================================

// 1. Helmet - Security headers (must be first)
app.use(helmetConfig);

// 2. CORS - Cross-origin resource sharing
app.use(cors(corsOptions));

// 3. Body parsing with limits
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

// 4. Input sanitization - Prevents NoSQL injection
app.use(sanitizeInputs);

// 5. Request logging (production-safe)
app.use(requestLogger);

// Health check endpoint for Render.com monitoring
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Express server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// ==============================================
// ROUTES WITH RATE LIMITING
// ==============================================

// Health checks (no rate limit - for monitoring)
app.use('/api/health', healthRoutes);

// Webhook (high volume, separate rate limit)
app.use('/api/webhook', webhookLimiter, webhookRoutes);

// Expensive operations (parsing, enrichment)
app.use('/api/parse', expensiveOpsLimiter, parseRoutes);
app.use('/api/enrich', expensiveOpsLimiter, enrichRoutes);

// Standard API routes (general rate limit)
app.use('/api/inventory', apiLimiter, inventoryRoutes);
app.use('/api/emails', apiLimiter, emailsRoutes);
app.use('/api/orders', apiLimiter, ordersRoutes);
app.use('/api/safilo', apiLimiter, safiloRoutes);
app.use('/api/vendors', apiLimiter, vendorRoutes);
app.use('/api/stats', apiLimiter, statsRoutes);
app.use('/api/catalog', apiLimiter, catalogRoutes);
app.use('/api/feedback', apiLimiter, feedbackRoutes);

// ==============================================
// ERROR HANDLING (Production-Safe)
// ==============================================

// Use secure error handler that doesn't leak info in production
app.use(secureErrorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: `Route ${req.url} not found`
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;