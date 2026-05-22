import fs from 'fs';
import path from 'path';

const DB_FILE_PATH = path.resolve('./transactions.json');

/**
 * SIMULATES THE REAL SETU AA FETCH DATA PIPELINE
 * Generates highly realistic local Indian banking data instantly.
 */
export function generateMockBankData() {
  const currentYear = new Date().getFullYear();
  
  // Realistically structured array mirroring a live Indian Account Aggregator response
  const mockIndianTransactions = [
    { id: "TXN1001", date: `${currentYear}-05-20`, amount: 149.00, type: "DEBIT", narration: "UPI/DR/Zomato/RZPY/Axis" },
    { id: "TXN1002", date: `${currentYear}-05-19`, amount: 45.00, type: "DEBIT", narration: "UPI/DR/TapriChai/Paytm" },
    { id: "TXN1003", date: `${currentYear}-05-18`, amount: 72000.00, type: "CREDIT", narration: "NEFT/CR/HDFC-SALARY-BOOST" },
    { id: "TXN1004", date: `${currentYear}-05-18`, amount: 1200.00, type: "DEBIT", narration: "UPI/DR/Amazon-In/Shopping" },
    { id: "TXN1005", date: `${currentYear}-05-16`, amount: 350.00, type: "DEBIT", narration: "UPI/DR/Swiggy/Instamart" },
    { id: "TXN1006", date: `${currentYear}-05-15`, amount: 500.00, type: "DEBIT", narration: "ATM/WDL/ICICI-Mumbai" },
    { id: "TXN1007", date: `${currentYear}-05-12`, amount: 2499.00, type: "DEBIT", narration: "UPI/DR/Jio-Fiber/AutoPay" },
    { id: "TXN1008", date: `${currentYear}-05-10`, amount: 150.00, type: "CREDIT", narration: "UPI/CR/Friend-Split/GPay" },
    { id: "TXN1009", date: `${currentYear}-05-09`, amount: 450.00, type: "DEBIT", narration: "UPI/DR/OlaCabs/Transport" },
    { id: "TXN1010", date: `${currentYear}-05-05`, amount: 850.00, type: "DEBIT", narration: "UPI/DR/BookMyShow/Movies" }
  ];

  // Auto-categorization rules mimicking advanced AI parsing
  const parsedTransactions = mockIndianTransactions.map(tx => {
    let category = "Others";
    const desc = tx.narration.toLowerCase();
    
    if (desc.includes("zomato") || desc.includes("swiggy") || desc.includes("chai")) category = "Food & Dining";
    else if (desc.includes("salary")) category = "Income";
    else if (desc.includes("amazon")) category = "Shopping";
    else if (desc.includes("jio")) category = "Bills & Utilities";
    else if (desc.includes("ola") || desc.includes("cabs")) category = "Transport";
    else if (desc.includes("bookmyshow")) category = "Entertainment";

    return { ...tx, category };
  });

  // Write directly into your local database file
  fs.writeFileSync(DB_FILE_PATH, JSON.stringify(parsedTransactions, null, 2));
  return parsedTransactions;
}
