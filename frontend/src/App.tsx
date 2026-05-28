import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { AiAssistant } from './components/AiAssistant';
import { Login } from './components/Login';
import { Dashboard } from './views/Dashboard';
import { Transactions } from './views/Transactions';
import { ReceiptScanner } from './views/ReceiptScanner';
import { Budgets } from './views/Budgets';
import { Analytics } from './views/Analytics';
import { Notifications } from './views/Notifications';
import { Billing } from './views/Billing';
import type { Transaction, User } from './types';
import axios from 'axios';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [syncStatus, setSyncStatus] = useState<'online' | 'offline'>('offline');
  const [syncing, setSyncing] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

  const handleLogin = (user: User, token: string) => {
    setCurrentUser(user);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  };

  const handleUpdateUser = (user: User, token?: string) => {
    setCurrentUser(user);
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  // Load transactions from the backend
  const loadTransactions = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/transactions');
      setTransactions(response.data.transactions || []);
      if ((response.data.transactions || []).length > 0) {
        setSyncStatus('online');
      }
    } catch (error) {
      console.error("Failed to load transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadTransactions();
    } else {
      setTransactions([]);
      setSyncStatus('offline');
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;

    // Check query params for Setu redirect callback
    const queryParams = new URLSearchParams(window.location.search);
    const setuSuccess = queryParams.get('success');
    const consentId = queryParams.get('id');

    if (setuSuccess === 'true' && consentId) {
      const syncSetuBank = async () => {
        setSyncing(true);
        try {
          console.log(`Auto-triggering Setu sync for consent ID: ${consentId}`);
          const response = await axios.post('/api/setu/sync', { consentId });
          if (response.data.success) {
            setTransactions(response.data.transactions || []);
            setSyncStatus('online');
            alert(`Bank transactions successfully aggregated via Setu Sandbox (Consent: ${consentId})`);
          }
        } catch (error: any) {
          console.error("Auto-sync via Setu failed:", error);
          alert(`Sync failed: ${error.response?.data?.error || error.message}`);
        } finally {
          setSyncing(false);
          // Remove query params from address bar
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
        }
      };

      syncSetuBank();
    } else if (setuSuccess === 'false') {
      const errorMsg = queryParams.get('errormsg') || 'Consent registration aborted.';
      alert(`Consent Rejected: ${errorMsg}`);
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }, [currentUser]);

  // Setu Mock Bank Sync
  const handleBankSync = async () => {
    setSyncing(true);
    try {
      const response = await axios.post('/api/sync-bank');
      if (response.data.success) {
        setTransactions(response.data.transactions || []);
        setSyncStatus('online');
      }
    } catch (error) {
      console.error("Bank sync failed:", error);
    } finally {
      setSyncing(false);
    }
  };

  // Add individual transaction (Manual or Scanned)
  const handleAddTransaction = async (txn: Omit<Transaction, 'id'>): Promise<boolean> => {
    try {
      const response = await axios.post('/api/transactions/manual', {
        merchantName: txn.narration,
        totalAmount: txn.amount,
        date: txn.date,
        category: txn.category
      });
      if (response.data.success) {
        setTransactions(response.data.transactions || []);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Add transaction failed:", error);
      return false;
    }
  };

  // Delete individual transaction
  const handleDeleteTransaction = async (id: string) => {
    try {
      const response = await axios.delete(`/api/transactions/${id}`);
      if (response.data.success) {
        setTransactions(response.data.transactions || []);
      }
    } catch (error) {
      console.error("Delete transaction failed:", error);
    }
  };

  // Bulk add (CSV Import)
  const handleBulkAddTransactions = async (txnsList: Omit<Transaction, 'id'>[]) => {
    // Process items sequentially to update local database files properly
    for (const item of txnsList) {
      await handleAddTransaction(item);
    }
  };

  // Render view depending on navigation state
  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard 
            transactions={transactions} 
            onSync={handleBankSync} 
            syncing={syncing} 
          />
        );
      case 'transactions':
        return (
          <Transactions 
            transactions={transactions} 
            onAddTransaction={handleAddTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            onBulkAddTransactions={handleBulkAddTransactions}
          />
        );
      case 'scanner':
        return (
          <ReceiptScanner 
            onAddTransaction={handleAddTransaction} 
            currentUser={currentUser}
          />
        );
      case 'budgets':
        return (
          <Budgets 
            transactions={transactions} 
          />
        );
      case 'analytics':
        return (
          <Analytics 
            transactions={transactions} 
          />
        );
      case 'notifications':
        return (
          <Notifications />
        );
      case 'billing':
        return (
          <Billing 
            currentUser={currentUser}
            onUpdateUser={handleUpdateUser}
          />
        );
      default:
        return <Dashboard transactions={transactions} onSync={handleBankSync} syncing={syncing} />;
    }
  };

  if (!currentUser) {
    return <Login onLoginSuccess={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] flex">
      {/* Fixed Sidebar Navigation */}
      <Sidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        syncStatus={syncStatus} 
        onSync={handleBankSync} 
        syncing={syncing}
        currentUser={currentUser}
        onLogout={handleLogout}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content Area */}
      <main className={`flex-1 min-h-screen relative flex flex-col transition-all duration-300 ${
        sidebarCollapsed ? 'pl-20' : 'pl-64'
      }`}>
        {/* Top Spacer Header */}
        <header className="h-20 flex items-center justify-between px-8 border-b border-slate-800/40 bg-[#0e1322]/20 backdrop-blur-[6px] sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-primary font-bold uppercase tracking-widest bg-primary/10 border border-primary/20 px-2 py-0.5 rounded">
              Secure Ledger Mode
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${transactions.length > 0 ? 'bg-success' : 'bg-slate-500'}`} />
              <span className="text-xs text-slate-400 font-semibold">{transactions.length} Transactions Synced</span>
            </div>
          </div>
        </header>

        {/* Dynamic Pages Area */}
        <div className="flex-1 p-8 overflow-y-auto max-w-[1400px] w-full mx-auto">
          {loading && transactions.length === 0 ? (
            <div className="h-[60vh] flex flex-col items-center justify-center space-y-3">
              <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Retrieving transaction ledger...</p>
            </div>
          ) : (
            renderView()
          )}
        </div>
      </main>

      {/* Floating AI Advisor Widget */}
      <AiAssistant transactions={transactions} currentUser={currentUser} />
    </div>
  );
}

export default App;
