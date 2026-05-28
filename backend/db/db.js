import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.resolve('./database.db');
const db = new sqlite3.Database(dbPath);

// Initialize DB schema
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    email TEXT PRIMARY KEY,
    name TEXT,
    role TEXT,
    city TEXT,
    password TEXT,
    tier TEXT DEFAULT 'free'
  )`);
  
  db.run(`CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    email TEXT,
    date TEXT,
    amount REAL,
    type TEXT,
    narration TEXT,
    category TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS budgets (
    email TEXT,
    category TEXT,
    limit_amount REAL,
    PRIMARY KEY (email, category)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY,
    email TEXT,
    name TEXT,
    amount REAL,
    billing_cycle TEXT,
    next_renewal TEXT,
    category TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    email TEXT,
    type TEXT,
    title TEXT,
    message TEXT,
    date TEXT,
    read_status INTEGER DEFAULT 0,
    email_sent INTEGER DEFAULT 0,
    email_link TEXT,
    details TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS preferences (
    email TEXT PRIMARY KEY,
    email_alerts INTEGER DEFAULT 1,
    large_expense_limit REAL DEFAULT 5000,
    budget_alerts INTEGER DEFAULT 1,
    login_alerts INTEGER DEFAULT 1,
    sync_alerts INTEGER DEFAULT 1,
    billing_alerts INTEGER DEFAULT 1,
    weekly_report INTEGER DEFAULT 1
  )`);
});

// Database promise helpers
export function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        console.error(`SQL Run Error on "${sql}":`, err);
        reject(err);
      } else {
        resolve(this);
      }
    });
  });
}

export function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error(`SQL Query Error on "${sql}":`, err);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

export const DEFAULT_BUDGETS = [
  { category: 'Food & Dining', limit: 12000 },
  { category: 'Shopping', limit: 10000 },
  { category: 'Bills & Utilities', limit: 20000 },
  { category: 'Transport', limit: 6000 },
  { category: 'Entertainment', limit: 5000 },
  { category: 'Others', limit: 4000 }
];

export function getDefaultSubscriptions() {
  const tenDays = 10 * 24 * 60 * 60 * 1000;
  const twentyFourDays = 24 * 24 * 60 * 60 * 1000;
  const fiveDays = 5 * 24 * 60 * 60 * 1000;
  const fifteenDays = 15 * 24 * 60 * 60 * 1000;

  return [
    { id: 'sub-1', name: 'Jio Fiber Broadband', amount: 1178.00, billingCycle: 'monthly', nextRenewal: new Date(Date.now() + tenDays).toISOString().split('T')[0], category: 'Bills & Utilities' },
    { id: 'sub-2', name: 'Swiggy One Gold', amount: 149.00, billingCycle: 'monthly', nextRenewal: new Date(Date.now() + twentyFourDays).toISOString().split('T')[0], category: 'Food & Dining' },
    { id: 'sub-3', name: 'Netflix Premium', amount: 649.00, billingCycle: 'monthly', nextRenewal: new Date(Date.now() + fiveDays).toISOString().split('T')[0], category: 'Entertainment' },
    { id: 'sub-4', name: 'Spotify Individual', amount: 119.00, billingCycle: 'monthly', nextRenewal: new Date(Date.now() + fifteenDays).toISOString().split('T')[0], category: 'Entertainment' }
  ];
}

/**
 * Read isolated data structure for a specific user and type.
 */
export async function readData(userId, type, defaultValue = []) {
  try {
    const email = userId.toLowerCase();
    
    if (type === 'preferences') {
      const rows = await query('SELECT * FROM preferences WHERE email = ?', [email]);
      if (rows.length === 0) {
        const def = defaultValue || {
          emailAlerts: true,
          largeExpenseLimit: 5000,
          budgetAlerts: true,
          loginAlerts: true,
          syncAlerts: true,
          billingAlerts: true,
          weeklyReport: true
        };
        await writeData(email, 'preferences', def);
        return def;
      }
      const r = rows[0];
      return {
        emailAlerts: r.email_alerts === 1,
        largeExpenseLimit: r.large_expense_limit,
        budgetAlerts: r.budget_alerts === 1,
        loginAlerts: r.login_alerts === 1,
        syncAlerts: r.sync_alerts === 1,
        billingAlerts: r.billing_alerts === 1,
        weeklyReport: r.weekly_report === 1
      };
    }
    
    if (type === 'budgets') {
      const rows = await query('SELECT * FROM budgets WHERE email = ?', [email]);
      if (rows.length === 0) {
        for (const b of DEFAULT_BUDGETS) {
          await run('INSERT OR REPLACE INTO budgets (email, category, limit_amount) VALUES (?, ?, ?)', [email, b.category, b.limit]);
        }
        return DEFAULT_BUDGETS;
      }
      return rows.map(r => ({
        category: r.category,
        limit: r.limit_amount
      }));
    }
    
    if (type === 'subscriptions') {
      const rows = await query('SELECT * FROM subscriptions WHERE email = ?', [email]);
      if (rows.length === 0) {
        const def = getDefaultSubscriptions();
        for (const s of def) {
          await run('INSERT OR REPLACE INTO subscriptions (id, email, name, amount, billing_cycle, next_renewal, category) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [s.id, email, s.name, s.amount, s.billingCycle, s.nextRenewal, s.category]);
        }
        return def;
      }
      return rows.map(r => ({
        id: r.id,
        name: r.name,
        amount: r.amount,
        billingCycle: r.billing_cycle,
        nextRenewal: r.next_renewal,
        category: r.category
      }));
    }
    
    if (type === 'notifications') {
      const rows = await query('SELECT * FROM notifications WHERE email = ? ORDER BY date DESC LIMIT 100', [email]);
      return rows.map(r => ({
        id: r.id,
        type: r.type,
        title: r.title,
        message: r.message,
        date: r.date,
        read: r.read_status === 1,
        emailSent: r.email_sent === 1,
        emailLink: r.email_link,
        details: r.details ? JSON.parse(r.details) : {}
      }));
    }
    
    if (type === 'transactions') {
      const rows = await query('SELECT * FROM transactions WHERE email = ? ORDER BY date DESC', [email]);
      return rows.map(r => ({
        id: r.id,
        date: r.date,
        amount: r.amount,
        type: r.type,
        narration: r.narration,
        category: r.category
      }));
    }
  } catch (error) {
    console.error(`Error in readData for ${type}:`, error);
  }
  return defaultValue;
}

/**
 * Write isolated data structure for a specific user and type.
 */
export async function writeData(userId, type, data) {
  try {
    const email = userId.toLowerCase();
    
    if (type === 'preferences') {
      await run(`INSERT OR REPLACE INTO preferences 
        (email, email_alerts, large_expense_limit, budget_alerts, login_alerts, sync_alerts, billing_alerts, weekly_report)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          email,
          data.emailAlerts ? 1 : 0,
          data.largeExpenseLimit,
          data.budgetAlerts ? 1 : 0,
          data.loginAlerts ? 1 : 0,
          data.syncAlerts ? 1 : 0,
          data.billingAlerts ? 1 : 0,
          data.weeklyReport ? 1 : 0
        ]);
      return true;
    }
    
    if (type === 'budgets') {
      await run('DELETE FROM budgets WHERE email = ?', [email]);
      for (const b of data) {
        await run('INSERT INTO budgets (email, category, limit_amount) VALUES (?, ?, ?)',
          [email, b.category, b.limit]);
      }
      return true;
    }
    
    if (type === 'subscriptions') {
      await run('DELETE FROM subscriptions WHERE email = ?', [email]);
      for (const s of data) {
        await run('INSERT INTO subscriptions (id, email, name, amount, billing_cycle, next_renewal, category) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [s.id, email, s.name, s.amount, s.billingCycle, s.nextRenewal, s.category]);
      }
      return true;
    }
    
    if (type === 'notifications') {
      await run('DELETE FROM notifications WHERE email = ?', [email]);
      for (const n of data) {
        await run('INSERT INTO notifications (id, email, type, title, message, date, read_status, email_sent, email_link, details) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            n.id,
            email,
            n.type,
            n.title,
            n.message,
            n.date,
            n.read ? 1 : 0,
            n.emailSent ? 1 : 0,
            n.emailLink || null,
            n.details ? JSON.stringify(n.details) : null
          ]);
      }
      return true;
    }
    
    if (type === 'transactions') {
      await run('DELETE FROM transactions WHERE email = ?', [email]);
      for (const tx of data) {
        await run('INSERT INTO transactions (id, email, date, amount, type, narration, category) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [tx.id, email, tx.date, tx.amount, tx.type, tx.narration, tx.category]);
      }
      return true;
    }
  } catch (error) {
    console.error(`Error in writeData for ${type}:`, error);
  }
  return false;
}

/**
 * Clear user data for clean states/testing.
 */
export async function deleteUserDataFiles(userId) {
  const email = userId.toLowerCase();
  await run('DELETE FROM transactions WHERE email = ?', [email]);
  await run('DELETE FROM budgets WHERE email = ?', [email]);
  await run('DELETE FROM subscriptions WHERE email = ?', [email]);
  await run('DELETE FROM notifications WHERE email = ?', [email]);
  await run('DELETE FROM preferences WHERE email = ?', [email]);
}

// Transactions specific helpers to maintain compatibility
export async function getAllTransactions(userId) {
  return await readData(userId, 'transactions', []);
}

export async function clearAllTransactions(userId) {
  await run('DELETE FROM transactions WHERE email = ?', [userId.toLowerCase()]);
}

export async function saveTransactions(newTxs, userId) {
  const currentTxs = await getAllTransactions(userId);
  const txMap = new Map();
  
  currentTxs.forEach(tx => txMap.set(tx.id, tx));

  let addedCount = 0;
  for (const tx of newTxs) {
    const id = tx.id || `TXN${Date.now()}-${Math.floor(Math.random() * 1050)}`;
    const date = tx.date || new Date().toISOString().split('T')[0];
    const amount = parseFloat(tx.amount) || 0;
    const type = (tx.type || 'DEBIT').toUpperCase();
    const narration = tx.narration || 'N/A';
    
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
  }

  const updatedTxs = Array.from(txMap.values()).sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  await writeData(userId, 'transactions', updatedTxs);
  return { updatedTxs, addedCount };
}
