import { readData, writeData, getDefaultSubscriptions } from '../db/db.js';

export async function getSubscriptions(req, res) {
  try {
    const subs = await readData(req.userEmail, 'subscriptions', getDefaultSubscriptions());
    res.json({ success: true, subscriptions: subs });
  } catch (error) {
    console.error(`Failed to load subscriptions for user ${req.userEmail}:`, error.message);
    res.status(500).json({ error: "Failed to load subscriptions." });
  }
}

export async function saveSubscriptions(req, res) {
  try {
    const payload = req.body;
    if (Array.isArray(payload)) {
      // Overwrite full array
      await writeData(req.userEmail, 'subscriptions', payload);
      return res.json({ success: true, subscriptions: payload });
    }

    // Otherwise, it's a single subscription to add
    const subs = await readData(req.userEmail, 'subscriptions', getDefaultSubscriptions());
    const newSub = {
      id: payload.id || `sub-${Date.now()}`,
      name: payload.name,
      amount: parseFloat(payload.amount),
      billingCycle: payload.billingCycle || 'monthly',
      nextRenewal: payload.nextRenewal,
      category: payload.category || 'Others'
    };

    subs.push(newSub);
    await writeData(req.userEmail, 'subscriptions', subs);
    res.json({ success: true, subscriptions: subs });
  } catch (error) {
    console.error(`Failed to save subscriptions for user ${req.userEmail}:`, error.message);
    res.status(500).json({ error: "Failed to save subscriptions." });
  }
}

export async function deleteSubscription(req, res) {
  try {
    const { id } = req.params;
    const subs = await readData(req.userEmail, 'subscriptions', getDefaultSubscriptions());
    const filtered = subs.filter(s => s.id !== id);
    await writeData(req.userEmail, 'subscriptions', filtered);
    res.json({ success: true, subscriptions: filtered });
  } catch (error) {
    console.error(`Failed to delete subscription for user ${req.userEmail}:`, error.message);
    res.status(500).json({ error: "Failed to delete subscription." });
  }
}
