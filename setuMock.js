import { saveTransactions } from './db.js';

/**
 * SIMULATES THE REAL SETU AA FETCH DATA PIPELINE
 * Generates highly realistic local Indian banking data instantly for a specific user.
 */
export function generateMockBankData(userId) {
  const currentYear = new Date().getFullYear();
  const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
  
  let mockTransactions = [];

  const email = (userId || 'default').toLowerCase();

  if (email.includes('aarav')) {
    // Aarav Patel - College Student
    mockTransactions = [
      { id: "TXN-AAR-101", date: `${currentYear}-${currentMonth}-20`, amount: 320.00, type: "DEBIT", narration: "UPI/DR/Zomato/RZPY/Axis" },
      { id: "TXN-AAR-102", date: `${currentYear}-${currentMonth}-19`, amount: 40.00, type: "DEBIT", narration: "UPI/DR/TapriChai/Paytm" },
      { id: "TXN-AAR-103", date: `${currentYear}-${currentMonth}-18`, amount: 8000.00, type: "CREDIT", narration: "UPI/CR/ParentsAllowance/GPay" },
      { id: "TXN-AAR-104", date: `${currentYear}-${currentMonth}-17`, amount: 280.00, type: "DEBIT", narration: "UPI/DR/BookMyShow/Movies" },
      { id: "TXN-AAR-105", date: `${currentYear}-${currentMonth}-16`, amount: 199.00, type: "DEBIT", narration: "UPI/DR/NetflixSharing/Auto" },
      { id: "TXN-AAR-106", date: `${currentYear}-${currentMonth}-15`, amount: 90.00, type: "DEBIT", narration: "UPI/DR/OlaAuto/Transport" },
      { id: "TXN-AAR-107", date: `${currentYear}-${currentMonth}-14`, amount: 25.00, type: "DEBIT", narration: "UPI/DR/ChaiTapri/GPay" },
      { id: "TXN-AAR-108", date: `${currentYear}-${currentMonth}-12`, amount: 110.00, type: "CREDIT", narration: "UPI/CR/FriendSplit/Dinner" },
      { id: "TXN-AAR-109", date: `${currentYear}-${currentMonth}-10`, amount: 65.00, type: "DEBIT", narration: "UPI/DR/LocalBakery/Snacks" },
      { id: "TXN-AAR-110", date: `${currentYear}-${currentMonth}-05`, amount: 299.00, type: "DEBIT", narration: "UPI/DR/JioPrepaid/Recharge" }
    ];
  } else if (email.includes('ananya')) {
    // Ananya Sharma - Software Engineer
    mockTransactions = [
      { id: "TXN-ANA-201", date: `${currentYear}-${currentMonth}-20`, amount: 1200.00, type: "DEBIT", narration: "UPI/DR/SwiggyGourmet/Axis" },
      { id: "TXN-ANA-202", date: `${currentYear}-${currentMonth}-19`, amount: 18900.00, type: "DEBIT", narration: "UPI/DR/AmazonIn/AirPods" },
      { id: "TXN-ANA-203", date: `${currentYear}-${currentMonth}-18`, amount: 4500.00, type: "DEBIT", narration: "POS/DR/PremiumFineDining" },
      { id: "TXN-ANA-204", date: `${currentYear}-${currentMonth}-15`, amount: 25000.00, type: "DEBIT", narration: "NEFT/DR/HDFCMutualFund/SIP" },
      { id: "TXN-ANA-205", date: `${currentYear}-${currentMonth}-12`, amount: 2499.00, type: "DEBIT", narration: "UPI/DR/JioFiber/Broadband" },
      { id: "TXN-ANA-206", date: `${currentYear}-${currentMonth}-10`, amount: 850.00, type: "DEBIT", narration: "UPI/DR/UberPremier/Cab" },
      { id: "TXN-ANA-207", date: `${currentYear}-${currentMonth}-08`, amount: 649.00, type: "DEBIT", narration: "UPI/DR/NetflixPremium/Card" },
      { id: "TXN-ANA-208", date: `${currentYear}-${currentMonth}-05`, amount: 3200.00, type: "DEBIT", narration: "UPI/DR/BESCOMElectricity/Bill" },
      { id: "TXN-ANA-209", date: `${currentYear}-${currentMonth}-04`, amount: 35000.00, type: "DEBIT", narration: "NEFT/DR/RentTransfer/HDFC" },
      { id: "TXN-ANA-210", date: `${currentYear}-${currentMonth}-01`, amount: 150000.00, type: "CREDIT", narration: "NEFT/CR/HDFC-SALARY-BOOST" }
    ];
  } else if (email.includes('kabir')) {
    // Kabir Mehta - Small Business Owner
    mockTransactions = [
      { id: "TXN-KAB-301", date: `${currentYear}-${currentMonth}-20`, amount: 4200.00, type: "DEBIT", narration: "POS/DR/LunchClientMeeting" },
      { id: "TXN-KAB-302", date: `${currentYear}-${currentMonth}-19`, amount: 12000.00, type: "DEBIT", narration: "UPI/DR/AmazonBusiness/Office" },
      { id: "TXN-KAB-303", date: `${currentYear}-${currentMonth}-17`, amount: 5400.00, type: "DEBIT", narration: "NEFT/DR/BlueDartLogistics/Fees" },
      { id: "TXN-KAB-304", date: `${currentYear}-${currentMonth}-15`, amount: 120000.00, type: "CREDIT", narration: "UPI/CR/Invoice-108/Ramesh" },
      { id: "TXN-KAB-305", date: `${currentYear}-${currentMonth}-12`, amount: 8500.00, type: "DEBIT", narration: "UPI/DR/PowerBroadband/Business" },
      { id: "TXN-KAB-306", date: `${currentYear}-${currentMonth}-10`, amount: 85000.00, type: "CREDIT", narration: "NEFT/CR/DirectInvoice-99" },
      { id: "TXN-KAB-307", date: `${currentYear}-${currentMonth}-08`, amount: 3500.00, type: "DEBIT", narration: "UPI/DR/OlaOutstation/Travel" },
      { id: "TXN-KAB-308", date: `${currentYear}-${currentMonth}-05`, amount: 4000.00, type: "DEBIT", narration: "UPI/DR/PetrolFuel/HPCL" },
      { id: "TXN-KAB-309", date: `${currentYear}-${currentMonth}-04`, amount: 1500.00, type: "DEBIT", narration: "UPI/DR/TeaSnacksCatering" },
      { id: "TXN-KAB-310", date: `${currentYear}-${currentMonth}-01`, amount: 40000.00, type: "DEBIT", narration: "NEFT/DR/OfficeRent/Transfer" }
    ];
  } else if (email.includes('diya')) {
    // Diya Sen - Freelancer
    mockTransactions = [
      { id: "TXN-DIY-401", date: `${currentYear}-${currentMonth}-21`, amount: 380.00, type: "DEBIT", narration: "UPI/DR/BlueTokai/Coffee" },
      { id: "TXN-DIY-402", date: `${currentYear}-${currentMonth}-20`, amount: 45000.00, type: "CREDIT", narration: "NEFT/CR/WebsiteDesignPayout" },
      { id: "TXN-DIY-403", date: `${currentYear}-${currentMonth}-19`, amount: 12500.00, type: "DEBIT", narration: "UPI/DR/WeWorkCoworking/Mumbai" },
      { id: "TXN-DIY-404", date: `${currentYear}-${currentMonth}-17`, amount: 4200.00, type: "DEBIT", narration: "UPI/DR/AdobeCreativeSuite" },
      { id: "TXN-DIY-405", date: `${currentYear}-${currentMonth}-15`, amount: 680.00, type: "DEBIT", narration: "UPI/DR/UberCab/Travel" },
      { id: "TXN-DIY-406", date: `${currentYear}-${currentMonth}-12`, amount: 620.00, type: "DEBIT", narration: "UPI/DR/ZomatoFood/Order" },
      { id: "TXN-DIY-407", date: `${currentYear}-${currentMonth}-10`, amount: 2500.00, type: "DEBIT", narration: "UPI/DR/BookMyShow/Concert" },
      { id: "TXN-DIY-408", date: `${currentYear}-${currentMonth}-08`, amount: 3400.00, type: "DEBIT", narration: "UPI/DR/AmazonIn/DrawingPad" },
      { id: "TXN-DIY-409", date: `${currentYear}-${currentMonth}-05`, amount: 30000.00, type: "CREDIT", narration: "UPI/CR/LogoDesignDiya/Client" },
      { id: "TXN-DIY-410", date: `${currentYear}-${currentMonth}-03`, amount: 719.00, type: "DEBIT", narration: "UPI/DR/AirtelPrepaid/Recharge" }
    ];
  } else {
    // Default Fallback
    mockTransactions = [
      { id: "TXN1001", date: `${currentYear}-${currentMonth}-20`, amount: 149.00, type: "DEBIT", narration: "UPI/DR/Zomato/RZPY/Axis" },
      { id: "TXN1002", date: `${currentYear}-${currentMonth}-19`, amount: 45.00, type: "DEBIT", narration: "UPI/DR/TapriChai/Paytm" },
      { id: "TXN1003", date: `${currentYear}-${currentMonth}-18`, amount: 72000.00, type: "CREDIT", narration: "NEFT/CR/HDFC-SALARY-BOOST" },
      { id: "TXN1004", date: `${currentYear}-${currentMonth}-18`, amount: 1200.00, type: "DEBIT", narration: "UPI/DR/Amazon-In/Shopping" },
      { id: "TXN1005", date: `${currentYear}-${currentMonth}-16`, amount: 350.00, type: "DEBIT", narration: "UPI/DR/Swiggy/Instamart" },
      { id: "TXN1006", date: `${currentYear}-${currentMonth}-15`, amount: 500.00, type: "DEBIT", narration: "ATM/WDL/ICICI-Mumbai" },
      { id: "TXN1007", date: `${currentYear}-${currentMonth}-12`, amount: 2499.00, type: "DEBIT", narration: "UPI/DR/Jio-Fiber/AutoPay" },
      { id: "TXN1008", date: `${currentYear}-${currentMonth}-10`, amount: 150.00, type: "CREDIT", narration: "UPI/CR/Friend-Split/GPay" },
      { id: "TXN1009", date: `${currentYear}-${currentMonth}-09`, amount: 450.00, type: "DEBIT", narration: "UPI/DR/OlaCabs/Transport" },
      { id: "TXN1010", date: `${currentYear}-${currentMonth}-05`, amount: 850.00, type: "DEBIT", narration: "UPI/DR/BookMyShow/Movies" }
    ];
  }

  // Save via dynamic user database interface
  const { updatedTxs } = saveTransactions(mockTransactions, email);
  return updatedTxs;
}
