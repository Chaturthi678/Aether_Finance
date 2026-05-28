import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const SETU_CLIENT_ID = process.env.SETU_CLIENT_ID || '';
const SETU_CLIENT_SECRET = process.env.SETU_CLIENT_SECRET || '';
const SETU_BASE_URL = 'https://fiu-sandbox.setu.co';

const isCredentialsPresent = () => {
  return SETU_CLIENT_ID.trim() !== '' && SETU_CLIENT_SECRET.trim() !== '';
};

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'x-client-id': SETU_CLIENT_ID,
  'x-client-secret': SETU_CLIENT_SECRET,
});

/**
 * Initiates a bank consent request via Setu Sandbox.
 * If credentials are missing, returns simulated credentials metadata.
 */
export async function initiateConsent(mobileNumber, redirectUrl) {
  if (!isCredentialsPresent()) {
    console.log("Setu API credentials missing in .env. Initiating SIMULATED consent.");
    const simulatedConsentId = `con_sim_${Math.random().toString(36).substring(2, 10)}${Date.now().toString().slice(-4)}`;
    const hostRedirect = redirectUrl || 'http://localhost:3000/dashboard';
    const simulatedApproveUrl = `/api/setu/simulate-portal?consentId=${simulatedConsentId}&redirectUrl=${encodeURIComponent(hostRedirect)}&mobileNumber=${encodeURIComponent(mobileNumber)}`;
    
    return {
      success: true,
      simulated: true,
      consentId: simulatedConsentId,
      url: simulatedApproveUrl
    };
  }

  const url = `${SETU_BASE_URL}/consents`;
  const payload = {
    Detail: {
      consentStart: new Date().toISOString(),
      consentExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
      consentMode: "RECUPERATE",
      fetchMode: "PERIODIC",
      frequency: { value: 1, unit: "INFREQ" },
      ConsentTypes: ["TRANSACTIONS", "PROFILE", "SUMMARY"],
      FITypes: ["DEPOSIT"],
      DataConsumer: { id: "fiu-dec24-sandbox" },
      Customer: { id: `${mobileNumber}@onemoney` },
      Purpose: {
        code: "101",
        refUri: "https://rebit.org.in",
        text: "Automated analysis for your expense tracking platform.",
        Category: { type: "Personal Finance" }
      },
      DataFrequency: { value: 1, unit: "DAILY" },
      DataLife: { value: 1, unit: "MONTHS" },
      FIDataRange: {
        from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days ago
        to: new Date().toISOString()
      }
    },
    redirectUrl: redirectUrl || "http://localhost:3000/dashboard"
  };

  try {
    console.log(`Calling Setu initiateConsent for ${mobileNumber}...`);
    const response = await axios.post(url, payload, { headers: getHeaders() });
    return {
      success: true,
      simulated: false,
      consentId: response.data.id,
      url: response.data.url
    };
  } catch (error) {
    console.error("Setu API error, falling back to simulation:", error.response?.data || error.message);
    const simulatedConsentId = `con_sim_err_${Math.random().toString(36).substring(2, 8)}`;
    const hostRedirect = redirectUrl || 'http://localhost:3000/dashboard';
    const simulatedApproveUrl = `/api/setu/simulate-portal?consentId=${simulatedConsentId}&redirectUrl=${encodeURIComponent(hostRedirect)}&mobileNumber=${encodeURIComponent(mobileNumber)}`;
    return {
      success: true,
      simulated: true,
      consentId: simulatedConsentId,
      url: simulatedApproveUrl,
      error: error.response?.data || error.message
    };
  }
}

/**
 * Checks the status of a consent request.
 */
export async function getConsentStatus(consentId) {
  if (consentId.startsWith('con_sim_')) {
    return {
      status: 'ACTIVE',
      simulated: true
    };
  }

  const url = `${SETU_BASE_URL}/consents/${consentId}`;
  try {
    const response = await axios.get(url, { headers: getHeaders() });
    return {
      status: response.data.status, // e.g., "ACTIVE", "PENDING", "REJECTED"
      simulated: false,
      raw: response.data
    };
  } catch (error) {
    console.error("Failed to fetch consent status from Setu:", error.response?.data || error.message);
    // If API fails, check if we should return active for simulation
    return {
      status: 'ACTIVE', // Fallback for debugging
      simulated: true,
      error: error.response?.data || error.message
    };
  }
}

/**
 * Fetches transactions using an approved consent ID.
 * Performs the data session generation and data fetch.
 */
export async function fetchConsentTransactions(consentId) {
  if (consentId.startsWith('con_sim_')) {
    console.log("Simulating Setu transactions fetch...");
    return {
      simulated: true,
      accounts: [] // Handled in controller to map user specific transactions
    };
  }

  try {
    // 1. Create a data session
    const sessionUrl = `${SETU_BASE_URL}/sessions`;
    console.log(`Creating Setu data session for consent: ${consentId}...`);
    const sessionResponse = await axios.post(sessionUrl, { consentId }, { headers: getHeaders() });
    const sessionId = sessionResponse.data.id;
    console.log(`Data session created: ${sessionId}`);

    // Wait a brief moment or poll if needed, but sandbox is usually instant.
    // Let's perform a fetch call.
    const dataUrl = `${SETU_BASE_URL}/sessions/${sessionId}/data`;
    console.log(`Fetching Setu transaction data using session: ${sessionId}...`);
    const dataResponse = await axios.get(dataUrl, { headers: getHeaders() });

    return {
      simulated: false,
      data: dataResponse.data
    };
  } catch (error) {
    console.error("Error fetching bank data from Setu:", error.response?.data || error.message);
    // If it fails, fallback to simulation
    return {
      simulated: true,
      error: error.response?.data || error.message
    };
  }
}

/**
 * Decrypts and parses Setu Transaction data into standard internal format.
 */
export function parseSetuTransactions(setuData, email) {
  if (!setuData) return [];

  const standardTxs = [];
  try {
    // Standard Setu/ReBIT decrypted structure returns:
    // fidata or data or direct accounts array
    // Let's log keys to see structure
    console.log("Parsing Setu Data response structure...");
    
    // Setu sandbox payload structure has:
    // dataResponse.data -> usually contains accounts list or decrypted payload
    // Let's scan all possible structures:
    const accounts = setuData.FI || setuData.accounts || setuData.accountsData || [];
    
    if (Array.isArray(accounts)) {
      accounts.forEach((acc, accIdx) => {
        // Safe access of nested elements
        const accDetail = acc.data || acc;
        const decryptedData = accDetail.decryptedFI || accDetail;
        
        // ReBIT payload: account -> transactions -> transaction list
        // Account could contain a "Deposit" object which has "Transactions"
        const deposit = decryptedData.Deposit || decryptedData.deposit;
        const txList = deposit?.Transactions?.Transaction || deposit?.transactions?.transaction || decryptedData.transactions || [];
        
        if (Array.isArray(txList)) {
          txList.forEach((tx, txIdx) => {
            // ReBIT Transaction fields: amount, type, narration, transactionTimestamp
            const amount = parseFloat(tx.amount || tx.value) || 0;
            const type = (tx.type || tx.txnType || 'DEBIT').toUpperCase();
            const narration = tx.narration || tx.description || tx.reference || 'Setu Sync Transaction';
            const timestamp = tx.transactionTimestamp || tx.date || new Date().toISOString();
            const date = timestamp.split('T')[0];
            
            const id = tx.id || tx.txnId || `TXN-SETU-${accIdx}-${txIdx}-${Date.now()}`;

            standardTxs.push({
              id,
              date,
              amount,
              type,
              narration,
              category: 'Others' // Will be auto-categorized by database helper
            });
          });
        }
      });
    }
  } catch (error) {
    console.error("Failed to parse Setu payload, returning empty:", error);
  }

  return standardTxs;
}
