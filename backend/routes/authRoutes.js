import express from 'express';
import { login } from '../controllers/authController.js';
import { loginLimiter } from '../middleware/security.js';

const router = express.Router();

router.post('/login', loginLimiter, login);

export default router;
