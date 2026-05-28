import { readData, writeData } from '../db/db.js';
import { 
  getNotificationPreferences, 
  saveNotificationPreferences, 
  createNotification, 
  generateMonthlySummary,
  checkUpcomingSubscriptions
} from '../services/notificationEngine.js';

export async function getNotifications(req, res) {
  try {
    const notifications = await readData(req.userEmail, 'notifications', []);
    res.json({ success: true, notifications });
  } catch (error) {
    console.error(`Failed to load notifications for user ${req.userEmail}:`, error.message);
    res.status(500).json({ error: "Failed to load notifications." });
  }
}

export async function getPreferences(req, res) {
  try {
    const preferences = await getNotificationPreferences(req.userEmail);
    res.json({ success: true, preferences });
  } catch (error) {
    console.error(`Failed to load preferences for user ${req.userEmail}:`, error.message);
    res.status(500).json({ error: "Failed to load preferences." });
  }
}

export async function savePreferences(req, res) {
  try {
    const preferences = req.body;
    await saveNotificationPreferences(req.userEmail, preferences);
    res.json({ success: true, preferences });
  } catch (error) {
    console.error(`Failed to save preferences for user ${req.userEmail}:`, error.message);
    res.status(500).json({ error: "Failed to save preferences." });
  }
}

export async function markAsRead(req, res) {
  try {
    const { id } = req.body;
    const notifications = await readData(req.userEmail, 'notifications', []);
    
    if (id) {
      // Mark specific notification as read
      const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
      await writeData(req.userEmail, 'notifications', updated);
      res.json({ success: true, notifications: updated });
    } else {
      // Mark all as read
      const updated = notifications.map(n => ({ ...n, read: true }));
      await writeData(req.userEmail, 'notifications', updated);
      res.json({ success: true, notifications: updated });
    }
  } catch (error) {
    console.error(`Failed to update notifications read status for user ${req.userEmail}:`, error.message);
    res.status(500).json({ error: "Failed to update notification status." });
  }
}

export async function sendTestEmail(req, res) {
  try {
    // Generate a test transaction alert
    const randomAmount = 250 + Math.floor(Math.random() * 8000);
    const testNotification = await createNotification(
      req.userEmail,
      'transaction',
      `Test Large Expense Alert: ₹${randomAmount}`,
      `This is a test notification generated from your Aether settings. You spent ₹${randomAmount} on Swiggy Gourmet.`,
      { merchant: 'Swiggy Gourmet', amount: randomAmount, category: 'Food & Dining' }
    );

    // Also run a check on subscriptions to demonstrate recurring bills
    await checkUpcomingSubscriptions(req.userEmail);

    res.json({ 
      success: true, 
      message: "Test alerts generated and dispatched successfully.",
      notification: testNotification 
    });
  } catch (error) {
    console.error(`Failed to send test email for user ${req.userEmail}:`, error.message);
    res.status(500).json({ error: "Failed to generate test notifications.", details: error.message });
  }
}

export async function triggerSummaryEmail(req, res) {
  try {
    const result = await generateMonthlySummary(req.userEmail);
    if (result.success) {
      const notifications = await readData(req.userEmail, 'notifications', []);
      res.json({ 
        success: true, 
        message: "Monthly wealth report compiled and emailed successfully.",
        notifications 
      });
    } else {
      res.status(500).json({ error: result.error || "Failed to compile monthly summary report." });
    }
  } catch (error) {
    console.error(`Failed to trigger summary report for user ${req.userEmail}:`, error.message);
    res.status(500).json({ error: "Failed to trigger summary report.", details: error.message });
  }
}
