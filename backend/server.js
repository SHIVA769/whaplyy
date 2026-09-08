import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

import { prisma } from './config/prisma.js';
import { errorHandler } from './middlewares/errorHandler.js';

// Routes
import authRoutes from './routes/authRoutes.js';
import superAdminRoutes from './routes/superAdminRoutes.js';
import companyRoutes from './routes/companyRoutes.js';
import storefrontRoutes from './routes/storefrontRoutes.js';
import customerRoutes from './routes/customerRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173,https://whaplyy.vercel.app')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

console.log('[Startup] Prisma bootstrap enabled. MongoDB-specific startup hooks removed.');

// Middleware
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const isAllowed =
      allowedOrigins.includes('*') ||
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      origin.includes('localhost') ||
      origin.includes('127.0.0.1');

    if (isAllowed) {
      return callback(null, true);
    }
    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('dev'));

// Allow the API to boot without MongoDB-specific readiness checks while Prisma is being migrated.
app.use('/api', (req, res, next) => {
  if (req.path === '/health') return next();
  return next();
});

// Static uploads folder
const uploadsPath = path.resolve('uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use('/uploads', express.static(uploadsPath));

// API Root Health Check
app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'online',
      database: 'connected',
      app: 'WhatsStore SaaS REST API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.json({
      status: 'degraded',
      database: 'unavailable',
      app: 'WhatsStore SaaS REST API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/super-admin', superAdminRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/storefront', storefrontRoutes);
app.use('/api/customer', customerRoutes);

// Global Error Handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`=============================================`);
  console.log(`  WhatsStore SaaS Server running on port ${PORT}`);
  console.log(`  API Health: http://localhost:${PORT}/api/health`);
  console.log(`=============================================`);
});
