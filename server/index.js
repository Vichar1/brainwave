/**
 * HACKATHON 1.0 — Express Backend Server
 * API routes, auth, database, security
 * 
 * SECURITY HARDENED — Enterprise-grade configuration
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import crypto from 'crypto';

import { initDB } from './db.js';
import teamRoutes from './routes/teams.js';
import adminRoutes from './routes/admin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

// ============================================
// SECURITY HEADERS (Helmet)
// ============================================
app.use(helmet({
  contentSecurityPolicy: IS_PROD ? {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://api.fontshare.com", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://api.fontshare.com", "https://cdn.fontshare.com", "https://fonts.gstatic.com", "https://fonts.googleapis.com", "data:"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  } : false, // Disable CSP in dev for Vite HMR
  crossOriginEmbedderPolicy: false,
  hsts: IS_PROD ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xFrameOptions: { action: 'deny' },
  xContentTypeOptions: true,
  xDnsPrefetchControl: { allow: false },
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },
}));

// ============================================
// HTTPS REDIRECT (Production Only)
// ============================================
if (IS_PROD) {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(301, `https://${req.hostname}${req.url}`);
    }
    next();
  });
}

// ============================================
// REQUEST ID MIDDLEWARE (Audit Trail)
// ============================================
app.use((req, res, next) => {
  req.requestId = crypto.randomUUID();
  res.setHeader('X-Request-ID', req.requestId);
  next();
});

// ============================================
// CORS
// ============================================
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400, // Cache preflight for 24h
}));

// ============================================
// RATE LIMITING
// ============================================
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: IS_PROD ? 100 : 200,  // Stricter in production
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use X-Forwarded-For in production (behind proxy)
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;
  },
});
app.use(globalLimiter);

// ============================================
// BODY PARSING
// ============================================
app.use(express.json({ limit: '100kb' })); // Reduced from 1mb — registrations are small
app.use(express.urlencoded({ extended: false, limit: '100kb' }));

// ============================================
// TRUST PROXY (for Render/Heroku/etc.)
// ============================================
if (IS_PROD) {
  app.set('trust proxy', 1);
}

// ============================================
// INIT DATABASE
// ============================================
const db = initDB();

// ============================================
// ROUTES
// ============================================
app.use('/api/teams', teamRoutes(db));
app.use('/api/admin', adminRoutes(db));

// Health check (no sensitive info)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: Math.floor(process.uptime()) });
});

// ============================================
// 404 HANDLER — catch unmatched /api/ routes
// ============================================
app.all('/api/{path}', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// ============================================
// STATIC FILES (Production — serve built Vite frontend)
// ============================================
if (IS_PROD) {
  const distPath = join(__dirname, '..', 'dist');
  app.use(express.static(distPath));
  
  // SPA fallback — serve index.html for non-API routes
  app.get('/{path}', (req, res) => {
    const requestedFile = join(distPath, req.path);
    // Try to serve the exact file first, otherwise serve index.html
    res.sendFile(requestedFile, (err) => {
      if (err) res.sendFile(join(distPath, 'index.html'));
    });
  });
}

// ============================================
// ERROR HANDLING (Sanitized for production)
// ============================================
app.use((err, req, res, next) => {
  const requestId = req.requestId || 'unknown';
  
  // Log full error server-side only
  console.error(`[${requestId}] Server error:`, IS_PROD ? err.message : err);
  
  // Never leak stack traces or internal details to client
  res.status(err.status || 500).json({
    error: IS_PROD ? 'Internal server error' : err.message || 'Internal server error',
    requestId,
  });
});

// ============================================
// GRACEFUL SHUTDOWN
// ============================================
function gracefulShutdown(signal) {
  console.log(`\n⚠ ${signal} received. Shutting down gracefully...`);
  server.close(() => {
    console.log('✓ Server closed.');
    process.exit(0);
  });
  // Force kill after 10s
  setTimeout(() => {
    console.error('✗ Forced shutdown after timeout.');
    process.exit(1);
  }, 10000);
}

// ============================================
// START
// ============================================
const server = app.listen(PORT, () => {
  console.log(`⚡ BRAINWAVE Server running on port ${PORT} [${IS_PROD ? 'PRODUCTION' : 'DEVELOPMENT'}]`);
});

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;
