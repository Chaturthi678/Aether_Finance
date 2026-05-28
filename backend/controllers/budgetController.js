import { readData, writeData, DEFAULT_BUDGETS } from '../db/db.js';

export async function getBudgets(req, res) {
  try {
    const budgets = await readData(req.userEmail, 'budgets', DEFAULT_BUDGETS);
    res.json({ success: true, budgets });
  } catch (error) {
    console.error(`Failed to load budgets for user ${req.userEmail}:`, error.message);
    res.status(500).json({ error: "Failed to load budgets." });
  }
}

export async function updateBudgets(req, res) {
  try {
    const budgets = req.body;
    if (!Array.isArray(budgets)) {
      return res.status(400).json({ error: "Budgets payload must be an array." });
    }
    await writeData(req.userEmail, 'budgets', budgets);
    res.json({ success: true, budgets });
  } catch (error) {
    console.error(`Failed to save budgets for user ${req.userEmail}:`, error.message);
    res.status(500).json({ error: "Failed to save budgets." });
  }
}
