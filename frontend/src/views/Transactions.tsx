import React, { useState } from 'react';
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  FileSpreadsheet, 
  MessageSquare,
  Trash2,
  CheckCircle,
  AlertCircle,
  Download,
  FileText
} from 'lucide-react';
import type { Transaction } from '../types';

interface TransactionsProps {
  transactions: Transaction[];
  onAddTransaction: (txn: Omit<Transaction, 'id'>) => Promise<boolean>;
  onDeleteTransaction?: (id: string) => Promise<void>;
  onBulkAddTransactions: (txns: Omit<Transaction, 'id'>[]) => Promise<void>;
}

export const Transactions: React.FC<TransactionsProps> = ({ 
  transactions, 
  onAddTransaction,
  onDeleteTransaction,
  onBulkAddTransactions
}) => {
  // Input Tabs: manual | sms | csv
  const [activeInputTab, setActiveInputTab] = useState<'manual' | 'sms' | 'csv'>('manual');

  // Manual form states
  const [narration, setNarration] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('Others');
  const [type, setType] = useState<'DEBIT' | 'CREDIT'>('DEBIT');
  const [formStatus, setFormStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // SMS paste state
  const [smsText, setSmsText] = useState('');
  const [smsParseError, setSmsParseError] = useState<string | null>(null);

  // CSV parsing state
  const [csvStatus, setCsvStatus] = useState<string | null>(null);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedType, setSelectedType] = useState<'ALL' | 'DEBIT' | 'CREDIT'>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortField, setSortField] = useState<'date' | 'amount' | 'narration'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Export to CSV
  const exportToCSV = () => {
    if (sortedTxs.length === 0) {
      alert("No transactions to export.");
      return;
    }
    const headers = ["Date", "Narration", "Category", "Type", "Amount (INR)"];
    const rows = sortedTxs.map(tx => [
      tx.date,
      `"${tx.narration.replace(/"/g, '""')}"`,
      tx.category,
      tx.type,
      tx.amount.toFixed(2)
    ]);
    
    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Aether_Ledger_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to PDF using standard browser printing api
  const exportToPDF = () => {
    if (sortedTxs.length === 0) {
      alert("No transactions to export.");
      return;
    }
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Please allow popups to export PDF.");
      return;
    }
    
    const tableRowsHtml = sortedTxs.map(tx => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 10px; font-family: monospace;">${tx.date}</td>
        <td style="padding: 10px; font-weight: bold;">${tx.narration}</td>
        <td style="padding: 10px;"><span style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-size: 11px;">${tx.category}</span></td>
        <td style="padding: 10px; color: ${tx.type === 'CREDIT' ? '#10b981' : '#f43f5e'}; font-weight: bold;">${tx.type}</td>
        <td style="padding: 10px; text-align: right; font-weight: bold;">₹${tx.amount.toFixed(2)}</td>
      </tr>
    `).join('');

    const totalDebit = sortedTxs.filter(t => t.type === 'DEBIT').reduce((sum, t) => sum + t.amount, 0);
    const totalCredit = sortedTxs.filter(t => t.type === 'CREDIT').reduce((sum, t) => sum + t.amount, 0);

    printWindow.document.write(`
      <html>
      <head>
        <title>Aether Expense Ledger Report</title>
        <style>
          body { font-family: 'Segoe UI', system-ui, sans-serif; color: #1e293b; margin: 40px; }
          .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; border-bottom: 2px solid #0f172a; padding-bottom: 15px; }
          h1 { margin: 0; font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em; }
          .summary { display: flex; gap: 20px; margin-bottom: 25px; background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; }
          .metric { flex: 1; }
          .metric-label { font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 700; letter-spacing: 0.05em; }
          .metric-value { font-size: 20px; font-weight: 800; margin-top: 5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
          th { background: #f1f5f9; padding: 12px 10px; text-align: left; border-bottom: 2px solid #cbd5e1; color: #475569; font-weight: 700; }
          td { border-bottom: 1px solid #e2e8f0; }
          .footer { margin-top: 40px; font-size: 10px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 15px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>AETHER LEDGER</h1>
            <p style="font-size: 12px; color: #64748b; margin: 5px 0 0 0;">Automated account aggregation summary</p>
          </div>
          <div style="text-align: right;">
            <p style="font-size: 11px; font-weight: 700; margin: 0; color: #334155;">Filter Range: ${startDate || 'All Time'} to ${endDate || 'Present'}</p>
            <p style="font-size: 10px; color: #94a3b8; margin: 4px 0 0 0;">Generated on: ${new Date().toLocaleString('en-IN')}</p>
          </div>
        </div>
        
        <div class="summary">
          <div class="metric">
            <div class="metric-label">Total Inflow (Income)</div>
            <div class="metric-value" style="color: #10b981;">₹${totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          </div>
          <div class="metric">
            <div class="metric-label">Total Outflow (Expenses)</div>
            <div class="metric-value" style="color: #f43f5e;">₹${totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          </div>
          <div class="metric">
            <div class="metric-label">Net Balance</div>
            <div class="metric-value" style="color: ${totalCredit - totalDebit >= 0 ? '#0f172a' : '#f43f5e'}">₹${(totalCredit - totalDebit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Narration / Store</th>
              <th>Category</th>
              <th>Type</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>
        
        <div class="footer">
          Aether Personal Finance platform • Setu Account Aggregator integration verified
        </div>

        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const categories = [
    'Food & Dining', 'Shopping', 'Bills & Utilities', 
    'Transport', 'Entertainment', 'Income', 'Others'
  ];

  // SMS Parser logic tailored for Indian alerts
  const parseSMS = () => {
    setSmsParseError(null);
    if (!smsText.trim()) {
      setSmsParseError("Please paste an SMS alert text first.");
      return;
    }

    try {
      const text = smsText.trim();
      
      // Extract amount: e.g. Rs 150.00, Rs. 72,000, INR 350
      const amtMatch = text.match(/(?:Rs\.?|INR)\s*([\d,]+(?:\.\d+)?)/i);
      let extractedAmount = '';
      if (amtMatch) {
        extractedAmount = amtMatch[1].replace(/,/g, '');
      }

      // Extract transaction type: spent, debited, paid, withdrawn -> DEBIT; credited, deposited -> CREDIT
      let extractedType: 'DEBIT' | 'CREDIT' = 'DEBIT';
      if (/credit|received|deposited/i.test(text)) {
        extractedType = 'CREDIT';
      }

      // Extract Date: e.g. 20-05-26, 2026-05-20, 22/05/2026
      const dateMatch = text.match(/(\d{2,4})[-/](\d{2})[-/](\d{2,4})/);
      let extractedDate = new Date().toISOString().split('T')[0];
      if (dateMatch) {
        // Try parsing different formats
        const p1 = dateMatch[1];
        const p2 = dateMatch[2];
        const p3 = dateMatch[3];
        if (p1.length === 4) {
          extractedDate = `${p1}-${p2}-${p3}`;
        } else if (p3.length === 4) {
          extractedDate = `${p3}-${p2}-${p1}`;
        } else {
          // YY-MM-DD
          extractedDate = `20${p1}-${p2}-${p3}`;
        }
      }

      // Extract Merchant/Narration: e.g. to Swiggy, at Amazon, info: HDFC
      const merchantMatch = text.match(/(?:to|info:|at|at\s+|towards)\s+([^.\n]+)/i);
      let extractedNarration = 'SMS Transaction';
      if (merchantMatch) {
        extractedNarration = merchantMatch[1].trim();
      }

      // Populate Manual Form
      setNarration(extractedNarration);
      setAmount(extractedAmount);
      setDate(extractedDate);
      setType(extractedType);
      
      // Auto-category trigger
      let autoCat = 'Others';
      if (extractedType === 'CREDIT') {
        autoCat = 'Income';
      } else {
        const desc = extractedNarration.toLowerCase();
        if (desc.includes("zomato") || desc.includes("swiggy") || desc.includes("chai") || desc.includes("food")) autoCat = "Food & Dining";
        else if (desc.includes("amazon") || desc.includes("flipkart") || desc.includes("shopping")) autoCat = "Shopping";
        else if (desc.includes("jio") || desc.includes("recharge") || desc.includes("electricity") || desc.includes("bill")) autoCat = "Bills & Utilities";
        else if (desc.includes("ola") || desc.includes("uber") || desc.includes("cabs") || desc.includes("petrol")) autoCat = "Transport";
        else if (desc.includes("bookmyshow") || desc.includes("movies") || desc.includes("netflix") || desc.includes("spotify")) autoCat = "Entertainment";
      }
      setCategory(autoCat);

      // Return to manual tab for review
      setActiveInputTab('manual');
      setFormStatus({ type: 'success', message: "SMS parsed successfully! Review the values below." });
      setSmsText('');
    } catch (err) {
      console.error(err);
      setSmsParseError("Failed to parse SMS pattern automatically. Please input manually.");
    }
  };

  // CSV Parsing logic
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCsvStatus(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n');
        if (lines.length < 2) {
          setCsvStatus("Empty CSV or incorrect format.");
          return;
        }

        const parsedTransactionsList: Omit<Transaction, 'id'>[] = [];
        const headers = lines[0].toLowerCase().split(',');
        
        // Find indices
        const dateIdx = headers.findIndex(h => h.includes('date') || h.includes('time'));
        const narrationIdx = headers.findIndex(h => h.includes('narration') || h.includes('description') || h.includes('merchant'));
        const amountIdx = headers.findIndex(h => h.includes('amount') || h.includes('rupees') || h.includes('value'));
        const typeIdx = headers.findIndex(h => h.includes('type') || h.includes('dr/cr'));
        const catIdx = headers.findIndex(h => h.includes('category'));

        if (dateIdx === -1 || amountIdx === -1 || narrationIdx === -1) {
          setCsvStatus("CSV must have columns headers: 'Date', 'Amount', and 'Narration'.");
          return;
        }

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const cols = line.split(',');
          if (cols.length < 3) continue;

          const dateVal = cols[dateIdx]?.trim();
          const amtVal = parseFloat(cols[amountIdx]?.trim().replace(/"/g, '')) || 0;
          const narrVal = cols[narrationIdx]?.trim().replace(/"/g, '') || 'CSV Import';
          
          let typeVal: 'DEBIT' | 'CREDIT' = 'DEBIT';
          if (typeIdx !== -1) {
            const rawType = cols[typeIdx]?.trim().toUpperCase();
            if (rawType.includes('CREDIT') || rawType.includes('CR') || rawType === 'INFLOW') {
              typeVal = 'CREDIT';
            }
          } else if (amtVal > 50000 && narrVal.toLowerCase().includes('salary')) {
            // Smart auto-credit
            typeVal = 'CREDIT';
          }

          let catVal = catIdx !== -1 ? cols[catIdx]?.trim() : 'Others';
          if (catVal === 'Others' || !catVal) {
            if (typeVal === 'CREDIT') {
              catVal = 'Income';
            } else {
              const desc = narrVal.toLowerCase();
              if (desc.includes("zomato") || desc.includes("swiggy") || desc.includes("chai")) catVal = "Food & Dining";
              else if (desc.includes("amazon") || desc.includes("shopping")) catVal = "Shopping";
              else if (desc.includes("jio") || desc.includes("recharge")) catVal = "Bills & Utilities";
              else if (desc.includes("ola") || desc.includes("uber") || desc.includes("cab")) catVal = "Transport";
              else if (desc.includes("bookmyshow")) catVal = "Entertainment";
            }
          }

          parsedTransactionsList.push({
            date: dateVal || new Date().toISOString().split('T')[0],
            amount: Math.abs(amtVal),
            type: typeVal,
            narration: narrVal,
            category: catVal
          });
        }

        if (parsedTransactionsList.length === 0) {
          setCsvStatus("No valid transaction rows found in the CSV.");
          return;
        }

        await onBulkAddTransactions(parsedTransactionsList);
        setCsvStatus(`Successfully imported ${parsedTransactionsList.length} transactions!`);
      } catch (err) {
        console.error(err);
        setCsvStatus("Failed parsing CSV file. Verify the formatting.");
      }
    };
    reader.readAsText(file);
  };

  // Form Submit
  const handleAddManual = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus(null);

    if (!narration.trim() || !amount.trim() || !date || !category) {
      setFormStatus({ type: 'error', message: 'All inputs are required.' });
      return;
    }

    const amtFloat = parseFloat(amount);
    if (isNaN(amtFloat) || amtFloat <= 0) {
      setFormStatus({ type: 'error', message: 'Amount must be a positive number.' });
      return;
    }

    const success = await onAddTransaction({
      narration: narration.trim(),
      amount: amtFloat,
      date,
      category,
      type
    });

    if (success) {
      setFormStatus({ type: 'success', message: 'Transaction saved to ledger!' });
      setNarration('');
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setCategory('Others');
      setType('DEBIT');
    } else {
      setFormStatus({ type: 'error', message: 'Database failed to save transaction.' });
    }
  };

  // Filter & Search computation
  const filteredTxs = transactions.filter(tx => {
    const matchesSearch = tx.narration.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          tx.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || tx.category === selectedCategory;
    const matchesType = selectedType === 'ALL' || tx.type === selectedType;
    const matchesStartDate = !startDate || tx.date >= startDate;
    const matchesEndDate = !endDate || tx.date <= endDate;
    return matchesSearch && matchesCategory && matchesType && matchesStartDate && matchesEndDate;
  });

  // Sort computation
  const sortedTxs = [...filteredTxs].sort((a, b) => {
    let aVal: any = a[sortField];
    let bVal: any = b[sortField];
    
    if (sortField === 'date') {
      aVal = new Date(aVal).getTime();
      bVal = new Date(bVal).getTime();
    }

    if (sortField === 'amount') {
      aVal = Number(aVal);
      bVal = Number(bVal);
    }

    if (sortOrder === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  // Pagination calculation
  const totalPages = Math.ceil(sortedTxs.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedTxs.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleSort = (field: 'date' | 'amount' | 'narration') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
      
      {/* Input Options Column */}
      <div className="lg:col-span-1 space-y-6">
        <div className="glass-panel p-5">
          <div className="flex border-b border-slate-800 pb-3 mb-4">
            <button
              onClick={() => { setActiveInputTab('manual'); setFormStatus(null); }}
              className={`flex-1 text-center pb-2 text-xs font-bold transition-colors ${
                activeInputTab === 'manual' ? 'text-primary border-b-2 border-primary' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Add Manually
            </button>
            <button
              onClick={() => { setActiveInputTab('sms'); setFormStatus(null); }}
              className={`flex-1 text-center pb-2 text-xs font-bold transition-colors ${
                activeInputTab === 'sms' ? 'text-primary border-b-2 border-primary' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Paste SMS
            </button>
            <button
              onClick={() => { setActiveInputTab('csv'); setFormStatus(null); }}
              className={`flex-1 text-center pb-2 text-xs font-bold transition-colors ${
                activeInputTab === 'csv' ? 'text-primary border-b-2 border-primary' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Upload CSV
            </button>
          </div>

          {/* Manual Entry Form */}
          {activeInputTab === 'manual' && (
            <form onSubmit={handleAddManual} className="space-y-4">
              {formStatus && (
                <div className={`p-3 rounded-lg flex items-center gap-2 text-xs font-medium ${
                  formStatus.type === 'success' ? 'bg-success/15 text-success border border-success/20' : 'bg-danger/15 text-danger border border-danger/20'
                }`}>
                  {formStatus.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                  <span>{formStatus.message}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Narration / Store</label>
                <input
                  type="text"
                  placeholder="e.g. Swiggy order, Petrol pump"
                  value={narration}
                  onChange={(e) => setNarration(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-650 focus:outline-none focus:border-primary/80"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-650 focus:outline-none focus:border-primary/80"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as 'DEBIT' | 'CREDIT')}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-primary/80"
                  >
                    <option value="DEBIT">Debit (Expense)</option>
                    <option value="CREDIT">Credit (Income)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-primary/80"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-primary/80"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-primary hover:bg-primary-hover text-white text-xs font-bold py-3 px-4 rounded-xl active:scale-95 transition-transform duration-100 mt-2 flex items-center justify-center gap-1.5"
              >
                <Plus className="h-4 w-4" /> Add Transaction
              </button>
            </form>
          )}

          {/* SMS Paste Pad */}
          {activeInputTab === 'sms' && (
            <div className="space-y-4">
              {smsParseError && (
                <div className="p-3 bg-danger/15 text-danger border border-danger/20 rounded-lg flex items-center gap-2 text-xs font-medium">
                  <AlertCircle className="h-4 w-4" />
                  <span>{smsParseError}</span>
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Paste Bank SMS Alert</label>
                <textarea
                  rows={5}
                  placeholder="e.g. Debited Rs. 450.00 from A/C X7788 on 2026-05-19 to Swiggy. Ref: UPI."
                  value={smsText}
                  onChange={(e) => setSmsText(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-650 focus:outline-none focus:border-primary/80 resize-none"
                />
              </div>
              <button
                onClick={parseSMS}
                className="w-full bg-primary hover:bg-primary-hover text-white text-xs font-bold py-3 px-4 rounded-xl active:scale-95 transition-transform duration-100 flex items-center justify-center gap-1.5"
              >
                <MessageSquare className="h-4 w-4" /> Parse & Fill Form
              </button>
            </div>
          )}

          {/* CSV File Uploader */}
          {activeInputTab === 'csv' && (
            <div className="space-y-4">
              {csvStatus && (
                <div className={`p-3 rounded-lg flex items-center gap-2 text-xs font-medium ${
                  csvStatus.includes('Success') ? 'bg-success/15 text-success border border-success/20' : 'bg-danger/15 text-danger border border-danger/20'
                }`}>
                  {csvStatus.includes('Success') ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                  <span>{csvStatus}</span>
                </div>
              )}

              <div className="space-y-1.5 border border-dashed border-slate-800 rounded-xl p-5 text-center hover:border-primary/50 transition-colors">
                <FileSpreadsheet className="h-8 w-8 text-slate-500 mx-auto mb-2" />
                <label className="block text-xs font-semibold text-slate-350 cursor-pointer">
                  <span>Click to select CSV Statement</span>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleCSVUpload}
                    className="hidden"
                  />
                </label>
                <p className="text-[10px] text-slate-550 mt-1">Requires headers: Date, Amount, Narration</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Transactions Data Table Column */}
      <div className="lg:col-span-2 space-y-4">
        {/* Ledger Header Filter controls */}
        <div className="glass-panel p-5 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <h3 className="font-display font-bold text-base text-white">Transaction Ledger</h3>
            <div className="flex flex-wrap items-center gap-2">
              {/* Type Filter */}
              <select
                value={selectedType}
                onChange={(e) => { setSelectedType(e.target.value as any); setCurrentPage(1); }}
                className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-primary/40"
              >
                <option value="ALL">All Types</option>
                <option value="DEBIT">Debits Only</option>
                <option value="CREDIT">Credits Only</option>
              </select>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
                className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-primary/40"
              >
                <option value="ALL">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center gap-3">
            {/* Search Box */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search by narration or category..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary/80"
              />
            </div>
          </div>

          {/* Date Picker Range and Export Action Buttons */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-t border-slate-800/60 pt-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">From</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-primary/40"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">To</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-primary/40"
                />
              </div>
              {(startDate || endDate) && (
                <button
                  onClick={() => { setStartDate(''); setEndDate(''); setCurrentPage(1); }}
                  className="text-primary hover:text-primary-hover text-[11px] font-bold px-2 py-1 rounded transition-colors"
                >
                  Reset
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={exportToCSV}
                className="bg-slate-800 hover:bg-slate-750 border border-slate-750 text-slate-300 hover:text-white text-xs font-semibold py-2 px-3.5 rounded-xl flex items-center gap-1.5 transition-all duration-150 active:scale-95"
              >
                <Download className="h-3.5 w-3.5 text-slate-400" /> Export CSV
              </button>
              <button
                onClick={exportToPDF}
                className="bg-slate-800 hover:bg-slate-750 border border-slate-750 text-slate-300 hover:text-white text-xs font-semibold py-2 px-3.5 rounded-xl flex items-center gap-1.5 transition-all duration-150 active:scale-95"
              >
                <FileText className="h-3.5 w-3.5 text-slate-400" /> Export PDF
              </button>
            </div>
          </div>
        </div>

        {/* Ledger Data List */}
        <div className="glass-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-800 bg-[#0e1322]/40 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  <th 
                    onClick={() => handleSort('date')}
                    className="p-4 cursor-pointer hover:text-slate-300 select-none"
                  >
                    Timestamp {sortField === 'date' && (sortOrder === 'asc' ? '▲' : '▼')}
                  </th>
                  <th 
                    onClick={() => handleSort('narration')}
                    className="p-4 cursor-pointer hover:text-slate-300 select-none"
                  >
                    Narration {sortField === 'narration' && (sortOrder === 'asc' ? '▲' : '▼')}
                  </th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Type</th>
                  <th 
                    onClick={() => handleSort('amount')}
                    className="p-4 text-right cursor-pointer hover:text-slate-300 select-none"
                  >
                    Amount {sortField === 'amount' && (sortOrder === 'asc' ? '▲' : '▼')}
                  </th>
                  {onDeleteTransaction && <th className="p-4 text-center">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 text-xs text-slate-300">
                {currentItems.length === 0 ? (
                  <tr>
                    <td colSpan={onDeleteTransaction ? 6 : 5} className="p-8 text-center text-slate-550 font-medium">
                      No matching records found.
                    </td>
                  </tr>
                ) : (
                  currentItems.map((tx) => {
                    const isCredit = tx.type === 'CREDIT';
                    return (
                      <tr key={tx.id} className="hover:bg-slate-800/10 transition-colors">
                        <td className="p-4 whitespace-nowrap font-medium text-slate-450">{tx.date}</td>
                        <td className="p-4 font-semibold text-white truncate max-w-[150px]">{tx.narration}</td>
                        <td className="p-4 whitespace-nowrap">
                          <span className="bg-slate-800 border border-slate-750 px-2 py-0.5 rounded-full text-[10px] font-bold">
                            {tx.category}
                          </span>
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <span className={`text-[10px] font-extrabold uppercase ${
                            isCredit ? 'text-success' : 'text-danger'
                          }`}>
                            {tx.type}
                          </span>
                        </td>
                        <td className={`p-4 text-right whitespace-nowrap font-bold ${
                          isCredit ? 'text-success' : 'text-white'
                        }`}>
                          {isCredit ? '+' : ''}₹{tx.amount.toFixed(2)}
                        </td>
                        {onDeleteTransaction && (
                          <td className="p-4 text-center whitespace-nowrap">
                            <button
                              onClick={() => onDeleteTransaction(tx.id)}
                              className="text-slate-500 hover:text-danger p-1 rounded-lg hover:bg-danger-soft transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="px-4 py-3 bg-[#0e1322]/20 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                Page {currentPage} of {totalPages} ({sortedTxs.length} items)
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="bg-slate-900 hover:bg-slate-800 text-slate-400 p-1.5 rounded-lg disabled:opacity-30 disabled:hover:bg-slate-900 border border-slate-800"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="bg-slate-900 hover:bg-slate-800 text-slate-400 p-1.5 rounded-lg disabled:opacity-30 disabled:hover:bg-slate-900 border border-slate-800"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
