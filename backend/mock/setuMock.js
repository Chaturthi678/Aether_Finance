import { saveTransactions } from '../db/db.js';

function generateRandomTransactions(email) {
  const currentYear = new Date().getFullYear();
  const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
  
  const foodMerchants = ["Zomato Food Delivery", "Swiggy Order", "Blue Tokai Coffee", "Chai Point Tapri", "Starbucks India", "Burger King", "Local Dhaba"];
  const shoppingMerchants = ["Amazon India", "Flipkart Shop", "Myntra Clothing", "Nykaa Cosmetics", "Decathlon Sports"];
  const transportMerchants = ["Uber Cab Ride", "Ola Auto", "Rapido Bike", "HPCL Petrol Pump", "BPCL Fuel Depot", "Metro SmartCard"];
  const entertainmentMerchants = ["BookMyShow Movies", "Spotify Premium", "Netflix Subscription", "Prime Video", "PlayStation Network"];
  const billsMerchants = ["Jio Fiber Broadband", "Airtel Mobile Recharge", "BESCOM Electricity Bill", "Adani Gas Utility"];
  const investmentMerchants = ["Zerodha Mutual Fund SIP", "Groww Stocks", "HDFC PPF Deposit"];
  const incomeMerchants = ["Aether Corporate Salary", "Freelance Client Payout", "UPI Inbound/Refund", "Stripe Transfer"];

  const categories = {
    "Food & Dining": foodMerchants,
    "Shopping": shoppingMerchants,
    "Transport": transportMerchants,
    "Entertainment": entertainmentMerchants,
    "Bills & Utilities": billsMerchants,
    "Investments": investmentMerchants,
    "Salary": incomeMerchants
  };

  const count = 15 + Math.floor(Math.random() * 15); // 15 to 30 transactions
  const txs = [];

  // Always add one or two salaries/income sources
  const salaryCount = 1 + Math.floor(Math.random() * 2);
  for (let i = 0; i < salaryCount; i++) {
    const day = String(1 + Math.floor(Math.random() * 5)).padStart(2, '0'); // start of month
    const amount = 30000 + Math.floor(Math.random() * 70000); // 30k to 100k
    const merchant = incomeMerchants[Math.floor(Math.random() * incomeMerchants.length)];
    txs.push({
      id: `TXN-RAND-${Math.floor(Math.random() * 1000000)}`,
      date: `${currentYear}-${currentMonth}-${day}`,
      amount: amount,
      type: "CREDIT",
      narration: `UPI/CR/${merchant.replace(/\s+/g, '')}/StateBank`,
      category: merchant.includes("Salary") || merchant.includes("Freelance") ? "Salary" : "Others"
    });
  }

  // Generate random debits
  for (let i = 0; i < count; i++) {
    const dayVal = 1 + Math.floor(Math.random() * 27);
    const day = String(dayVal).padStart(2, '0');
    
    // Choose a random category and merchant
    const catKeys = Object.keys(categories).filter(c => c !== "Salary");
    const category = catKeys[Math.floor(Math.random() * catKeys.length)];
    const merchantList = categories[category];
    const merchant = merchantList[Math.floor(Math.random() * merchantList.length)];
    
    let amount = 50 + Math.floor(Math.random() * 1500); // small daily transactions
    if (category === "Investments") {
      amount = 2000 + Math.floor(Math.random() * 8000);
    } else if (category === "Bills & Utilities" && merchant.includes("Electricity")) {
      amount = 1500 + Math.floor(Math.random() * 2500);
    } else if (category === "Shopping") {
      amount = 300 + Math.floor(Math.random() * 5000);
    }

    txs.push({
      id: `TXN-RAND-${Math.floor(Math.random() * 1000000)}`,
      date: `${currentYear}-${currentMonth}-${day}`,
      amount: parseFloat(amount.toFixed(2)),
      type: "DEBIT",
      narration: `UPI/DR/${merchant.replace(/\s+/g, '')}/HDFCBank`,
      category: category
    });
  }

  // Sort transactions by date descending
  txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return txs;
}

/**
 * SIMULATES THE REAL SETU AA FETCH DATA PIPELINE
 * Generates highly realistic local Indian banking data instantly for a specific user.
 */
export async function generateMockBankData(userId) {
  const currentYear = new Date().getFullYear();
  const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
  
  let mockTransactions = [];

  const email = (userId || 'default').toLowerCase();

  if (email.includes('aarav')) {
    // Aarav Patel - College Student
    mockTransactions = [
      { id: "TXN-AAR-101", date: `${currentYear}-${currentMonth}-20`, amount: 320.00, type: "DEBIT", narration: "UPI/DR/Zomato/RZPY/Axis", category: "Food & Dining" },
      { id: "TXN-AAR-102", date: `${currentYear}-${currentMonth}-19`, amount: 40.00, type: "DEBIT", narration: "UPI/DR/TapriChai/Paytm", category: "Food & Dining" },
      { id: "TXN-AAR-103", date: `${currentYear}-${currentMonth}-18`, amount: 8000.00, type: "CREDIT", narration: "UPI/CR/ParentsAllowance/GPay", category: "Salary" },
      { id: "TXN-AAR-104", date: `${currentYear}-${currentMonth}-17`, amount: 280.00, type: "DEBIT", narration: "UPI/DR/BookMyShow/Movies", category: "Entertainment" },
      { id: "TXN-AAR-105", date: `${currentYear}-${currentMonth}-16`, amount: 199.00, type: "DEBIT", narration: "UPI/DR/NetflixSharing/Auto", category: "Entertainment" },
      { id: "TXN-AAR-106", date: `${currentYear}-${currentMonth}-15`, amount: 90.00, type: "DEBIT", narration: "UPI/DR/OlaAuto/Transport", category: "Transport" },
      { id: "TXN-AAR-107", date: `${currentYear}-${currentMonth}-14`, amount: 25.00, type: "DEBIT", narration: "UPI/DR/ChaiTapri/GPay", category: "Food & Dining" },
      { id: "TXN-AAR-108", date: `${currentYear}-${currentMonth}-12`, amount: 110.00, type: "CREDIT", narration: "UPI/CR/FriendSplit/Dinner", category: "Food & Dining" },
      { id: "TXN-AAR-109", date: `${currentYear}-${currentMonth}-10`, amount: 65.00, type: "DEBIT", narration: "UPI/DR/LocalBakery/Snacks", category: "Food & Dining" },
      { id: "TXN-AAR-110", date: `${currentYear}-${currentMonth}-05`, amount: 299.00, type: "DEBIT", narration: "UPI/DR/JioPrepaid/Recharge", category: "Bills & Utilities" }
    ];
  } else if (email.includes('ananya')) {
    // Ananya Sharma - Software Engineer
    mockTransactions = [
      { id: "TXN-ANA-201", date: `${currentYear}-${currentMonth}-20`, amount: 1200.00, type: "DEBIT", narration: "UPI/DR/SwiggyGourmet/Axis", category: "Food & Dining" },
      { id: "TXN-ANA-202", date: `${currentYear}-${currentMonth}-19`, amount: 18900.00, type: "DEBIT", narration: "UPI/DR/AmazonIn/AirPods", category: "Shopping" },
      { id: "TXN-ANA-203", date: `${currentYear}-${currentMonth}-18`, amount: 4500.00, type: "DEBIT", narration: "POS/DR/PremiumFineDining", category: "Food & Dining" },
      { id: "TXN-ANA-204", date: `${currentYear}-${currentMonth}-15`, amount: 25000.00, type: "DEBIT", narration: "NEFT/DR/HDFCMutualFund/SIP", category: "Investments" },
      { id: "TXN-ANA-205", date: `${currentYear}-${currentMonth}-12`, amount: 2499.00, type: "DEBIT", narration: "UPI/DR/JioFiber/Broadband", category: "Bills & Utilities" },
      { id: "TXN-ANA-206", date: `${currentYear}-${currentMonth}-10`, amount: 850.00, type: "DEBIT", narration: "UPI/DR/UberPremier/Cab", category: "Transport" },
      { id: "TXN-ANA-207", date: `${currentYear}-${currentMonth}-08`, amount: 649.00, type: "DEBIT", narration: "UPI/DR/NetflixPremium/Card", category: "Entertainment" },
      { id: "TXN-ANA-208", date: `${currentYear}-${currentMonth}-05`, amount: 3200.00, type: "DEBIT", narration: "UPI/DR/BESCOMElectricity/Bill", category: "Bills & Utilities" },
      { id: "TXN-ANA-209", date: `${currentYear}-${currentMonth}-04`, amount: 35000.00, type: "DEBIT", narration: "NEFT/DR/RentTransfer/HDFC", category: "Bills & Utilities" },
      { id: "TXN-ANA-210", date: `${currentYear}-${currentMonth}-01`, amount: 150000.00, type: "CREDIT", narration: "NEFT/CR/HDFC-SALARY-BOOST", category: "Salary" }
    ];
  } else if (email.includes('kabir')) {
    // Kabir Mehta - Small Business Owner
    mockTransactions = [
      { id: "TXN-KAB-301", date: `${currentYear}-${currentMonth}-20`, amount: 4200.00, type: "DEBIT", narration: "POS/DR/LunchClientMeeting", category: "Food & Dining" },
      { id: "TXN-KAB-302", date: `${currentYear}-${currentMonth}-19`, amount: 12000.00, type: "DEBIT", narration: "UPI/DR/AmazonBusiness/Office", category: "Shopping" },
      { id: "TXN-KAB-303", date: `${currentYear}-${currentMonth}-17`, amount: 5400.00, type: "DEBIT", narration: "NEFT/DR/BlueDartLogistics/Fees", category: "Transport" },
      { id: "TXN-KAB-304", date: `${currentYear}-${currentMonth}-15`, amount: 120000.00, type: "CREDIT", narration: "UPI/CR/Invoice-108/Ramesh", category: "Salary" },
      { id: "TXN-KAB-305", date: `${currentYear}-${currentMonth}-12`, amount: 8500.00, type: "DEBIT", narration: "UPI/DR/PowerBroadband/Business", category: "Bills & Utilities" },
      { id: "TXN-KAB-306", date: `${currentYear}-${currentMonth}-10`, amount: 85000.00, type: "CREDIT", narration: "NEFT/CR/DirectInvoice-99", category: "Salary" },
      { id: "TXN-KAB-307", date: `${currentYear}-${currentMonth}-08`, amount: 3500.00, type: "DEBIT", narration: "UPI/DR/OlaOutstation/Travel", category: "Transport" },
      { id: "TXN-KAB-308", date: `${currentYear}-${currentMonth}-05`, amount: 4000.00, type: "DEBIT", narration: "UPI/DR/PetrolFuel/HPCL", category: "Transport" },
      { id: "TXN-KAB-309", date: `${currentYear}-${currentMonth}-04`, amount: 150.00, type: "DEBIT", narration: "UPI/DR/TeaSnacksCatering", category: "Food & Dining" },
      { id: "TXN-KAB-310", date: `${currentYear}-${currentMonth}-01`, amount: 40000.00, type: "DEBIT", narration: "NEFT/DR/OfficeRent/Transfer", category: "Bills & Utilities" }
    ];
  } else if (email.includes('diya')) {
    // Diya Sen - Freelancer
    mockTransactions = [
      { id: "TXN-DIY-401", date: `${currentYear}-${currentMonth}-21`, amount: 380.00, type: "DEBIT", narration: "UPI/DR/BlueTokai/Coffee", category: "Food & Dining" },
      { id: "TXN-DIY-402", date: `${currentYear}-${currentMonth}-20`, amount: 45000.00, type: "CREDIT", narration: "NEFT/CR/WebsiteDesignPayout", category: "Freelance" },
      { id: "TXN-DIY-403", date: `${currentYear}-${currentMonth}-19`, amount: 12500.00, type: "DEBIT", narration: "UPI/DR/WeWorkCoworking/Mumbai", category: "Bills & Utilities" },
      { id: "TXN-DIY-404", date: `${currentYear}-${currentMonth}-17`, amount: 4200.00, type: "DEBIT", narration: "UPI/DR/AdobeCreativeSuite", category: "Shopping" },
      { id: "TXN-DIY-405", date: `${currentYear}-${currentMonth}-15`, amount: 680.00, type: "DEBIT", narration: "UPI/DR/UberCab/Travel", category: "Transport" },
      { id: "TXN-DIY-406", date: `${currentYear}-${currentMonth}-12`, amount: 620.00, type: "DEBIT", narration: "UPI/DR/ZomatoFood/Order", category: "Food & Dining" },
      { id: "TXN-DIY-407", date: `${currentYear}-${currentMonth}-10`, amount: 2500.00, type: "DEBIT", narration: "UPI/DR/BookMyShow/Concert", category: "Entertainment" },
      { id: "TXN-DIY-408", date: `${currentYear}-${currentMonth}-08`, amount: 3400.00, type: "DEBIT", narration: "UPI/DR/AmazonIn/DrawingPad", category: "Shopping" },
      { id: "TXN-DIY-409", date: `${currentYear}-${currentMonth}-05`, amount: 30000.00, type: "CREDIT", narration: "UPI/CR/LogoDesignDiya/Client", category: "Freelance" },
      { id: "TXN-DIY-410", date: `${currentYear}-${currentMonth}-03`, amount: 719.00, type: "DEBIT", narration: "UPI/DR/AirtelPrepaid/Recharge", category: "Bills & Utilities" }
    ];
  } else {
    // Default Fallback - generate randomized transactions
    mockTransactions = generateRandomTransactions(email);
  }

  // Save via dynamic user database interface
  const { updatedTxs } = await saveTransactions(mockTransactions, email);
  return updatedTxs;
}
