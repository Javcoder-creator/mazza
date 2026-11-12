const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const apiRoutes = require('./routes');
const { UPLOAD_ROOT } = require('./config/upload');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();

// Security & HTTP headers (relaxed CSP for local assets & fonts)
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

app.use(
  cors({
    origin: process.env.FRONTEND_URL ? [process.env.FRONTEND_URL, 'http://localhost:5000', 'http://127.0.0.1:5000'] : '*',
    credentials: true
  })
);

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Serve uploaded images statically
app.use('/uploads', express.static(UPLOAD_ROOT));

// API routes
app.use('/api', apiRoutes);

// Serve Frontend static files
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');
app.use(express.static(FRONTEND_DIR));

// Clean route for /admin
app.get('/admin', (_req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'admin.html'));
});

// Fallback for storefront routes
app.get('/', (_req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
});

app.use(notFound);
app.use(errorHandler);

module.exports = app;
