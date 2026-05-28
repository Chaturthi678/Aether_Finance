import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { readData, writeData, query } from '../db/db.js';
import { sendEmailNotification, templates } from './emailService.js';

/**
 * Get user profile details from SQLite users table
 */
async function getUserProfile(email) {
  try {
    const rows = await query('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
    return rows[0] || null;
  } catch (err) {
    console.error("Error reading user profile for alert engine:", err);
  }
  return null;
}

/**
 * Fetch user preference defaults or stored state
 */
export async function getNotificationPreferences(email) {
  const defaults = {
    emailAlerts: true,
    largeExpenseLimit: 5000,
    budgetAlerts: true,
    loginAlerts: true,
    syncAlerts: true,
    billingAlerts: true,
    weeklyReport: true
  };
  return await readData(email, 'preferences', defaults);
}

/**
 * Save user preferences
 */
export async function saveNotificationPreferences(email, preferences) {
  return await writeData(email, 'preferences', preferences);
}

/**
 * Creates notification record, updates user-isolated history, and triggers email.
 */
export async function createNotification(email, type, title, message, details = {}) {
  const notifications = await readData(email, 'notifications', []);
  const preferences = await getNotificationPreferences(email);

  const newNotification = {
    id: `NOT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type, // 'security', 'sync', 'budget', 'transaction', 'billing'
    title,
    message,
    date: new Date().toISOString(),
    read: false,
    emailSent: false,
    emailLink: null,
    details
  };

  let emailResult = { success: false, previewUrl: null };
  const userProfile = await getUserProfile(email);
  const userName = userProfile ? userProfile.name : email.split('@')[0];

  // Evaluate if email is allowed for this type
  if (preferences.emailAlerts) {
    let shouldSendEmail = false;
    let subject = `[Aether Alerts] ${title}`;
    let htmlContent = '';

    if (type === 'security' && preferences.loginAlerts) {
      shouldSendEmail = true;
      htmlContent = templates.loginSecurityAlert(
        userName, 
        email, 
        details.location || 'Hyderabad, India', 
        new Date(newNotification.date).toLocaleString('en-IN')
      );
    } else if (type === 'sync' && preferences.syncAlerts) {
      shouldSendEmail = true;
      htmlContent = templates.bankSyncAlert(
        userName,
        details.accountName || 'Setu Sandbox Aggregator',
        details.status || 'success',
        details.count || 0,
        details.amountTotal || 0
      );
    } else if (type === 'transaction' && preferences.largeExpenseLimit) {
      shouldSendEmail = true;
      htmlContent = templates.largeExpenseAlert(
        userName,
        details.merchant || 'Merchant',
        details.amount || 0,
        details.category || 'Others'
      );
    } else if (type === 'budget' && preferences.budgetAlerts) {
      shouldSendEmail = true;
      htmlContent = templates.budgetExceededAlert(
        userName,
        details.category,
        details.limit || 0,
        details.spent || 0,
        details.percentOver || 0
      );
    } else if (type === 'billing' && preferences.billingAlerts) {
      shouldSendEmail = true;
      htmlContent = templates.subscriptionDueAlert(
        userName,
        details.subscriptionName,
        details.amount || 0,
        details.daysLeft !== undefined ? details.daysLeft : 1,
        details.nextRenewal || ''
      );
    } else if (type === 'summary') {
      shouldSendEmail = true;
      htmlContent = templates.monthlyWealthSummary(
        userName,
        userProfile ? userProfile.role : 'Wealth Builder',
        userProfile ? userProfile.city : 'India',
        details.metrics || { inflow: 0, outflow: 0, savings: 0, savingsRate: 0 },
        details.aiInsights || 'Plan wisely and build wealth.'
      );
    }

    if (shouldSendEmail && htmlContent) {
      console.log(`[Notification Engine] Delivering ${type} email alert to ${email}...`);
      emailResult = await sendEmailNotification(email, subject, htmlContent);
      newNotification.emailSent = emailResult.success;
      newNotification.emailLink = emailResult.previewUrl;
    }
  }

  notifications.unshift(newNotification);
  // Keep only last 100 notifications
  if (notifications.length > 100) {
    notifications.pop();
  }
  await writeData(email, 'notifications', notifications);

  return newNotification;
}

/**
 * Triggers instant security notification on login.
 */
export async function triggerLoginAlert(email) {
  try {
    const userProfile = getUserProfile(email);
    const details = {
      location: userProfile ? `${userProfile.city}, India` : 'Hyderabad, India'
    };
    await createNotification(
      email, 
      'security', 
      'New Account Session Active', 
      `A new session has been initiated for your account. Logged in from ${details.location}.`,
      details
    );
  } catch (err) {
    console.error("Failed to trigger login warning notification:", err);
  }
}

/**
 * Evaluate single transaction for large expenses and category budget violations.
 */
export async function checkTransactionAlerts(email, transaction) {
  try {
    if (transaction.type !== 'DEBIT') return;

    const preferences = await getNotificationPreferences(email);
    const amount = transaction.amount;
    const category = transaction.category || 'Others';
    const merchant = transaction.narration || 'Merchant';

    // 1. Check Large Expense Warning
    if (amount >= preferences.largeExpenseLimit) {
      await createNotification(
        email,
        'transaction',
        `Large Expense Detected: ₹${amount.toFixed(0)}`,
        `You spent ₹${amount.toFixed(0)} at ${merchant} in category ${category}.`,
        { merchant, amount, category }
      );
    }

    // 2. Check Budget Alerts
    const budgets = await readData(email, 'budgets', []);
    const budget = budgets.find(b => b.category === category);
    
    if (budget && budget.limit > 0) {
      // Calculate current month's expenses in this category
      const txs = await readData(email, 'transactions', []);
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      const spent = txs
        .filter(t => {
          if (t.type !== 'DEBIT' || t.category !== category) return false;
          try {
            const d = new Date(t.date);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
          } catch (e) {
            return false;
          }
        })
        .reduce((sum, t) => sum + t.amount, 0);

      if (spent > budget.limit) {
        // Prevent duplicate spam: Only email if we haven't sent a budget alert for this category in the current month
        const notifications = await readData(email, 'notifications', []);
        const alreadyAlerted = notifications.some(n => {
          if (n.type !== 'budget' || n.details?.category !== category) return false;
          try {
            const alertDate = new Date(n.date);
            return alertDate.getMonth() === currentMonth && alertDate.getFullYear() === currentYear;
          } catch {
            return false;
          }
        });

        if (!alreadyAlerted) {
          const percentOver = ((spent - budget.limit) / budget.limit) * 100;
          await createNotification(
            email,
            'budget',
            `Budget Limit Exceeded: ${category}`,
            `Monthly spend for ${category} has reached ₹${spent.toFixed(0)}, exceeding your budget of ₹${budget.limit.toFixed(0)}.`,
            { category, limit: budget.limit, spent, percentOver }
          );
        }
      }
    }
  } catch (err) {
    console.error("Error evaluating transaction alerts:", err);
  }
}

/**
 * Triggered after Setu Sandbox sync batches.
 */
export async function checkSyncAlerts(email, transactions, success = true) {
  try {
    if (!success) {
      await createNotification(
        email,
        'sync',
        'Bank Data Aggregation Failed',
        'Setu Sandbox reported authentication expiry or network timeout. Please re-aggregate.',
        { status: 'failed' }
      );
      return;
    }

    const debits = transactions.filter(t => t.type === 'DEBIT');
    const totalDebits = debits.reduce((sum, t) => sum + t.amount, 0);
    const txCount = transactions.length;

    // Create sync confirmation notification
    await createNotification(
      email,
      'sync',
      'Bank Data Synced Successfully',
      `Aggregated ${txCount} transactions from your bank account. Total volume parsed is ₹${totalDebits.toFixed(0)}.`,
      { status: 'success', count: txCount, amountTotal: totalDebits }
    );

    // Scan individual transactions in the batch for alerts (Budget / Large Expense)
    // Run them sequentially/asynchronously but catch errors
    for (const tx of transactions) {
      await checkTransactionAlerts(email, tx);
    }
  } catch (err) {
    console.error("Error checking sync notification alerts:", err);
  }
}

/**
 * Evaluate subscription renewals and trigger billing reminders
 */
export async function checkUpcomingSubscriptions(email) {
  try {
    const subscriptions = await readData(email, 'subscriptions', []);
    if (subscriptions.length === 0) return 0;

    let triggeredCount = 0;
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    for (const sub of subscriptions) {
      const nextRenewalDate = new Date(sub.nextRenewal);
      const diffTime = nextRenewalDate.getTime() - Date.now();
      const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Alert when subscription is due in 1 day or today
      if (daysLeft >= 0 && daysLeft <= 1) {
        // Prevent daily duplicate spam: check if already notified about this subscription in the last 7 days
        const notifications = await readData(email, 'notifications', []);
        const alreadyNotified = notifications.some(n => {
          if (n.type !== 'billing' || n.details?.subscriptionName !== sub.name) return false;
          try {
            const ageDays = (Date.now() - new Date(n.date).getTime()) / (1000 * 60 * 60 * 24);
            return ageDays < 7;
          } catch {
            return false;
          }
        });

        if (!alreadyNotified) {
          await createNotification(
            email,
            'billing',
            `Bill Due Tomorrow: ${sub.name}`,
            `Renewal cost of ₹${sub.amount.toFixed(0)} is due on ${sub.nextRenewal}.`,
            { subscriptionName: sub.name, amount: sub.amount, daysLeft, nextRenewal: sub.nextRenewal }
          );
          triggeredCount++;
        }
      }
    }
    return triggeredCount;
  } catch (err) {
    console.error("Error evaluating subscriptions renewal alerts:", err);
    return 0;
  }
}

/**
 * Generate monthly summary using Gemini multimodal/chat or structured rules fallback.
 */
export async function generateMonthlySummary(email) {
  try {
    const txs = await readData(email, 'transactions', []);
    const userProfile = await getUserProfile(email);
    const name = userProfile ? userProfile.name : email.split('@')[0];
    const role = userProfile ? userProfile.role : 'Wealth Builder';
    const city = userProfile ? userProfile.city : 'India';

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const monthlyTxs = txs.filter(t => {
      try {
        const d = new Date(t.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      } catch {
        return false;
      }
    });

    const inflow = monthlyTxs.filter(t => t.type === 'CREDIT').reduce((sum, t) => sum + t.amount, 0);
    const outflow = monthlyTxs.filter(t => t.type === 'DEBIT').reduce((sum, t) => sum + t.amount, 0);
    const savings = inflow - outflow;
    const savingsRate = inflow > 0 ? (savings / inflow) * 100 : 0;

    const metrics = { inflow, outflow, savings, savingsRate };

    // Get spending breakdown
    const categoryTotals = {};
    monthlyTxs.filter(t => t.type === 'DEBIT').forEach(t => {
      const cat = t.category || 'Others';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + t.amount;
    });

    let topCategory = 'N/A';
    let topCategoryAmount = 0;
    Object.keys(categoryTotals).forEach(cat => {
      if (categoryTotals[cat] > topCategoryAmount) {
        topCategory = cat;
        topCategoryAmount = categoryTotals[cat];
      }
    });

    // 1. Generate Intelligent AI insights (using Gemini if available, fallback otherwise)
    let aiInsights = '';
    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        console.log(`[Notification Engine] Invoking Gemini content generator for monthly summaries...`);
        const prompt = `You are Aether Wealth Advisor, an expert Indian personal finance advisor. 
Analyze the monthly financials for ${name} (${role} in ${city}):
- Total Inflow (Income/Credits): ₹${inflow.toFixed(0)}
- Total Outflow (Expenses/Debits): ₹${outflow.toFixed(0)}
- Savings Rate: ${savingsRate.toFixed(0)}% (Net Savings: ₹${savings.toFixed(0)})
- Top Spending Category: ${topCategory} (₹${topCategoryAmount.toFixed(0)})

Write a short, engaging wealth insight summary containing exactly 3 paragraphs:
1. Praise their budget and saving performance or warn them about negative savings. Mention their specific persona/city.
2. Discuss the impact of their spending in their top category: "${topCategory}" (₹${topCategoryAmount.toFixed(0)} spent).
3. Offer 2 concrete, realistic wealth building suggestions customized for an Indian professional earning this income.

Format using basic paragraphs (<p> tags). Do not use markdown syntax, markdown headers, or bullets. Return ONLY the HTML tags.`;

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        const response = await axios.post(url, {
          contents: [{ parts: [{ text: prompt }] }]
        });

        aiInsights = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      } catch (err) {
        console.warn("Failed to generate monthly wealth summary via Gemini. Falling back to rule-engine...", err.message);
      }
    }

    // 2. Structured rule-based fallback if Gemini is missing or failed
    if (!aiInsights) {
      let performancePraise = '';
      if (savingsRate > 30) {
        performancePraise = `Excellent job this month, ${name}! Your savings rate of ${savingsRate.toFixed(0)}% is well above the average. Operating as a ${role} in the fast-paced environment of ${city}, you've shown fantastic financial discipline.`;
      } else if (savingsRate > 10) {
        performancePraise = `Good job, ${name}. You managed a positive savings rate of ${savingsRate.toFixed(0)}% this month. In a vibrant city like ${city}, keeping expense leaks down is challenging, but your role as a ${role} positions you well to optimize this further.`;
      } else if (savingsRate > 0) {
        performancePraise = `You are barely staying afloat, ${name}. Your savings rate is at ${savingsRate.toFixed(0)}%. As a ${role} residing in ${city}, you should examine your outflow channels to avoid living paycheck to paycheck.`;
      } else {
        performancePraise = `Urgent alert: You are operating in negative savings this month, ${name}! You spent ₹${Math.abs(savings).toFixed(0)} more than you earned. As a ${role} in ${city}, we advise looking into immediate budget corrections.`;
      }

      let categoryInsights = '';
      if (topCategoryAmount > 0) {
        categoryInsights = `Your largest debit channel was <strong>${topCategory}</strong>, accounting for ₹${topCategoryAmount.toFixed(0)} in outflow. In many Indian households, dining/subscriptions or travel and utilities can silently erode surplus funds. Trimming down this category by just 10% next month could increase your overall savings rate immediately.`;
      } else {
        categoryInsights = `No major expenses were logged this month. This blank slate is a perfect launchpad to automate your investments.`;
      }

      let adviceInsights = `We recommend automating a fixed SIP into an index fund or PPF account at the beginning of the month (the 'pay yourself first' rule). In addition, ensure your subscription renewals are reviewed; canceling unused streaming plans could save you thousands annually.`;

      aiInsights = `
        <p>${performancePraise}</p>
        <p>${categoryInsights}</p>
        <p>${adviceInsights}</p>
      `;
    }

    // 3. Create Notification and send HTML email
    await createNotification(
      email,
      'summary',
      'Your Monthly Wealth Insights Are Ready',
      `Monthly financial report compiled: Savings rate at ${savingsRate.toFixed(0)}%, net savings is ₹${savings.toFixed(0)}.`,
      { metrics, aiInsights }
    );

    return { success: true, metrics };
  } catch (err) {
    console.error("Failed to generate monthly wealth summary alert:", err);
    return { success: false, error: err.message };
  }
}
