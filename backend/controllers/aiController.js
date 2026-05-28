import axios from 'axios';

// Get persona descriptions for context injection
function getPersonaDescription(email) {
  const mail = (email || '').toLowerCase();
  if (mail.includes('aarav')) {
    return "College Student from Ahmedabad. Typical behavior: Low income allowance, numerous small UPI tea/chai debits, Zomato deliveries, movie tickets, cheap transport, tight budgets.";
  } else if (mail.includes('ananya')) {
    return "Software Engineer in Bangalore. Typical behavior: High salary inflow (₹1,50,000/mo), premium dining, electronics shopping, rent payments, active mutual fund investments (SIPs), Jio broadband bills.";
  } else if (mail.includes('kabir')) {
    return "Small Business Owner in Delhi. Typical behavior: Frequent customer invoice credits, office rent, transport/logistics payouts, business dining, fuel, large utility recharges.";
  } else if (mail.includes('diya')) {
    return "Freelance UI Designer in Mumbai. Typical behavior: Multiple variable freelance gig credits, lifestyle spending, co-working desk subscription, Adobe CC subscription, Uber rides, high entertainment costs.";
  }
  return "Personal financial tracker user.";
}

/**
 * Handle conversational inquiries contextually filtered by user database.
 */
export async function queryAiAssistant(req, res) {
  const { message, transactions } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required." });
  }

  const txs = transactions || [];
  const apiKey = process.env.GEMINI_API_KEY;
  const persona = getPersonaDescription(req.userEmail);

  // Compute key indicators for AI prompt context injection
  const debits = txs.filter(t => t.type === 'DEBIT');
  const credits = txs.filter(t => t.type === 'CREDIT');
  const totalDebit = debits.reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalCredit = credits.reduce((sum, t) => sum + (t.amount || 0), 0);
  const netBalance = totalCredit - totalDebit;
  const savingsRate = totalCredit > 0 ? ((netBalance / totalCredit) * 100).toFixed(1) : '0';

  // Category breakdown
  const categoryTotals = {};
  debits.forEach(t => {
    const cat = t.category || 'Others';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + t.amount;
  });

  const categoriesStr = Object.entries(categoryTotals)
    .map(([cat, amt]) => `- ${cat}: ₹${amt.toFixed(2)}`)
    .join('\n');

  // Find top spending category
  const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
  const topCategoryStr = sortedCategories.length > 0 
    ? `${sortedCategories[0][0]} (₹${sortedCategories[0][1].toFixed(2)})` 
    : 'None';

  // Find top merchant
  const merchantTotals = {};
  debits.forEach(t => {
    const merchant = t.narration || 'Unknown';
    merchantTotals[merchant] = (merchantTotals[merchant] || 0) + t.amount;
  });
  const sortedMerchants = Object.entries(merchantTotals).sort((a, b) => b[1] - a[1]);
  const topMerchantStr = sortedMerchants.length > 0 
    ? `${sortedMerchants[0][0]} (₹${sortedMerchants[0][1].toFixed(2)})`
    : 'None';

  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not set in .env. Returning analytical mock AI response.");
    await new Promise(resolve => setTimeout(resolve, 800));

    const textLower = message.toLowerCase();
    let reply = "";

    if (textLower.includes("analyze") || textLower.includes("summary") || textLower.includes("spend") || textLower.includes("stat")) {
      reply = `Here is a personalized summary of your ledger as a **${persona.split('.')[0]}** compiled by your local offline assistant:
- **Total Income**: ₹${totalCredit.toFixed(2)}
- **Total Expenses**: ₹${totalDebit.toFixed(2)}
- **Net Savings**: ₹${netBalance.toFixed(2)} (Savings Rate: ${savingsRate}%)
- **Top Spending Category**: ${topCategoryStr}
- **Top Spending Merchant**: ${topMerchantStr}

**Expenses by Category:**
${categoriesStr || "No debit transactions recorded."}

*(Offline Note: Set your GEMINI_API_KEY in .env for full conversational analysis!)*`;
    } else if (textLower.includes("tip") || textLower.includes("save") || textLower.includes("budget") || textLower.includes("recommend")) {
      if (req.userEmail.includes('aarav')) {
        reply = `Hi Aarav! Here are some college budgeting tips based on your recent transactions:
1. **Chai & Bakery UPI Expenses**: You have multiple small Paytm/GPay debits. These small ₹20-50 amounts add up fast! Try keeping a weekly cap of ₹250 on tea stalls.
2. **Food Deliveries**: Zomato orders are eating up your allowance. Try cooking basic meals or using student discounts.
3. **Netflix Sharing**: Since budgets are tight (allowance ₹8,000/mo), audit shared subscriptions to make sure you aren't paying for unused slots.`;
      } else if (req.userEmail.includes('ananya')) {
        reply = `Hi Ananya! As a Software Engineer with a ₹1.5L/mo salary, here are your saving recommendations:
1. **Mutual Fund SIPs**: You currently invest ₹25,000/mo. Consider stepping up your SIPs by 10% next month using your savings buffer (Net Savings: ₹${netBalance.toFixed(2)}).
2. **Premium Dining & Swiggy**: High spending is concentrated in gourmet deliveries. Setting a dining budget of ₹10,000/mo could free up extra cash for tax-saving ELSS funds.
3. **Broadband/Utility Auto-Pay**: Keep your broadband and rent transfers scheduled to build a solid CIBIL credit score record in Bangalore.`;
      } else if (req.userEmail.includes('kabir')) {
        reply = `Hello Kabir! Business analytics tips for your small business:
1. **Invoice Tracking**: Monitor customer invoice credits (e.g. ₹1.2L from Ramesh). Send automatic reminders 3 days before payment terms to improve cash flow.
2. **Logistics & Fuel Audit**: Fuel (HPCL) and Blue Dart shipping are major expenses. Compare shipping vendors to negotiate bulk contract discounts.
3. **Utility recharges**: Deduct business broadband and electricity recharges under business expenses to claim proper GST input credits.`;
      } else if (req.userEmail.includes('diya')) {
        reply = `Hi Diya! Freelance UI Designer budgeting advice:
1. **Irregular Income Management**: Your payout amounts are variable. Transfer 40% of freelance gig credits (like your ₹45,000 website payout) into a separate "Tax & Business Buffer" account.
2. **SaaS Subscriptions**: Ensure your Adobe Creative Suite (₹4,200) and WeWork co-working desks are fully active only during billable project months.
3. **Uber & Entertainment**: Uber rides and BookMyShow concert tickets comprise a significant portion of your lifestyle outflow. Try capping lifestyle spends to ₹15,000/mo during low-contract quarters.`;
      } else {
        reply = `Here is a custom budgeting recommendation:
- Maintain an emergency fund equivalent to 6 months of your average outflow (approx. ₹${(totalDebit * 6).toFixed(2)}).
- Cap discretionary categories (Shopping, Entertainment) to 20% of your incoming revenue.`;
      }
    } else {
      reply = `Hi! I'm Aether AI, your personal financial advisor. I notice you are logged in as a **${persona.split('.')[0]}**.

Here is a quick snapshot of your active isolated database:
- Transactions loaded: **${txs.length}**
- Total cash flow credit: **₹${totalCredit.toFixed(2)}**
- Total outflow debit: **₹${totalDebit.toFixed(2)}**
- Net ledger balance: **₹${netBalance.toFixed(2)}**
- Top categories: **${topCategoryStr}**

Ask me to **"analyze my spending"** or ask for **"saving tips"** to see personalized analysis!`;
    }

    return res.json({
      success: true,
      reply: reply
    });
  }

  try {
    console.log(`Sending contextual inquiry to Gemini API for ${req.userEmail}...`);

    const promptText = `You are "Aether AI", an expert personal financial advisor and expense tracking assistant tailored for Indian users.
You have access to the user's financial transactions array. Answer their question concisely using markdown. Do not include markdown codeblocks around your entire answer, write directly in clean text.

Here is the user's Profile Context:
- Email: ${req.userEmail}
- Persona & Typical Behavior: ${persona}

Here is the user's Ledger Metrics Summary:
- Total Inflow (Credits): ₹${totalCredit.toFixed(2)}
- Total Outflow (Debits/Expenses): ₹${totalDebit.toFixed(2)}
- Net Balance (Savings): ₹${netBalance.toFixed(2)}
- Savings Rate: ${savingsRate}%
- Top Spending Category: ${topCategoryStr}
- Top Merchant: ${topMerchantStr}

Here is the raw transactions array context:
${JSON.stringify(txs, null, 2)}

User's Question: "${message}"

Give helpful, professional, and mathematically accurate financial advice. Reference specific transactions, amounts, and dates if relevant. Keep it clean and direct. Customise your tone and recommendations specifically to their demographic role (student, engineer, business owner, freelancer).`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const response = await axios.post(url, {
      contents: [
        {
          parts: [
            { text: promptText }
          ]
        }
      ]
    }, {
      headers: { 'Content-Type': 'application/json' }
    });

    const reply = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!reply) {
      throw new Error("Empty response from Gemini API");
    }

    res.json({
      success: true,
      reply: reply.trim()
    });

  } catch (error) {
    console.error("Gemini Assistant call failed:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to communicate with AI Assistant.", details: error.message });
  }
}
