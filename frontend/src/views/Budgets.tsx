import React, { useState, useEffect } from 'react';
import { 
  PiggyBank, 
  Plus, 
  Trash2, 
  AlertTriangle,
  Loader2
} from 'lucide-react';
import type { Transaction, Budget, Subscription } from '../types';
import axios from 'axios';

const DEFAULT_BUDGETS: Budget[] = [
  { category: 'Food & Dining', limit: 12000 },
  { category: 'Shopping', limit: 10000 },
  { category: 'Bills & Utilities', limit: 20000 },
  { category: 'Transport', limit: 6000 },
  { category: 'Entertainment', limit: 5000 },
  { category: 'Others', limit: 4000 }
];

const tenDays = 10 * 24 * 60 * 60 * 1000;
const twentyFourDays = 24 * 24 * 60 * 60 * 1000;
const fiveDays = 5 * 24 * 60 * 60 * 1000;
const fifteenDays = 15 * 24 * 60 * 60 * 1000;

const DEFAULT_SUBSCRIPTIONS: Subscription[] = [
  { id: 'sub-1', name: 'Jio Fiber Broadband', amount: 1178.00, billingCycle: 'monthly', nextRenewal: new Date(Date.now() + tenDays).toISOString().split('T')[0], category: 'Bills & Utilities' },
  { id: 'sub-2', name: 'Swiggy One Gold', amount: 149.00, billingCycle: 'monthly', nextRenewal: new Date(Date.now() + twentyFourDays).toISOString().split('T')[0], category: 'Food & Dining' },
  { id: 'sub-3', name: 'Netflix Premium', amount: 649.00, billingCycle: 'monthly', nextRenewal: new Date(Date.now() + fiveDays).toISOString().split('T')[0], category: 'Entertainment' },
  { id: 'sub-4', name: 'Spotify Individual', amount: 119.00, billingCycle: 'monthly', nextRenewal: new Date(Date.now() + fifteenDays).toISOString().split('T')[0], category: 'Entertainment' }
];

interface BudgetsProps {
  transactions: Transaction[];
}

export const Budgets: React.FC<BudgetsProps> = ({ transactions }) => {
  const [budgets, setBudgets] = useState<Budget[]>(DEFAULT_BUDGETS);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(DEFAULT_SUBSCRIPTIONS);
  const [loading, setLoading] = useState(true);

  // Editor states
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editLimitVal, setEditLimitVal] = useState('');

  // Add Subscription form states
  const [showAddSub, setShowAddSub] = useState(false);
  const [newSubName, setNewSubName] = useState('');
  const [newSubAmount, setNewSubAmount] = useState('');
  const [newSubCycle, setNewSubCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [newSubDate, setNewSubDate] = useState('');
  const [newSubCat, setNewSubCat] = useState('Bills & Utilities');

  // Load data from backend
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [budgetsRes, subsRes] = await Promise.all([
          axios.get('/api/budgets'),
          axios.get('/api/subscriptions')
        ]);
        if (budgetsRes.data.success && budgetsRes.data.budgets) {
          if (budgetsRes.data.budgets.length > 0) {
            setBudgets(budgetsRes.data.budgets);
          } else {
            setBudgets(DEFAULT_BUDGETS);
          }
        }
        if (subsRes.data.success && subsRes.data.subscriptions) {
          setSubscriptions(subsRes.data.subscriptions);
        }
      } catch (error) {
        console.error("Failed to load budgets/subscriptions from backend:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Compute expenses by category for the current month
  const getCategorySpend = (category: string) => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    return transactions
      .filter(t => {
        if (t.type !== 'DEBIT' || t.category !== category) return false;
        try {
          const d = new Date(t.date);
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        } catch (e) {
          return false;
        }
      })
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const handleUpdateLimit = async (category: string) => {
    const limitNum = parseFloat(editLimitVal);
    if (isNaN(limitNum) || limitNum < 0) return;

    const updatedBudgets = budgets.map(b => b.category === category ? { ...b, limit: limitNum } : b);
    
    try {
      // Optimistic update
      setBudgets(updatedBudgets);
      setEditingCategory(null);
      setEditLimitVal('');
      
      const res = await axios.post('/api/budgets', updatedBudgets);
      if (res.data.success && res.data.budgets) {
        setBudgets(res.data.budgets);
      }
    } catch (error) {
      console.error("Failed to save budget limit to backend:", error);
      alert("Failed to update budget. Restoring previous value.");
      // Reload from server to reset state
      const res = await axios.get('/api/budgets');
      if (res.data.success && res.data.budgets) {
        setBudgets(res.data.budgets);
      }
    }
  };

  const handleAddSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    const amtFloat = parseFloat(newSubAmount);
    if (!newSubName.trim() || isNaN(amtFloat) || amtFloat <= 0 || !newSubDate) return;

    const payload = {
      name: newSubName.trim(),
      amount: amtFloat,
      billingCycle: newSubCycle,
      nextRenewal: newSubDate,
      category: newSubCat
    };

    try {
      const res = await axios.post('/api/subscriptions', payload);
      if (res.data.success && res.data.subscriptions) {
        setSubscriptions(res.data.subscriptions);
        setNewSubName('');
        setNewSubAmount('');
        setNewSubDate('');
        setShowAddSub(false);
      }
    } catch (error) {
      console.error("Failed to add subscription:", error);
      alert("Failed to add subscription to backend.");
    }
  };

  const handleDeleteSub = async (id: string) => {
    try {
      const res = await axios.delete(`/api/subscriptions/${id}`);
      if (res.data.success && res.data.subscriptions) {
        setSubscriptions(res.data.subscriptions);
      }
    } catch (error) {
      console.error("Failed to delete subscription:", error);
      alert("Failed to delete subscription from backend.");
    }
  };

  const getDaysLeft = (dateStr: string) => {
    const diffTime = new Date(dateStr).getTime() - Date.now();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays < 0 ? 0 : diffDays;
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Retrieving Budgets & Subscriptions...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
      
      {/* Category Budgets Column */}
      <div className="lg:col-span-2 space-y-6">
        <div className="glass-panel p-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-6">
            <div>
              <h3 className="font-display font-bold text-base text-white">Monthly Budgets</h3>
              <p className="text-xs text-slate-500">Track and customize category spending limits (this month)</p>
            </div>
            <PiggyBank className="h-5.5 w-5.5 text-primary" />
          </div>

          <div className="space-y-6">
            {budgets.map((b) => {
              const spent = getCategorySpend(b.category);
              const percent = b.limit > 0 ? (spent / b.limit) * 100 : 0;
              const isOver = spent > b.limit;
              const isWarning = !isOver && percent >= 80;

              return (
                <div key={b.category} className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-white font-bold">{b.category}</span>
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <span>₹{spent.toFixed(0)}</span>
                      <span>/</span>
                      {editingCategory === b.category ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={editLimitVal}
                            placeholder={b.limit.toString()}
                            onChange={(e) => setEditLimitVal(e.target.value)}
                            className="w-16 bg-slate-900 border border-slate-700 px-1 py-0.5 text-[10px] text-white focus:outline-none"
                          />
                          <button
                            onClick={() => handleUpdateLimit(b.category)}
                            className="bg-primary hover:bg-primary-hover text-white px-1.5 py-0.5 text-[9px] rounded font-bold"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <span 
                          onClick={() => { setEditingCategory(b.category); setEditLimitVal(b.limit.toString()); }}
                          className="hover:underline cursor-pointer text-primary font-bold"
                        >
                          ₹{b.limit.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Smart Progress Bar */}
                  <div className="w-full bg-slate-850 h-2.5 rounded-full overflow-hidden border border-slate-800">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${
                        isOver ? 'bg-danger' : isWarning ? 'bg-warning' : 'bg-success'
                      }`}
                      style={{ width: `${Math.min(percent, 100)}%` }}
                    />
                  </div>

                  {/* Warn states */}
                  <div className="flex justify-between items-center text-[10px] font-bold">
                    <span className="text-slate-500">{percent.toFixed(0)}% Utilized</span>
                    {isOver && (
                      <span className="text-danger flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5" /> Limit Exceeded!
                      </span>
                    )}
                    {isWarning && (
                      <span className="text-warning flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5" /> Nearing Limit (80%+)
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Subscription Column */}
      <div className="lg:col-span-1 space-y-6">
        <div className="glass-panel p-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div>
              <h3 className="font-display font-bold text-sm text-white">Upcoming Bills</h3>
              <p className="text-xs text-slate-500">Recurring subscriptions commits</p>
            </div>
            <button
              onClick={() => setShowAddSub(!showAddSub)}
              className="bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 p-1.5 rounded-lg active:scale-95 transition-all"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {/* Add Subscription sub-form */}
          {showAddSub && (
            <form onSubmit={handleAddSubscription} className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 mb-4 space-y-3 animate-in fade-in duration-200">
              <input
                type="text"
                required
                placeholder="Subscription Name (e.g. Netflix)"
                value={newSubName}
                onChange={(e) => setNewSubName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  required
                  placeholder="Cost (₹)"
                  value={newSubAmount}
                  onChange={(e) => setNewSubAmount(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
                <select
                  value={newSubCat}
                  onChange={(e) => setNewSubCat(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                >
                  <option value="Bills & Utilities">Bills</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Food & Dining">Food</option>
                  <option value="Others">Others</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={newSubCycle}
                  onChange={(e) => setNewSubCycle(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
                <input
                  type="date"
                  required
                  value={newSubDate}
                  onChange={(e) => setNewSubDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-success hover:bg-success-hover text-white text-xs font-bold py-2 rounded-lg"
              >
                Add Subscription
              </button>
            </form>
          )}

          {/* Subscriptions List */}
          <div className="space-y-3.5 max-h-[360px] overflow-y-auto pr-1">
            {subscriptions.length === 0 ? (
              <p className="text-center text-slate-500 text-xs py-6">No recurring bills tracked.</p>
            ) : (
              subscriptions.map((sub) => {
                const days = getDaysLeft(sub.nextRenewal);
                return (
                  <div key={sub.id} className="flex items-center justify-between p-3 bg-slate-900/30 border border-slate-850 rounded-xl hover:border-slate-800 transition-colors">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate max-w-[130px]">{sub.name}</p>
                      <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                        ₹{sub.amount.toFixed(0)} • {sub.billingCycle}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          days <= 5 ? 'bg-danger/15 text-danger' : 'bg-primary/15 text-primary'
                        }`}>
                          {days === 0 ? 'Today' : `${days} d left`}
                        </span>
                        <p className="text-[9px] text-slate-600 font-bold mt-1 uppercase tracking-wider">{sub.nextRenewal}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteSub(sub.id)}
                        className="text-slate-500 hover:text-danger p-1 rounded-md transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
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
