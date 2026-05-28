import express from 'express';
import { resetUserData } from '../controllers/resetController.js';
import { checkUserEmail } from '../middleware/auth.js';

const router = express.Router();

router.use(checkUserEmail);
router.post('/', resetUserData);

export default router;
