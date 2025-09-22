const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

// Import routes
const webhookRoutes = require('./routes/webhook');
const inventoryRoutes = require('./routes/inventory');
const emailsRoutes = require('./routes/emails');
const ordersRoutes = require('./routes/orders');
const safiloRoutes = require('./routes/safilo');

// Import database
const { initializeDatabase } = require('./db/database');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize database
initializeDatabase();

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

// Parse JSON bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/webhook', webhookRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/emails', emailsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/safilo', safiloRoutes);

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