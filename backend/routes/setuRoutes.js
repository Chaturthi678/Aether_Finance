import express from 'express';
import { 
  initiateConsent, 
  getConsentStatus, 
  fetchConsentTransactions, 
  parseSetuTransactions 
} from '../services/setuService.js';
import { generateMockBankData } from '../mock/setuMock.js';
import { saveTransactions } from '../db/db.js';
import { checkUserEmail } from '../middleware/auth.js';
import { checkSyncAlerts } from '../services/notificationEngine.js';

const router = express.Router();

// 1. Create Consent request
router.post('/consent', checkUserEmail, async (req, res) => {
  const { mobileNumber, redirectUrl } = req.body;
  if (!mobileNumber) {
    return res.status(400).json({ error: "Mobile number is required." });
  }

  try {
    const result = await initiateConsent(mobileNumber, redirectUrl);
    res.json(result);
  } catch (error) {
    console.error("Consent endpoint failed:", error);
    res.status(500).json({ error: "Failed to initiate consent request." });
  }
});

// 2. Fetch Consent Status
router.get('/consent-status/:consentId', checkUserEmail, async (req, res) => {
  const { consentId } = req.params;
  try {
    const status = await getConsentStatus(consentId);
    res.json(status);
  } catch (error) {
    console.error("Status check failed:", error);
    res.status(500).json({ error: "Failed to verify consent status." });
  }
});

// 3. Sync transactions from Setu session
router.post('/sync', checkUserEmail, async (req, res) => {
  const { consentId } = req.body;
  const email = req.userEmail;

  if (!consentId) {
    return res.status(400).json({ error: "consentId is required to sync." });
  }

  try {
    console.log(`Syncing Setu bank transactions for user: ${email}, consentId: ${consentId}`);
    const fetchResult = await fetchConsentTransactions(consentId);

    let syncedTransactions = [];

    if (fetchResult.simulated) {
      console.log(`Setu Service returned simulated flag. Injecting user-persona defaults for ${email}...`);
      // Fallback: generates user specific transactions
      syncedTransactions = await generateMockBankData(email);
    } else {
      // Parse real Setu transactions
      console.log("Parsing real Setu transaction data...");
      const rawTxs = parseSetuTransactions(fetchResult.data, email);
      if (rawTxs.length > 0) {
        const { updatedTxs } = await saveTransactions(rawTxs, email);
        syncedTransactions = updatedTxs;
      } else {
        // If data is present but empty, or we want to populate something realistic for Sandbox
        console.log("No transactions found in real response, injecting sandbox mockup.");
        syncedTransactions = await generateMockBankData(email);
      }
    }

    // Trigger sync alerts
    checkSyncAlerts(email, syncedTransactions, true).catch(err => {
      console.error("Sync alert checking failed in Setu Routes:", err);
    });

    res.json({
      success: true,
      message: "Bank transactions synced successfully via Setu Sandbox.",
      transactions: syncedTransactions
    });
  } catch (error) {
    console.error("Sync transaction endpoint failed:", error);
    checkSyncAlerts(email, [], false).catch(err => {
      console.error("Failed sync alert dispatching failed:", err);
    });
    res.status(500).json({ error: "Failed to sync sandbox transactions." });
  }
});

// 4. Simulated Account Aggregator portal UI
router.get('/simulate-portal', (req, res) => {
  const { consentId, redirectUrl, mobileNumber } = req.query;
  
  if (!consentId || !redirectUrl) {
    return res.status(400).send("consentId and redirectUrl are required query parameters.");
  }

  const cleanRedirect = redirectUrl.toString();
  const cleanMobile = mobileNumber ? mobileNumber.toString() : '9999999999';

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Setu Account Aggregator Sandbox</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">
      <style>
        :root {
          --bg-dark: #0b0f19;
          --bg-panel: #151b2c;
          --primary: #5b6df8;
          --primary-hover: #4859e0;
          --success: #10b981;
          --danger: #f43f5e;
          --border: rgba(255, 255, 255, 0.08);
          --text-white: #ffffff;
          --text-muted: #94a3b8;
        }
        
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        
        body {
          background-color: var(--bg-dark);
          color: var(--text-white);
          font-family: 'Inter', sans-serif;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .container {
          max-width: 480px;
          width: 100%;
          background: rgba(21, 27, 44, 0.7);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid var(--border);
          border-radius: 24px;
          padding: 32px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
        }

        .header {
          text-align: center;
          margin-bottom: 24px;
        }

        .logo-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 12px;
          background: rgba(91, 109, 248, 0.1);
          border: 1px solid rgba(91, 109, 248, 0.2);
          color: var(--primary);
          font-weight: 700;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 12px;
        }

        h1 {
          font-family: 'Outfit', sans-serif;
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 6px;
        }

        .subtitle {
          font-size: 13px;
          color: var(--text-muted);
        }

        .consent-details {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: 16px;
          padding: 16px;
          margin-bottom: 24px;
          font-size: 13px;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 6px 0;
        }

        .detail-label {
          color: var(--text-muted);
        }

        .detail-value {
          font-weight: 600;
        }

        .scope-badge {
          background: rgba(255, 255, 255, 0.06);
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
          margin-left: 4px;
          display: inline-block;
        }

        .divider {
          height: 1px;
          background: var(--border);
          margin: 16px 0;
        }

        /* Screen 1 (Verification) / Screen 2 (Approved) */
        .step {
          display: none;
        }
        
        .step.active {
          display: block;
        }

        .input-group {
          margin-bottom: 20px;
        }

        label {
          display: block;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
          font-weight: 600;
          margin-bottom: 8px;
        }

        input, select {
          width: 100%;
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 14px 16px;
          font-family: inherit;
          color: white;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s;
        }

        input:focus, select:focus {
          border-color: var(--primary);
        }

        .bank-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          margin-bottom: 20px;
        }

        .bank-card {
          border: 1px solid var(--border);
          background: rgba(255, 255, 255, 0.02);
          padding: 16px;
          border-radius: 14px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          user-select: none;
        }

        .bank-card.selected {
          border-color: var(--primary);
          background: rgba(91, 109, 248, 0.08);
        }

        .bank-icon {
          font-size: 20px;
          margin-bottom: 6px;
        }

        .bank-name {
          font-size: 12px;
          font-weight: 600;
        }

        .btn {
          width: 100%;
          padding: 14px;
          border-radius: 12px;
          border: none;
          font-family: inherit;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.1s, opacity 0.2s;
        }

        .btn-primary {
          background: var(--primary);
          color: white;
          margin-bottom: 12px;
        }

        .btn-primary:hover {
          background: var(--primary-hover);
        }

        .btn-primary:active {
          transform: scale(0.99);
        }

        .btn-outline {
          background: transparent;
          border: 1px solid var(--border);
          color: var(--text-muted);
        }

        .btn-outline:hover {
          color: white;
          background: rgba(255, 255, 255, 0.02);
        }

        .btn-danger {
          background: var(--danger);
          color: white;
        }

        .btn-danger:hover {
          opacity: 0.9;
        }

        .otp-hint {
          background: rgba(16, 185, 129, 0.08);
          border: 1px solid rgba(16, 185, 129, 0.15);
          color: var(--success);
          padding: 10px;
          border-radius: 10px;
          font-size: 11px;
          text-align: center;
          margin-bottom: 16px;
          font-weight: 500;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo-badge">Setu AA Sandbox</div>
          <h1>Link Bank Account</h1>
          <p class="subtitle">Consent Request Approval Portal</p>
        </div>

        <div class="consent-details">
          <div class="detail-row">
            <span class="detail-label">Consenting to</span>
            <span class="detail-value">Aether Finance Platform</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Consent ID</span>
            <span class="detail-value" style="font-family: monospace; font-size:11px;">${consentId}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Data Types</span>
            <span class="detail-value">
              <span class="scope-badge">Profile</span>
              <span class="scope-badge">Summary</span>
              <span class="scope-badge">Transactions</span>
            </span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Purpose</span>
            <span class="detail-value">Wealth Management (101)</span>
          </div>
        </div>

        <!-- STEP 1: Bank & OTP Setup -->
        <div id="step-1" class="step active">
          <div class="input-group">
            <label>Select Financial Provider (FIP)</label>
            <div class="bank-grid">
              <div class="bank-card selected" onclick="selectBank(this, 'HDFC')">
                <div class="bank-icon">🏦</div>
                <div class="bank-name">HDFC Bank</div>
              </div>
              <div class="bank-card" onclick="selectBank(this, 'ICICI')">
                <div class="bank-icon">💳</div>
                <div class="bank-name">ICICI Bank</div>
              </div>
              <div class="bank-card" onclick="selectBank(this, 'SBI')">
                <div class="bank-icon">🏢</div>
                <div class="bank-name">SBI</div>
              </div>
              <div class="bank-card" onclick="selectBank(this, 'Axis')">
                <div class="bank-icon">📈</div>
                <div class="bank-name">Axis Bank</div>
              </div>
            </div>
          </div>

          <div class="input-group">
            <label>Mobile Handle VUA</label>
            <input type="text" value="${cleanMobile}@onemoney" disabled />
          </div>

          <div class="input-group">
            <label>Enter Sandbox Approval OTP</label>
            <input type="text" id="otp-input" placeholder="Enter OTP (e.g. 123456)" maxlength="6" value="123456" />
          </div>
          
          <div class="otp-hint">
            💡 Sandbox Mode: Use OTP <strong>123456</strong> for automatic approval.
          </div>

          <button class="btn btn-primary" onclick="proceedToApprove()">Approve Consent</button>
          <button class="btn btn-outline" onclick="cancelConsent()">Cancel Request</button>
        </div>
      </div>

      <script>
        let selectedBank = 'HDFC';

        function selectBank(element, bankCode) {
          document.querySelectorAll('.bank-card').forEach(c => c.classList.remove('selected'));
          element.classList.add('selected');
          selectedBank = bankCode;
        }

        function proceedToApprove() {
          const otp = document.getElementById('otp-input').value.trim();
          if (otp !== '123456') {
            alert('Invalid sandbox OTP! Use 123456.');
            return;
          }

          // Successful consent approval
          const redirectUrl = "${cleanRedirect}?success=true&id=${consentId}";
          window.location.href = redirectUrl;
        }

        function cancelConsent() {
          // Consent cancellation
          const redirectUrl = "${cleanRedirect}?success=false&errorcode=1&errormsg=User+cancelled+the+sandbox+consent+approval+flow";
          window.location.href = redirectUrl;
        }
      </script>
    </body>
    </html>
  `);
});

export default router;
