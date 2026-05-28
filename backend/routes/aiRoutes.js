import express from 'express';
import { queryAiAssistant } from '../controllers/aiController.js';
import { checkUserEmail } from '../middleware/auth.js';

const router = express.Router();

router.use(checkUserEmail);
router.post('/', queryAiAssistant);

export default router;
