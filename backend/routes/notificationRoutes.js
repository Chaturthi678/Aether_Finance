import express from 'express';
import { 
  getNotifications, 
  getPreferences, 
  savePreferences, 
  markAsRead, 
  sendTestEmail,
  triggerSummaryEmail
} from '../controllers/notificationController.js';
import { checkUserEmail } from '../middleware/auth.js';

const router = express.Router();

router.use(checkUserEmail);

router.get('/', getNotifications);
router.get('/preferences', getPreferences);
router.post('/preferences', savePreferences);
router.post('/read', markAsRead);
router.post('/test-email', sendTestEmail);
router.post('/trigger-monthly-summary', triggerSummaryEmail);

export default router;
