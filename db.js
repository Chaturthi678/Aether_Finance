import fs from 'fs';
import path from 'path';

function getDbFilePath(userId) {
  const safeId = (userId || 'default').replace(/[^a-zA-Z0-9@._-]/g, '_');
  return path.resolve(`./transactions_${safeId}.json`);
}

/**
 * Ensure the local database file exists.
 */
export function initDb(userId) {
  const dbPath = getDbFilePath(userId);
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify([], null, 2));
  }
}

/**
 * Retrieve all transactions.
 */
export function getAllTransactions(userId) {
  initDb(userId);
  const dbPath = getDbFilePath(userId);
  try {
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading database file:", error);
    return [];
  }
}

/**
 * Merge new transactions into the database file, preventing duplicates and auto-categorizing.
 */
export function saveTransactions(newTxs, userId) {
  initDb(userId);
  const currentTxs = getAllTransactions(userId);
  const txMap = new Map();
  
  // Load existing transactions into a map by ID
  currentTxs.forEach(tx => txMap.set(tx.id || tx.txnId, tx));

  let addedCount = 0;
  newTxs.forEach(tx => {
    const id = tx.id || tx.txnId || tx.txn_id || `TXN${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const date = tx.date || tx.timestamp || new Date().toISOString().split('T')[0];
    const amount = parseFloat(tx.amount) || 0;
    const type = (tx.type || 'DEBIT').toUpperCase();
    const narration = tx.narration || tx.description || 'N/A';
    
    // Auto-categorization
    let category = tx.category || "Others";
    if (!tx.category) {
      const desc = narration.toLowerCase();
      if (desc.includes("zomato") || desc.includes("swiggy") || desc.includes("chai")) category = "Food & Dining";
      else if (desc.includes("salary")) category = "Income";
      else if (desc.includes("amazon")) category = "Shopping";
      else if (desc.includes("jio")) category = "Bills & Utilities";
      else if (desc.includes("ola") || desc.includes("cabs")) category = "Transport";
      else if (desc.includes("bookmyshow")) category = "Entertainment";
    }

    const normalized = { id, date, amount, type, narration, category };

    if (!txMap.has(normalized.id)) {
      txMap.set(normalized.id, normalized);
      addedCount++;
    }
  });

  // Sort by date descending
  const updatedTxs = Array.from(txMap.values()).sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  const dbPath = getDbFilePath(userId);
  fs.writeFileSync(dbPath, JSON.stringify(updatedTxs, null, 2));
  return { updatedTxs, addedCount };
}

/**
 * Purge all transactions.
 */
export function clearAllTransactions(userId) {
  const dbPath = getDbFilePath(userId);
  fs.writeFileSync(dbPath, JSON.stringify([], null, 2));
}
