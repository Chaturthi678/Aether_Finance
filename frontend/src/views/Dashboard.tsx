import React, { useState } from 'react';
import axios from 'axios';
import { 
  Wallet, 
  RefreshCw, 
  ArrowUpRight, 
  ArrowDownLeft,
  Calendar
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend 
} from 'recharts';
import type { Transaction } from '../types';

interface DashboardProps {
  transactions: Transaction[];
  onSync: () => void;
  syncing: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  transactions, 
  onSync, 
  syncing 
}) => {
  const [mobileNumber, setMobileNumber] = useState('');
  const [consentLoading, setConsentLoading] = useState(false);
  const [forceLink, setForceLink] = useState(false);

  const handleInitiateConsent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{10}$/.test(mobileNumber)) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }
    setConsentLoading(true);
    try {
      const response = await axios.post('/api/setu/consent', {
        mobileNumber,
        redirectUrl: window.location.origin
      });
      if (response.data.success && response.data.url) {
        window.location.href = response.data.url;
      } else {
        alert("Failed to create consent request. Try again.");
      }
    } catch (error: any) {
      console.error("Failed to initiate consent:", error);
      alert(`Error initiating consent: ${error.response?.data?.error || error.message}`);
    } finally {
      setConsentLoading(false);
    }
  };

  // Compute key indicators
  const debits = transactions.filter(t => t.type === 'DEBIT');
  const credits = transactions.filter(t => t.type === 'CREDIT');

  const totalInflow = credits.reduce((sum, t) => sum + t.amount, 0);
  const totalOutflow = debits.reduce((sum, t) => sum + t.amount, 0);
  const netSavings = totalInflow - totalOutflow;
  const savingsRate = totalInflow > 0 ? (netSavings / totalInflow) * 100 : 0;

  // Process data for Recharts (Group transactions by month)
  const getMonthlyChartData = () => {
    const monthlyGroups: { [key: string]: { income: number; expense: number } } = {};
    
    // Sort transactions chronologically for chronological grouping
    const sortedTxs = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    sortedTxs.forEach(t => {
      // Parse date to month label e.g., "May 26"
      try {
        const d = new Date(t.date);
        const monthLabel = d.toLocaleString('en-US', { month: 'short', year: '2-digit' });
        
        if (!monthlyGroups[monthLabel]) {
          monthlyGroups[monthLabel] = { income: 0, expense: 0 };
        }

        if (t.type === 'CREDIT') {
          monthlyGroups[monthLabel].income += t.amount;
        } else {
          monthlyGroups[monthLabel].expense += t.amount;
        }
      } catch (err) {
        console.error("Failed to parse date for chart:", t.date);
      }
    });

    const data = Object.entries(monthlyGroups).map(([month, val]) => ({
      month,
      Income: Math.round(val.income),
      Expense: Math.round(val.expense),
      Savings: Math.round(val.income - val.expense)
    }));

    // If empty, supply default months for demo aesthetics
    if (data.length === 0) {
      const currentYear = new Date().getFullYear();
      return [
        { month: `Mar ${currentYear - 2000}`, Income: 0, Expense: 0, Savings: 0 },
        { month: `Apr ${currentYear - 2000}`, Income: 0, Expense: 0, Savings: 0 },
        { month: `May ${currentYear - 2000}`, Income: 0, Expense: 0, Savings: 0 }
      ];
    }

    return data;
  };

  const chartData = getMonthlyChartData();

  // Get recent 5 transactions
  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="space-y-6 font-sans">
      {/* Top Welcome Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-2xl text-white tracking-tight">Financial Dashboard</h2>
          <p className="text-slate-400 text-sm mt-0.5">Welcome back. Here is your Indian banking sync summary.</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-[#151b2c] border border-slate-800 rounded-xl px-4 py-2 flex items-center gap-2 text-xs font-semibold text-slate-300">
            <Calendar className="h-4 w-4 text-primary" />
            <span>Today: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
        </div>
      </div>

      {/* Setu Banking Aggregation Link Banner */}
      {transactions.length === 0 || forceLink ? (
        <div className="glass-panel p-6 border-primary/20 bg-gradient-to-r from-primary/10 via-transparent to-transparent">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary font-bold">
                Setu Account Aggregator
              </div>
              <h4 className="font-display font-extrabold text-lg text-white">Link Sandbox Bank Accounts</h4>
              <p className="text-xs text-slate-400 max-w-xl">
                Experience real consent-based banking data flows using Setu's Sandbox AA portal.
                Enter your mobile number to trigger an official sandbox consent request.
              </p>
            </div>
            <form onSubmit={handleInitiateConsent} className="flex items-center gap-2 w-full md:w-auto">
              <input
                type="tel"
                placeholder="Enter Mobile Number"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                maxLength={10}
                required
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary/85 w-full md:w-44"
              />
              <button
                type="submit"
                disabled={consentLoading}
                className="bg-primary hover:bg-primary-hover text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-all duration-150 active:scale-95 whitespace-nowrap disabled:opacity-50"
              >
                {consentLoading ? 'Connecting...' : 'Connect Bank'}
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="glass-panel p-6 border-success/20 bg-gradient-to-r from-success/5 via-transparent to-transparent flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-success/15 border border-success/20 flex items-center justify-center text-success text-lg font-bold">
              ✓
            </div>
            <div>
              <h4 className="font-display font-bold text-sm text-white">Setu Sandbox Banking Aggregation Connected</h4>
              <p className="text-xs text-slate-400 mt-0.5">Your financial dashboard is synchronized with real sandbox ledger files.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onSync}
              disabled={syncing}
              className="bg-slate-800 hover:bg-slate-750 border border-slate-750 text-slate-350 hover:text-white text-xs font-semibold py-2 px-4 rounded-xl flex items-center gap-1.5 active:scale-95 transition-transform"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} /> Sync Account
            </button>
            <button
              onClick={() => setForceLink(true)}
              className="bg-slate-900/50 hover:bg-slate-900 border border-slate-800 text-slate-500 hover:text-slate-300 text-xs font-semibold py-2 px-4 rounded-xl active:scale-95 transition-transform"
            >
              Change Account
            </button>
          </div>
        </div>
      )}

      {/* Main Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Balance Card */}
        <div className="glass-panel glass-panel-hover p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 h-24 w-24 bg-primary/5 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-300"></div>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-500 font-semibold text-[11px] uppercase tracking-wider">Current Balance</p>
              <h3 className="text-2xl font-display font-extrabold text-white mt-1.5">
                ₹{netSavings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="bg-primary-soft p-3 rounded-xl border border-primary/20 text-primary">
              <Wallet className="h-5.5 w-5.5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              savingsRate >= 20 ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'
            }`}>
              {savingsRate.toFixed(1)}% savings rate
            </span>
            <span className="text-[10px] text-slate-500 font-medium">calculated this period</span>
          </div>
        </div>

        {/* Total Inflows */}
        <div className="glass-panel glass-panel-hover p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 h-24 w-24 bg-success/5 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-300"></div>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-500 font-semibold text-[11px] uppercase tracking-wider">Total Inflows (Credits)</p>
              <h3 className="text-2xl font-display font-extrabold text-success mt-1.5">
                ₹{totalInflow.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="bg-success-soft p-3 rounded-xl border border-success/20 text-success">
              <ArrowUpRight className="h-5.5 w-5.5" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-slate-500 text-xs font-medium gap-1">
            <span className="text-success font-semibold inline-flex items-center gap-0.5">
              {credits.length} credits
            </span>
            <span>recorded in total</span>
          </div>
        </div>

        {/* Total Outflows */}
        <div className="glass-panel glass-panel-hover p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 h-24 w-24 bg-danger/5 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-300"></div>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-500 font-semibold text-[11px] uppercase tracking-wider">Total Outflows (Debits)</p>
              <h3 className="text-2xl font-display font-extrabold text-danger mt-1.5">
                ₹{totalOutflow.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="bg-danger-soft p-3 rounded-xl border border-danger/20 text-danger">
              <ArrowDownLeft className="h-5.5 w-5.5" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-slate-500 text-xs font-medium gap-1">
            <span className="text-danger font-semibold inline-flex items-center gap-0.5">
              {debits.length} debits
            </span>
            <span>recorded in total</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart */}
        <div className="glass-panel p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="font-display font-bold text-sm text-white">Month-on-Month Cashflow</h4>
              <p className="text-xs text-slate-500">Visual trend comparing total inflows against outflows</p>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#242e47" vertical={false} />
                <XAxis 
                  dataKey="month" 
                  stroke="#64748b" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000) + 'k' : v}`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#151b2c', borderColor: '#242e47', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                  itemStyle={{ fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area 
                  type="monotone" 
                  dataKey="Income" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorIncome)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="Expense" 
                  stroke="#f43f5e" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorExpense)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Ledger Panel */}
        <div className="glass-panel p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-display font-bold text-sm text-white">Recent Activity</h4>
              <p className="text-xs text-slate-500">Your latest synced transfers</p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 max-h-[280px]">
            {recentTransactions.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <p className="text-xs text-slate-500 mt-2">No transactions recorded.</p>
                <button
                  onClick={onSync}
                  disabled={syncing}
                  className="text-xs text-primary font-bold mt-2 hover:underline inline-flex items-center gap-1 disabled:opacity-50"
                >
                  <RefreshCw className={`h-3 w-3 ${syncing ? 'animate-spin' : ''}`} /> {syncing ? 'Syncing...' : 'Sync Bank Now'}
                </button>
              </div>
            ) : (
              recentTransactions.map((tx) => {
                const isCredit = tx.type === 'CREDIT';
                return (
                  <div key={tx.id} className="flex items-center justify-between p-3 bg-slate-900/30 rounded-xl border border-slate-800/40 hover:border-slate-800 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg border ${
                        isCredit 
                          ? 'bg-success-soft border-success/20 text-success' 
                          : 'bg-danger-soft border-danger/20 text-danger'
                      }`}>
                        {isCredit ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate max-w-[130px] md:max-w-[150px]">
                          {tx.narration}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5 font-medium">{tx.category} • {tx.date}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-extrabold ${isCredit ? 'text-success' : 'text-slate-200'}`}>
                      {isCredit ? '+' : '-'}₹{tx.amount.toFixed(2)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
