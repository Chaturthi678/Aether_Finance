import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

let transporter = null;
let devTestAccount = null;

/**
 * Lazy initializer for nodemailer transporter
 */
async function getTransporter() {
  if (transporter) return transporter;

  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (emailUser && emailPass) {
    console.log(`[Email Service] Initializing Gmail SMTP Transport via service: 'gmail' for ${emailUser}`);
    transporter = nodemailer.createTransport({
      service: 'gmail',
      pool: true,
      auth: {
        user: emailUser,
        pass: emailPass
      }
    });
  } else if (host && user && pass) {
    console.log(`[Email Service] Initializing SMTP Transport via ${host}:${port}`);
    transporter = nodemailer.createTransport({
      host,
      port: parseInt(port),
      secure: parseInt(port) === 465,
      auth: { user, pass }
    });
  } else {
    console.log('[Email Service] No SMTP config found (EMAIL_USER/EMAIL_PASS or SMTP_HOST/SMTP_USER/SMTP_PASS). Generating Ethereal SMTP Test Account...');
    try {
      devTestAccount = await nodemailer.createTestAccount();
      console.log(`[Email Service] Ethereal Account Generated: ${devTestAccount.user}`);
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: devTestAccount.user,
          pass: devTestAccount.pass
        }
      });
    } catch (error) {
      console.error('[Email Service] Failed to create Ethereal test account:', error);
      // Failover to console logging transport
      transporter = {
        sendMail: async (options) => {
          console.warn('[Email Service - LOG FALLBACK] Would send email:', options);
          return { messageId: 'log-fallback-id', previewUrl: null };
        }
      };
    }
  }

  return transporter;
}

/**
 * Base styling wrapper to give emails a high-end fintech look.
 */
function getEmailWrapper(contentHtml, titleText) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${titleText}</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          background-color: #0b0f19;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          color: #f1f5f9;
        }
        .container {
          max-width: 600px;
          margin: 20px auto;
          background-color: #0e1322;
          border: 1px solid #1e293b;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
        }
        .header {
          background: linear-gradient(135deg, #3b82f6 0%, #10b981 100%);
          padding: 24px;
          text-align: center;
          border-bottom: 1px solid #1e293b;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 800;
          letter-spacing: 1px;
          color: #ffffff;
          text-transform: uppercase;
        }
        .content {
          padding: 32px 24px;
        }
        .footer {
          background-color: #070a12;
          padding: 20px;
          text-align: center;
          font-size: 11px;
          color: #64748b;
          border-top: 1px solid #1e293b;
        }
        .btn {
          display: inline-block;
          background-color: #3b82f6;
          color: #ffffff !important;
          text-decoration: none;
          padding: 12px 24px;
          font-size: 14px;
          font-weight: 700;
          border-radius: 8px;
          margin-top: 20px;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
        }
        .alert-card {
          background: rgba(30, 41, 59, 0.4);
          border: 1px solid #334155;
          border-left: 4px solid #3b82f6;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 20px;
        }
        .alert-card.danger {
          border-left-color: #ef4444;
        }
        .alert-card.success {
          border-left-color: #10b981;
        }
        .alert-card.warning {
          border-left-color: #f59e0b;
        }
        .metric-grid {
          display: table;
          width: 100%;
          margin: 20px 0;
        }
        .metric-col {
          display: table-cell;
          width: 50%;
          padding: 10px;
          text-align: center;
        }
        .metric-val {
          font-size: 22px;
          font-weight: 800;
          color: #10b981;
        }
        .metric-lbl {
          font-size: 10px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-top: 4px;
        }
        .divider {
          height: 1px;
          background-color: #1e293b;
          margin: 24px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Aether Finance</h1>
        </div>
        <div class="content">
          ${contentHtml}
        </div>
        <div class="footer">
          <p>This is a secure automated notification from Aether Finance Sandbox.</p>
          <p>&copy; 2026 Aether Finance. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Format currency to Indian Rupees display structure
 */
function formatRupees(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Core send routine wrapping transport execution.
 */
export async function sendEmailNotification(to, subject, htmlContent) {
  try {
    const activeTransporter = await getTransporter();
    const emailUser = process.env.EMAIL_USER;
    const fromAddress = process.env.EMAIL_FROM || emailUser || (devTestAccount ? devTestAccount.user : 'alerts@aether.in');

    const mailOptions = {
      from: `"Aether Finance Alerts" <${fromAddress}>`,
      to,
      subject,
      html: htmlContent
    };

    const info = await activeTransporter.sendMail(mailOptions);
    let previewUrl = null;

    if (devTestAccount) {
      previewUrl = nodemailer.getTestMessageUrl(info);
      console.log(`[Email Service] Email sent successfully! MessageID: ${info.messageId}`);
      console.log(`[Email Service] Ethereal Mailbox Preview URL: ${previewUrl}`);
    } else {
      console.log(`[Email Service] Live SMTP Email sent successfully! MessageID: ${info.messageId}`);
    }

    return {
      success: true,
      messageId: info.messageId,
      previewUrl
    };
  } catch (error) {
    console.error('[Email Service] Error delivering email:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Template generators for different event alerts.
 */
export const templates = {
  // Login / Security Alerts
  loginSecurityAlert: (userName, email, location, dateStr) => {
    const title = "New Login Detected";
    const body = `
      <h2 style="margin-top:0; font-size:18px;">Security Alert: New Sign-in</h2>
      <p>Hello ${userName},</p>
      <p>We detected a new login to your Aether Finance ledger account.</p>
      <div class="alert-card warning">
        <p style="margin: 0; font-size: 13px; font-weight: 700; color: #f59e0b;">Login details:</p>
        <p style="margin: 8px 0 0 0; font-size: 12px; color: #94a3b8;">
          <strong>Email:</strong> ${email}<br>
          <strong>IP / Location:</strong> ${location || 'Hyderabad, IN'}<br>
          <strong>Time:</strong> ${dateStr}
        </p>
      </div>
      <p style="font-size: 12px; color: #64748b;">If this wasn't you, please reset your password immediately inside your sandbox environment settings.</p>
      <a href="http://localhost:3000" class="btn" style="background-color: #f59e0b;">Review Activity</a>
    `;
    return getEmailWrapper(body, title);
  },

  // Bank Sync Alert
  bankSyncAlert: (userName, accountName, status, count, amountTotal) => {
    const title = status === 'success' ? "Bank Accounts Aggregation Success" : "Bank Accounts Sync Failed";
    const isSuccess = status === 'success';
    
    const body = `
      <h2 style="margin-top:0; font-size:18px; color: ${isSuccess ? '#10b981' : '#ef4444'};">
        ${isSuccess ? '✓ Setu Aggregator Sync Complete' : '⚠ Sync Link Disrupted'}
      </h2>
      <p>Hello ${userName},</p>
      <p>Your sandbox aggregator session linked to <strong>${accountName}</strong> has finished.</p>
      
      <div class="alert-card ${isSuccess ? 'success' : 'danger'}">
        <p style="margin:0; font-size:13px; font-weight:700;">Status: ${isSuccess ? 'Sync Succeeded' : 'Connection Timed Out'}</p>
        ${isSuccess ? `
          <p style="margin: 8px 0 0 0; font-size: 12px; color: #94a3b8;">
            Successfully fetched and decrypted <strong>${count} new bank transactions</strong>.
          </p>
        ` : `
          <p style="margin: 8px 0 0 0; font-size: 12px; color: #94a3b8;">
            Setu sandbox API gateway returned consent session expired. Please re-authenticate your linkage.
          </p>
        `}
      </div>

      ${isSuccess && amountTotal > 0 ? `
        <div class="metric-grid">
          <div class="metric-col" style="border-right: 1px solid #1e293b;">
            <div class="metric-val">${count}</div>
            <div class="metric-lbl">Transactions</div>
          </div>
          <div class="metric-col">
            <div class="metric-val" style="color: #3b82f6;">${formatRupees(amountTotal)}</div>
            <div class="metric-lbl">Total Ledger Volume</div>
          </div>
        </div>
      ` : ''}

      <a href="http://localhost:3000" class="btn">${isSuccess ? 'View Ledger Dashboard' : 'Re-connect Bank Link'}</a>
    `;
    return getEmailWrapper(body, title);
  },

  // Large Expense Alert
  largeExpenseAlert: (userName, merchant, amount, category) => {
    const title = "Large Expense Alert";
    const body = `
      <h2 style="margin-top:0; font-size:18px; color:#ef4444;">⚠ Large Debit Notification</h2>
      <p>Hello ${userName},</p>
      <p>We noticed a significant transaction in your recent banking ledger stream.</p>
      
      <div class="alert-card danger" style="padding: 20px;">
        <div style="font-size: 32px; font-weight: 800; color: #ffffff; text-align: center; margin-bottom: 12px;">
          ${formatRupees(amount)}
        </div>
        <p style="margin: 0; text-align: center; font-size: 13px; color: #94a3b8;">
          Spent at <strong>${merchant}</strong> (${category})
        </p>
      </div>

      <p style="font-size:12px; color:#64748b;">This trigger fires automatically for any debits exceeding your custom threshold. You can modify this limit inside settings.</p>
      <a href="http://localhost:3000" class="btn" style="background-color: #ef4444;">Categorize Transaction</a>
    `;
    return getEmailWrapper(body, title);
  },

  // Budget Exceeded Alert
  budgetExceededAlert: (userName, category, limit, spent, percentOver) => {
    const title = "Category Budget Exceeded";
    const percentStr = percentOver.toFixed(0);
    const body = `
      <h2 style="margin-top:0; font-size:18px; color:#f59e0b;">⚠ Budget Limits Violated</h2>
      <p>Hello ${userName},</p>
      <p>Your spending in the <strong>${category}</strong> category has exceeded its allocated limit.</p>
      
      <div class="alert-card warning">
        <p style="margin: 0; font-size: 13px; font-weight: 700; color: #f59e0b;">Budget Status:</p>
        <p style="margin: 8px 0 0 0; font-size: 12px; color: #94a3b8;">
          <strong>Category:</strong> ${category}<br>
          <strong>Allocated Limit:</strong> ${formatRupees(limit)}<br>
          <strong>Month-to-date Spent:</strong> ${formatRupees(spent)}<br>
          <strong>Exceeded By:</strong> ${percentStr}% over budget limit
        </p>
      </div>

      <!-- Simulated budget utilization progress bar -->
      <div style="width: 100%; background: #1e293b; height: 10px; border-radius: 5px; overflow: hidden; margin-top: 15px;">
        <div style="width: 100%; background: #f59e0b; height: 100%;"></div>
      </div>

      <a href="http://localhost:3000" class="btn" style="background-color: #f59e0b;">Adjust Budgets</a>
    `;
    return getEmailWrapper(body, title);
  },

  // Subscription Due Warning
  subscriptionDueAlert: (userName, subName, amount, daysLeft, dateStr) => {
    const title = `Renewal Due: ${subName}`;
    const body = `
      <h2 style="margin-top:0; font-size:18px; color: #3b82f6;">⏳ Upcoming Bill Alert</h2>
      <p>Hello ${userName},</p>
      <p>This is a reminder that your recurring renewal is coming up soon.</p>
      
      <div class="alert-card" style="border-left-color: #3b82f6;">
        <p style="margin: 0; font-size: 14px; font-weight: 700; color: #ffffff;">${subName}</p>
        <p style="margin: 8px 0 0 0; font-size: 12px; color: #94a3b8;">
          <strong>Renewal Date:</strong> ${dateStr}<br>
          <strong>Cost:</strong> ${formatRupees(amount)}<br>
          <strong>Status:</strong> Due in <strong>${daysLeft === 0 ? 'Today' : `${daysLeft} days`}</strong>
        </p>
      </div>

      <p style="font-size: 12px; color: #64748b;">Ensure you have sufficient balance in your linked account to prevent billing failures.</p>
      <a href="http://localhost:3000" class="btn">View Subscription Calendar</a>
    `;
    return getEmailWrapper(body, title);
  },

  // Monthly AI Wealth Summary
  monthlyWealthSummary: (userName, role, city, metrics, aiInsights) => {
    const title = "Your Monthly AI Wealth Summary";
    const inflowStr = formatRupees(metrics.inflow);
    const outflowStr = formatRupees(metrics.outflow);
    const savingsStr = formatRupees(metrics.savings);
    const savingsPercentStr = metrics.savingsRate.toFixed(0);

    const body = `
      <h2 style="margin-top:0; font-size:20px; text-align: center; color: #ffffff;">Monthly Wealth Insights</h2>
      <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: -8px;">Persona: ${role} (${city})</p>
      
      <p>Hello ${userName},</p>
      <p>Here is your automated financial report summarizing your ledger performance and metrics.</p>

      <div class="divider"></div>

      <div class="metric-grid">
        <div class="metric-col" style="border-right: 1px solid #1e293b;">
          <div class="metric-val" style="color: #10b981;">${inflowStr}</div>
          <div class="metric-lbl">Inflow (Credits)</div>
        </div>
        <div class="metric-col">
          <div class="metric-val" style="color: #ef4444;">${outflowStr}</div>
          <div class="metric-lbl">Outflow (Debits)</div>
        </div>
      </div>

      <div class="metric-grid" style="margin-top: 0;">
        <div class="metric-col" style="border-right: 1px solid #1e293b;">
          <div class="metric-val" style="color: #3b82f6;">${savingsStr}</div>
          <div class="metric-lbl">Net Savings</div>
        </div>
        <div class="metric-col">
          <div class="metric-val" style="color: #eab308;">${savingsPercentStr}%</div>
          <div class="metric-lbl">Savings Rate</div>
        </div>
      </div>

      <div class="divider"></div>

      <h3 style="color: #ffffff; font-size: 14px; font-weight: 700; margin-bottom: 8px;">✦ AI Wealth Engine Analysis</h3>
      <div style="background: rgba(59, 130, 246, 0.05); border: 1px solid #1e3a8a; border-radius: 12px; padding: 16px; font-size: 13px; line-height: 1.6; color: #cbd5e1;">
        ${aiInsights}
      </div>

      <a href="http://localhost:3000" class="btn" style="width: 100%; box-sizing: border-box; text-align: center;">Explore Dashboard Analytics</a>
    `;
    return getEmailWrapper(body, title);
  }
};
