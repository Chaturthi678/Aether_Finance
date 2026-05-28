import express from 'express';
import { getSubscriptions, saveSubscriptions, deleteSubscription } from '../controllers/subscriptionController.js';
import { checkUserEmail } from '../middleware/auth.js';

const router = express.Router();

router.use(checkUserEmail);

router.get('/', getSubscriptions);
router.post('/', saveSubscriptions);
router.delete('/:id', deleteSubscription);

export default router;
