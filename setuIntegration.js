import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

// Load your Setu credentials from .env file
const SETU_CLIENT_ID = process.env.SETU_CLIENT_ID;
const SETU_CLIENT_SECRET = process.env.SETU_CLIENT_SECRET;
const SETU_BASE_URL = 'https://fiu-sandbox.setu.co'; // Change to production URL later

// Helper to get authenticated Setu Headers
const getHeaders = () => ({
  'Content-Type': 'application/json',
  'x-client-id': SETU_CLIENT_ID,
  'x-client-secret': SETU_CLIENT_SECRET,
});

/**
 * STEP A: Initiate a Consent Request
 * This generates a web URL where you log in with your phone number and approve access via OTP.
 */
export async function createBankConsent(userMobileNumber) {
  const url = `${SETU_BASE_URL}/consents`;
  
  const payload = {
    Detail: {
      consentStart: new Date().toISOString(),
      consentExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // Valid for 1 year
      consentMode: "RECUPERATE", // Allows recurring fetch
      fetchMode: "PERIODIC",
      frequency: { value: 1, unit: "INFREQ" }, // How often to auto-fetch
      ConsentTypes: ["TRANSACTIONS", "PROFILE", "SUMMARY"],
      FITypes: ["DEPOSIT"], // Fetches Savings and Current Accounts
      DataConsumer: { id: "YOUR_FIU_ID_FROM_SETU" },
      Customer: { id: `${userMobileNumber}@onemoney` }, // Uses your phone handle
      Purpose: {
        code: "101", // Code for Wealth Management / Personal Finance
        refUri: "https://rebit.org.in",
        text: "Automated analysis for your expense tracking dashboard.",
        Category: { type: "Personal Finance" }
      },
      DataFrequency: { value: 1, unit: "DAILY" },
      DataLife: { value: 1, unit: "MONTHS" },
      FIDataRange: {
        from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), // Pull past 90 days
        to: new Date().toISOString()
      }
    },
    redirectUrl: "http://localhost:3000/dashboard" // Point this back to your frontend app
  };

  try {
    const response = await axios.post(url, payload, { headers: getHeaders() });
    // This returns a 'url' that you must click to link your actual bank
    return response.data; 
  } catch (error) {
    console.error("Error creating Setu Consent:", error.response?.data || error.message);
    throw error;
  }
}

/**
 * STEP B: Fetch the real transactions
 * Once you approve the consent screen, use this function to pull transactions.
 */
export async function fetchBankTransactions(consentId) {
  try {
    // 1. Create a data session first
    const sessionUrl = `${SETU_BASE_URL}/sessions`;
    const sessionResponse = await axios.post(sessionUrl, { consentId }, { headers: getHeaders() });
    const sessionId = sessionResponse.data.id;

    // 2. Fetch financial data using the session ID
    const dataUrl = `${SETU_BASE_URL}/sessions/${sessionId}/data`;
    const dataResponse = await axios.get(dataUrl, { headers: getHeaders() });
    
    // This object contains all transaction data decrypted and clean!
    return dataResponse.data; 
  } catch (error) {
    console.error("Error fetching bank data from Setu:", error.response?.data || error.message);
    throw error;
  }
}
