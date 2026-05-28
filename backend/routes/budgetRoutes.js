import express from 'express';
import { getBudgets, updateBudgets } from '../controllers/budgetController.js';
import { checkUserEmail } from '../middleware/auth.js';

const router = express.Router();

router.use(checkUserEmail);

router.get('/', getBudgets);
router.post('/', updateBudgets);

export default router;
