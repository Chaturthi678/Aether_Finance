import express from 'express';
import { 
  getTransactions, 
  addManualTransaction, 
  syncBankTransactions, 
  deleteTransaction,
  scanReceipt
} from '../controllers/transactionController.js';
import { checkUserEmail } from '../middleware/auth.js';

const router = express.Router();

// Apply email verification context middleware
router.use(checkUserEmail);

router.get('/', getTransactions);
router.post('/manual', addManualTransaction);
router.post('/scan-receipt', scanReceipt);
router.post('/sync-bank', syncBankTransactions);
router.delete('/:id', deleteTransaction);

export default router;
