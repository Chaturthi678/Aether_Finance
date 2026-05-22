import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import axios from 'axios';
import { generateMockBankData } from './setuMock.js';
import { getAllTransactions, clearAllTransactions, saveTransactions } from './db.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS and JSON parsing (with increased limits for base64 image uploads)
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Serve static frontend files from 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Route to trigger local mock bank synchronization.
 * Writes realistic Indian bank transactions straight to transactions.json.
 */
app.post('/api/sync-bank', (req, res) => {
  try {
    console.log("Syncing local mock bank data...");
    const transactions = generateMockBankData();
    res.json({
      success: true,
      message: "Successfully synced with Setu Mock ecosystem.",
      transactions: transactions
    });
  } catch (error) {
    console.error("Local sync endpoint failed:", error.message);
    res.status(500).json({ error: "Failed to sync mock bank data.", details: error.message });
  }
});

/**
 * Route to scan a receipt image using Gemini multimodal AI model.
 * Falls back to mock data if GEMINI_API_KEY is not defined.
 */
app.post('/api/scan-receipt', async (req, res) => {
  const { image, mimeType } = req.body;

  if (!image || !mimeType) {
    return res.status(400).json({ error: "Image data and mimeType are required." });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not set in .env. Returning mock scanned receipt data.");
    // Simulate brief scanning latency
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
    // Strip headers from base64 if present
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
});

/**
 * Route to save a manually entered/scanned transaction.
 */
app.post('/api/transactions/manual', (req, res) => {
  const { merchantName, totalAmount, date, category } = req.body;

  if (!merchantName || totalAmount === undefined || !date || !category) {
    return res.status(400).json({ error: "All transaction fields are required." });
  }

  try {
    const manualTx = {
      id: `TXN-MAN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      date: date,
      amount: parseFloat(totalAmount),
      type: "DEBIT", // Receipt scans are always expenses (debits)
      narration: merchantName,
      category: category
    };

    const { updatedTxs } = saveTransactions([manualTx]);
    console.log(`Saved manual transaction: ${manualTx.id}`);
    
    res.json({
      success: true,
      transactions: updatedTxs
    });
  } catch (error) {
    console.error("Failed to save manual transaction:", error.message);
    res.status(500).json({ error: "Failed to save manual transaction." });
  }
});

/**
 * Route to retrieve all saved transactions from JSON database
 */
app.get('/api/transactions', (req, res) => {
  try {
    const transactions = getAllTransactions();
    res.json({ transactions });
  } catch (error) {
    console.error("Failed to load transactions:", error.message);
    res.status(500).json({ error: "Failed to load transactions." });
  }
});

/**
 * Route to clear database transactions (clean slate for testing)
 */
app.delete('/api/transactions', (req, res) => {
  try {
    clearAllTransactions();
    res.json({ success: true, message: "Cleared all database transactions." });
  } catch (error) {
    console.error("Failed to clear database:", error.message);
    res.status(500).json({ error: "Failed to clear database." });
  }
});

// Fallback catch-all middleware to serve index.html for SPA routes
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start listening
app.listen(PORT, () => {
  console.log(`Server listening on: http://localhost:${PORT}`);
});
