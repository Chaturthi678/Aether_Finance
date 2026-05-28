import { getAllTransactions, saveTransactions, run } from '../db/db.js';
import { generateMockBankData } from '../mock/setuMock.js';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { checkTransactionAlerts, checkSyncAlerts } from '../services/notificationEngine.js';

/**
 * Get all transactions for the authenticated user context.
 */
export async function getTransactions(req, res) {
  try {
    const transactions = await getAllTransactions(req.userEmail);
    res.json({ transactions });
  } catch (error) {
    console.error(`Failed to load transactions for user ${req.userEmail}:`, error.message);
    res.status(500).json({ error: "Failed to load transactions." });
  }
}

/**
 * Handle manual transaction entries (receipt approvals or dashboard inputs).
 */
export async function addManualTransaction(req, res) {
  const { merchantName, totalAmount, date, category } = req.body;

  if (!merchantName || totalAmount === undefined || !date || !category) {
    return res.status(400).json({ error: "All transaction fields are required." });
  }

  try {
    const manualTx = {
      id: `TXN-MAN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      date: date,
      amount: parseFloat(totalAmount),
      type: "DEBIT", // Manual entries/receipt scans default to debits
      narration: merchantName,
      category: category
    };

    const { updatedTxs } = await saveTransactions([manualTx], req.userEmail);
    console.log(`Saved manual transaction for user ${req.userEmail}: ${manualTx.id}`);
    
    // Evaluate alerts
    checkTransactionAlerts(req.userEmail, manualTx).catch(err => {
      console.error("Alert verification failed:", err);
    });

    res.json({
      success: true,
      transactions: updatedTxs
    });
  } catch (error) {
    console.error("Failed to save manual transaction:", error.message);
    res.status(500).json({ error: "Failed to save manual transaction." });
  }
}

/**
 * Execute bank sync simulation generating transaction arrays for persona context.
 */
export async function syncBankTransactions(req, res) {
  try {
    console.log(`Syncing local mock bank data for user ${req.userEmail}...`);
    const transactions = await generateMockBankData(req.userEmail);

    // Trigger sync status alerts
    checkSyncAlerts(req.userEmail, transactions, true).catch(err => {
      console.error("Sync alert checking failed:", err);
    });

    res.json({
      success: true,
      message: "Successfully synced with Setu Mock ecosystem.",
      transactions: transactions
    });
  } catch (error) {
    console.error("Local sync endpoint failed:", error.message);
    res.status(500).json({ error: "Failed to sync mock bank data.", details: error.message });
  }
}

/**
 * Delete a single transaction entry.
 */
export async function deleteTransaction(req, res) {
  const { id } = req.params;
  try {
    await run('DELETE FROM transactions WHERE id = ? AND email = ?', [id, req.userEmail.toLowerCase()]);
    const updated = await getAllTransactions(req.userEmail);
    
    console.log(`Deleted transaction ${id} for user ${req.userEmail}`);
    res.json({ success: true, transactions: updated });
  } catch (error) {
    console.error(`Failed to delete transaction for user ${req.userEmail}:`, error.message);
    res.status(500).json({ error: "Failed to delete transaction." });
  }
}

/**
 * AI Receipt Scanner using Gemini multimodal Vision model.
 */
export async function scanReceipt(req, res) {
  const { image, mimeType } = req.body;

  if (!image || !mimeType) {
    return res.status(400).json({ error: "Image data and mimeType are required." });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not set in .env. Returning mock scanned receipt data.");
    await new Promise(resolve => setTimeout(resolve, 1500));
    return res.json({
      success: true,
      data: {
        merchantName: "Swiggy Food Delivery",
        totalAmount: 485.50,
        date: new Date().toISOString().split('T')[0],
        category: "Food & Dining"
      }
    });
  }

  try {
    console.log("Sending receipt image to Gemini Multimodal API...");
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

    const promptText = `Extract receipt details. Analyze this receipt image and return ONLY a JSON object containing:
- merchantName (string: name of the Indian merchant or store)
- totalAmount (number: total cost/amount paid, float)
- date (string: transaction date in YYYY-MM-DD format)
- category (string: must be one of: 'Food & Dining', 'Shopping', 'Bills & Utilities', 'Transport', 'Entertainment', 'Others').

Use these categorization guidelines:
- Food & Dining: cafes, Swiggy, Zomato, groceries, food courts, restaurants.
- Shopping: clothes, shoes, Amazon, Flipkart, electronics.
- Bills & Utilities: electricity, broadband, Jio, internet, phone recharge.
- Transport: Uber, Ola, petrol, diesel, auto.
- Entertainment: tickets, movies, BookMyShow.
- Others: anything else.

Return ONLY the raw JSON object. Do not include markdown code block styling or any conversational text.`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const response = await axios.post(url, {
      contents: [
        {
          parts: [
            { text: promptText },
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Data
              }
            }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json"
      }
    }, {
      headers: { 'Content-Type': 'application/json' }
    });

    const contentText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!contentText) {
      throw new Error("Empty response from Gemini API");
    }

    const parsedData = JSON.parse(contentText.trim());
    console.log("Successfully parsed receipt data from Gemini:", parsedData);
    
    res.json({
      success: true,
      data: parsedData
    });

  } catch (error) {
    console.error("Gemini API call failed:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to scan receipt using AI model.", details: error.message });
  }
}
