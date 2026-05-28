import express from 'express';
import jwt from 'jsonwebtoken';
import { run, query } from '../db/db.js';
import { checkUserEmail } from '../middleware/auth.js';
import { createNotification } from '../services/notificationEngine.js';

const router = express.Router();

// 1. Get current billing status
router.get('/status', checkUserEmail, async (req, res) => {
  const email = req.userEmail;
  try {
    const users = await query('SELECT * FROM users WHERE email = ?', [email]);
    const user = users[0] || null;

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    res.json({
      success: true,
      tier: user.tier || 'free'
    });
  } catch (error) {
    console.error("Status endpoint error in billing:", error);
    res.status(500).json({ error: "Failed to load billing status." });
  }
});

// 2. Upgrade user to Premium (simulated payment success webhook or API callback)
router.post('/upgrade', checkUserEmail, async (req, res) => {
  const email = req.userEmail;
  try {
    const users = await query('SELECT * FROM users WHERE email = ?', [email]);
    const user = users[0] || null;

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Update tier in SQLite
    await run('UPDATE users SET tier = ? WHERE email = ?', ['premium', email]);

    // Trigger a billing alert notification
    try {
      await createNotification(
        email,
        'billing',
        'Aether Premium Activated!',
        'Thank you for upgrading! Your Aether Premium features are now fully unlocked (Unlimited AI chats, receipt scans, and Live bank syncs).',
        { subscriptionName: 'Aether Premium Pro', amount: 99, daysLeft: 30, nextRenewal: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] }
      );
    } catch (err) {
      console.error("Failed to generate billing notification:", err);
    }

    console.log(`[Billing Service] User ${email} successfully upgraded to Premium!`);

    // Generate new JWT with updated tier
    const jwtSecret = process.env.JWT_SECRET || 'aether_jwt_secret_key_2026_finance_engine';
    const token = jwt.sign(
      { email: user.email, tier: 'premium' },
      jwtSecret,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      user: {
        email: user.email,
        name: user.name,
        role: user.role,
        city: user.city,
        tier: 'premium'
      },
      token
    });
  } catch (error) {
    console.error("Upgrade endpoint failed:", error);
    res.status(500).json({ error: "Failed to upgrade subscription." });
  }
});

// 3. Downgrade/Cancel subscription
router.post('/cancel', checkUserEmail, async (req, res) => {
  const email = req.userEmail;
  try {
    const users = await query('SELECT * FROM users WHERE email = ?', [email]);
    const user = users[0] || null;

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    await run('UPDATE users SET tier = ? WHERE email = ?', ['free', email]);

    // Trigger billing notification
    try {
      await createNotification(
        email,
        'billing',
        'Subscription Cancelled',
        'Your Premium subscription has been cancelled. Your account has been reverted to the Free tier.',
        { subscriptionName: 'Aether Premium Pro', amount: 0, daysLeft: 0, nextRenewal: '' }
      );
    } catch (err) {
      console.error("Failed to generate billing cancellation notification:", err);
    }

    console.log(`[Billing Service] User ${email} subscription cancelled. Reverted to Free tier.`);

    // Generate new JWT with updated tier
    const jwtSecret = process.env.JWT_SECRET || 'aether_jwt_secret_key_2026_finance_engine';
    const token = jwt.sign(
      { email: user.email, tier: 'free' },
      jwtSecret,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      user: {
        email: user.email,
        name: user.name,
        role: user.role,
        city: user.city,
        tier: 'free'
      },
      token
    });
  } catch (error) {
    console.error("Cancellation endpoint failed:", error);
    res.status(500).json({ error: "Failed to cancel subscription." });
  }
});

export default router;
