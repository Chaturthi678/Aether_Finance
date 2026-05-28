import React from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip 
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Percent, 
  ShoppingBag,
  Award
} from 'lucide-react';
import type { Transaction } from '../types';

interface AnalyticsProps {
  transactions: Transaction[];
}

export const Analytics: React.FC<AnalyticsProps> = ({ transactions }) => {
  const debits = transactions.filter(t => t.type === 'DEBIT');
  const totalDebit = debits.reduce((sum, t) => sum + t.amount, 0);

  const credits = transactions.filter(t => t.type === 'CREDIT');
  const totalCredit = credits.reduce((sum, t) => sum + t.amount, 0);

  const savingsRate = totalCredit > 0 ? ((totalCredit - totalDebit) / totalCredit) * 100 : 0;

  // Process Category totals
  const categoryTotals: { [key: string]: number } = {};
  debits.forEach(t => {
    const cat = t.category || 'Others';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + t.amount;
  });

  const chartColors: { [key: string]: string } = {
    'Food & Dining': '#10b981', // emerald
    'Shopping': '#3b82f6', // blue
    'Bills & Utilities': '#f59e0b', // amber
    'Transport': '#a855f7', // purple
    'Entertainment': '#f43f5e', // rose
    'Others': '#64748b', // slate
  };

  const chartData = Object.entries(categoryTotals).map(([name, value]) => ({
    name,
    value: Math.round(value),
    color: chartColors[name] || '#475569'
  })).sort((a, b) => b.value - a.value);

  // Group Merchant breakdown
  const merchantTotals: { [key: string]: { amount: number; count: number } } = {};
  debits.forEach(t => {
    // Simplify/clean narration if it is a UPI narration
    let name = t.narration || 'Unknown Merchant';
    
    // Clean UPI narration format: e.g. "UPI/DR/Zomato/RZPY/Axis" -> "Zomato"
    if (name.includes('UPI/DR/')) {
      const parts = name.split('/');
      if (parts.length >= 3) {
        name = parts[2];
      }
    } else if (name.includes('UPI/CR/')) {
      const parts = name.split('/');
      if (parts.length >= 3) {
        name = parts[2];
      }
    } else if (name.startsWith('NEFT/CR/')) {
      name = name.replace('NEFT/CR/', '');
    }

    if (!merchantTotals[name]) {
      merchantTotals[name] = { amount: 0, count: 0 };
    }
    merchantTotals[name].amount += t.amount;
    merchantTotals[name].count += 1;
  });

  const merchantLeaderboard = Object.entries(merchantTotals)
    .map(([name, stats]) => ({
      name,
      amount: stats.amount,
      count: stats.count,
      percent: totalDebit > 0 ? (stats.amount / totalDebit) * 100 : 0
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 6); // Top 6 merchants

  return (
    <div className="space-y-6 font-sans">
      
      <div>
        <h2 className="font-display font-bold text-2xl text-white tracking-tight">Spending Analytics</h2>
        <p className="text-slate-400 text-sm mt-0.5">Explore detailed merchant breakdowns and cash flow percentages.</p>
      </div>

      {/* Savings Metric cards row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="glass-panel p-5 flex items-center gap-4">
          <div className="bg-success-soft p-3 rounded-xl border border-success/20 text-success">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Net Cash In</span>
            <h4 className="text-lg font-display font-bold text-white mt-0.5">₹{totalCredit.toLocaleString('en-IN')}</h4>
          </div>
        </div>

        <div className="glass-panel p-5 flex items-center gap-4">
          <div className="bg-danger-soft p-3 rounded-xl border border-danger/20 text-danger">
            <TrendingDown className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Net Cash Out</span>
            <h4 className="text-lg font-display font-bold text-white mt-0.5">₹{totalDebit.toLocaleString('en-IN')}</h4>
          </div>
        </div>

        <div className="glass-panel p-5 flex items-center gap-4">
          <div className="bg-primary-soft p-3 rounded-xl border border-primary/20 text-primary">
            <Percent className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Savings Rate</span>
            <h4 className="text-lg font-display font-bold text-white mt-0.5">
              {savingsRate > 0 ? `${savingsRate.toFixed(1)}%` : '0.0%'}
            </h4>
          </div>
        </div>
      </div>

      {/* Category Donut & Leaderboard Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Category Pie Chart Card */}
        <div className="glass-panel p-6 lg:col-span-1 flex flex-col justify-between">
          <div>
            <h3 className="font-display font-bold text-sm text-white mb-1">Expenditures by Category</h3>
            <p className="text-xs text-slate-500 mb-6">Percentage breakdown of total expenses</p>
          </div>

          <div className="h-52 w-full flex items-center justify-center">
            {chartData.length === 0 ? (
              <p className="text-xs text-slate-500">No debit data to analyze.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => [`₹${value}`, 'Amount']}
                    contentStyle={{ backgroundColor: '#151b2c', borderColor: '#242e47', borderRadius: '8px' }}
                    labelStyle={{ color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                    itemStyle={{ fontSize: '11px', color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Legends */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            {chartData.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: d.color }}></span>
                <span className="truncate">{d.name} ({Math.round(totalDebit > 0 ? (d.value / totalDebit) * 100 : 0)}%)</span>
              </div>
            ))}
          </div>
        </div>

        {/* Merchant Leaderboard Card */}
        <div className="glass-panel p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-bold text-sm text-white flex items-center gap-1.5">
                <Award className="h-4.5 w-4.5 text-primary" /> Merchant Leaderboard
              </h3>
              <p className="text-xs text-slate-500">Where you spent the most money</p>
            </div>
            <ShoppingBag className="h-5 w-5 text-slate-500" />
          </div>

          <div className="table-container">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-800 bg-[#0e1322]/20 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  <th className="p-3">Merchant</th>
                  <th className="p-3 text-center">Txns</th>
                  <th className="p-3 text-right">Total Spent</th>
                  <th className="p-3 text-right">% of Expenses</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 text-xs text-slate-350">
                {merchantLeaderboard.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-slate-500">No transactions recorded.</td>
                  </tr>
                ) : (
                  merchantLeaderboard.map((m, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/10 transition-colors">
                      <td className="p-3 font-semibold text-white flex items-center gap-2">
                        <span className="text-[10px] bg-slate-800 text-slate-450 border border-slate-700 px-1.5 py-0.5 rounded-md">
                          #{idx + 1}
                        </span>
                        {m.name}
                      </td>
                      <td className="p-3 text-center font-bold text-slate-400">{m.count}</td>
                      <td className="p-3 text-right font-extrabold text-white">₹{m.amount.toFixed(2)}</td>
                      <td className="p-3 text-right font-bold text-primary">
                        {m.percent.toFixed(1)}%
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};
