import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// General API request limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many API requests. Please try again after 15 minutes." }
});

// Stricter login request limiter
export const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 30, // Limit each IP to 30 authentication attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Please try again in 5 minutes." }
});

// Configured Helmet middleware (CSP relaxed for local camera captures and canvas rendering)
export const helmetMiddleware = helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
});

// Configured CORS middleware
export const corsMiddleware = cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Email']
});
