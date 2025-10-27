const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

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

// CORS configuration - Allow multiple origins for Vercel deployments
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://optical-software-kohl.vercel.app',
  // Allow all Vercel preview deployments
  /https:\/\/optical-software-.*\.vercel\.app$/
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

// Middleware
app.use(cors(corsOptions));

// Parse JSON bodies with increased limit for email content
// Vendor emails with HTML can be large (up to 10MB)
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

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

// Routes
app.use('/api/health', healthRoutes); // Use the new detailed health routes
app.use('/api/webhook', webhookRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/emails', emailsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/safilo', safiloRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/parse', parseRoutes);
app.use('/api/enrich', enrichRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/catalog', catalogRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: err.message 
  });
});

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