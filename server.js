import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Import Custom Middlewares and Security
import { 
  corsMiddleware, 
  helmetMiddleware, 
  apiLimiter 
} from './backend/middleware/security.js';
import { checkUserEmail } from './backend/middleware/auth.js';

// Import Modular Routers
import authRoutes from './backend/routes/authRoutes.js';
import transactionRoutes from './backend/routes/transactionRoutes.js';
import aiRoutes from './backend/routes/aiRoutes.js';
import resetRoutes from './backend/routes/resetRoutes.js';
import setuRoutes from './backend/routes/setuRoutes.js';
import notificationRoutes from './backend/routes/notificationRoutes.js';
import budgetRoutes from './backend/routes/budgetRoutes.js';
import subscriptionRoutes from './backend/routes/subscriptionRoutes.js';
import billingRoutes from './backend/routes/billingRoutes.js';

// Import Root Level Controller Functions
import { scanReceipt, syncBankTransactions } from './backend/controllers/transactionController.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// Apply Global Security Middlewares
app.use(corsMiddleware);
app.use(helmetMiddleware);

// Request Parsing configurations
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Apply general API limiter to all /api routes
app.use('/api', apiLimiter);

// Register Modular API Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/ai-assistant', aiRoutes);
app.use('/api/reset', resetRoutes);
app.use('/api/setu', setuRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/billing', billingRoutes);

// Root level backwards compatibility API calls
app.post('/api/sync-bank', checkUserEmail, syncBankTransactions);
app.post('/api/scan-receipt', checkUserEmail, scanReceipt);

// Serve compiled static assets from public folder
app.use(express.static(path.join(__dirname, 'public')));

// Catch-all SPA route mapping back to index.html
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`[Backend Server] Running on http://localhost:${PORT}`);
});
