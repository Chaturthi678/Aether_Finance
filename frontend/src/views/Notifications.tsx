import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Settings, 
  Mail, 
  ShieldAlert, 
  RefreshCw, 
  FileText, 
  ExternalLink, 
  CheckCircle2, 
  DollarSign, 
  AlertTriangle, 
  Calendar, 
  Sliders,
  Send,
  Loader2
} from 'lucide-react';
import axios from 'axios';
import type { Notification, NotificationPreferences } from '../types';

export const Notifications: React.FC = () => {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailAlerts: true,
    largeExpenseLimit: 5000,
    budgetAlerts: true,
    loginAlerts: true,
    syncAlerts: true,
    billingAlerts: true,
    weeklyReport: true
  });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingPrefs, setLoadingPrefs] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Load preferences and notifications
  useEffect(() => {
    const fetchPrefs = async () => {
      try {
        const res = await axios.get('/api/notifications/preferences');
        if (res.data.success && res.data.preferences) {
          setPreferences(res.data.preferences);
        }
      } catch (err) {
        console.error("Failed to load notification preferences:", err);
      } finally {
        setLoadingPrefs(false);
      }
    };

    const fetchHistory = async () => {
      try {
        const res = await axios.get('/api/notifications');
        if (res.data.success && res.data.notifications) {
          setNotifications(res.data.notifications);
        }
      } catch (err) {
        console.error("Failed to load notifications history:", err);
      } finally {
        setLoadingHistory(false);
      }
    };

    fetchPrefs();
    fetchHistory();
  }, []);

  const handlePreferenceChange = (key: keyof NotificationPreferences, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPrefs(true);
    setSaveStatus('idle');
    try {
      const res = await axios.post('/api/notifications/preferences', preferences);
      if (res.data.success) {
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    } catch (err) {
      console.error("Failed to save preferences:", err);
      setSaveStatus('error');
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const res = await axios.post('/api/notifications/read');
      if (res.data.success && res.data.notifications) {
        setNotifications(res.data.notifications);
      }
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await axios.post('/api/notifications/read', { id });
      if (res.data.success && res.data.notifications) {
        setNotifications(res.data.notifications);
      }
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const handleSendTestEmail = async () => {
    setTestingEmail(true);
    try {
      const res = await axios.post('/api/notifications/test-email');
      if (res.data.success) {
        // Reload notifications
        const historyRes = await axios.get('/api/notifications');
        if (historyRes.data.success && historyRes.data.notifications) {
          setNotifications(historyRes.data.notifications);
        }
        alert("Simulation Complete: Test transactions matched. Check your inbox! (If using developer sandbox, preview URL is logged in terminal console)");
      }
    } catch (err: any) {
      console.error("Failed to send test email:", err);
      alert(`Simulation failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setTestingEmail(false);
    }
  };

  const handleGenerateSummary = async () => {
    setGeneratingSummary(true);
    try {
      const res = await axios.post('/api/notifications/trigger-monthly-summary');
      if (res.data.success) {
        // Reload notifications
        const historyRes = await axios.get('/api/notifications');
        if (historyRes.data.success && historyRes.data.notifications) {
          setNotifications(historyRes.data.notifications);
        }
        alert("Wealth Summary generated and dispatched to your inbox! (If using developer sandbox, preview URL is logged in terminal console)");
      }
    } catch (err: any) {
      console.error("Failed to generate summary:", err);
      alert(`Summary generation failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setGeneratingSummary(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'security':
        return <ShieldAlert className="h-5 w-5 text-danger" />;
      case 'sync':
        return <RefreshCw className="h-5 w-5 text-primary" />;
      case 'budget':
        return <AlertTriangle className="h-5 w-5 text-warning" />;
      case 'transaction':
        return <DollarSign className="h-5 w-5 text-success" />;
      case 'billing':
        return <Calendar className="h-5 w-5 text-pink-500" />;
      case 'summary':
        return <FileText className="h-5 w-5 text-cyan-400" />;
      default:
        return <Bell className="h-5 w-5 text-slate-400" />;
    }
  };

  const getNotificationColorClass = (type: string) => {
    switch (type) {
      case 'security':
        return 'border-danger/20 bg-danger/5 text-danger';
      case 'sync':
        return 'border-primary/20 bg-primary/5 text-primary';
      case 'budget':
        return 'border-warning/20 bg-warning/5 text-warning';
      case 'transaction':
        return 'border-success/20 bg-success/5 text-success';
      case 'billing':
        return 'border-pink-550/20 bg-pink-500/5 text-pink-400';
      case 'summary':
        return 'border-cyan-500/20 bg-cyan-500/5 text-cyan-400';
      default:
        return 'border-slate-800 bg-slate-900/30 text-slate-400';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
      
      {/* Preferences Column */}
      <div className="lg:col-span-1 space-y-6">
        <div className="glass-panel p-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-5">
            <div>
              <h3 className="font-display font-bold text-sm text-white">Alert Preferences</h3>
              <p className="text-xs text-slate-500">Configure email & real-time warnings</p>
            </div>
            <Settings className="h-5 w-5 text-primary animate-pulse" />
          </div>

          {loadingPrefs ? (
            <div className="py-12 flex justify-center items-center">
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
            </div>
          ) : (
            <form onSubmit={handleSavePreferences} className="space-y-4">
              
              {/* Global Email Alerts Toggle */}
              <div className="flex items-center justify-between p-3.5 bg-slate-900/40 border border-slate-800/80 rounded-xl hover:border-slate-850 transition-colors">
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-primary" /> Email Dispatcher
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium mt-0.5">Route notifications to your registered email</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={preferences.emailAlerts}
                    onChange={(e) => handlePreferenceChange('emailAlerts', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-slate-400 after:border-slate-350 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary peer-checked:after:bg-white"></div>
                </label>
              </div>

              {/* Large Expense Limit */}
              <div className="p-3.5 bg-slate-900/20 border border-slate-800/60 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-white">
                  <span className="flex items-center gap-1.5"><Sliders className="h-3.5 w-3.5 text-success" /> Large Expense Limit</span>
                  <span className="text-success text-[10px] font-extrabold bg-success/15 px-2 py-0.5 rounded">₹{preferences.largeExpenseLimit.toLocaleString('en-IN')}</span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium">Trigger warning notification if single expense equals or exceeds this limit.</p>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={preferences.largeExpenseLimit}
                  onChange={(e) => handlePreferenceChange('largeExpenseLimit', parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-primary/50"
                />
              </div>

              {/* Preferences Toggles List */}
              <div className="space-y-2.5 pt-2">
                <h4 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Toggle Notification Topics</h4>
                
                {/* Budgets Exceeded */}
                <div className="flex items-center justify-between py-2 border-b border-slate-850">
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-300">Budget Limit Exceeded</p>
                    <p className="text-[9px] text-slate-500 font-semibold mt-0.5">Alert when category spending exceeds threshold</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={preferences.budgetAlerts}
                      onChange={(e) => handlePreferenceChange('budgetAlerts', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-slate-400 after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                {/* Login Alerts */}
                <div className="flex items-center justify-between py-2 border-b border-slate-850">
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-300">Login Security Alerts</p>
                    <p className="text-[9px] text-slate-500 font-semibold mt-0.5">Alert instantly on new browser dashboard sessions</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={preferences.loginAlerts}
                      onChange={(e) => handlePreferenceChange('loginAlerts', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-slate-400 after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                {/* Bank Sync Alerts */}
                <div className="flex items-center justify-between py-2 border-b border-slate-850">
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-300">Bank Sync Alerts</p>
                    <p className="text-[9px] text-slate-500 font-semibold mt-0.5">Alert upon successful Setu consent sync</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={preferences.syncAlerts}
                      onChange={(e) => handlePreferenceChange('syncAlerts', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-slate-400 after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                {/* Billing Alerts */}
                <div className="flex items-center justify-between py-2 border-b border-slate-850">
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-300">Bill & Subscription Due</p>
                    <p className="text-[9px] text-slate-500 font-semibold mt-0.5">Alert 24 hours prior to subscription renew dates</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={preferences.billingAlerts}
                      onChange={(e) => handlePreferenceChange('billingAlerts', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-slate-400 after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                {/* AI Digest summaries */}
                <div className="flex items-center justify-between py-2 border-b border-slate-850">
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-300">Monthly AI Wealth Digest</p>
                    <p className="text-[9px] text-slate-500 font-semibold mt-0.5">Receive monthly analytics reports in email</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={preferences.weeklyReport}
                      onChange={(e) => handlePreferenceChange('weeklyReport', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-slate-400 after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>

              {/* Submit preferences */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingPrefs}
                  className="w-full bg-primary hover:bg-primary-hover text-white text-xs font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60"
                >
                  {savingPrefs ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" /> Save Alerts Setup
                    </>
                  )}
                </button>
                {saveStatus === 'success' && (
                  <p className="text-center text-[10px] text-success font-bold mt-2">Preferences saved successfully!</p>
                )}
                {saveStatus === 'error' && (
                  <p className="text-center text-[10px] text-danger font-bold mt-2">Failed to save preferences.</p>
                )}
              </div>
            </form>
          )}
        </div>

        {/* Simulator Triggers Panel */}
        <div className="glass-panel p-5 space-y-4">
          <h3 className="font-display font-bold text-xs text-white uppercase tracking-wider">Test Suite Sandbox</h3>
          <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
            Dispatch mock event triggers instantly to verify email templates and live Gmail/SMTP or sandbox Ethereal delivery integrations.
          </p>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleSendTestEmail}
              disabled={testingEmail}
              className="bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-white p-3.5 rounded-xl text-left hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50"
            >
              <Send className="h-4 w-4 text-success mb-1" />
              <p className="text-xs font-bold text-white">Send Test Alert</p>
              <p className="text-[8px] text-slate-500 font-bold mt-0.5">Trigger test transaction</p>
            </button>

            <button
              onClick={handleGenerateSummary}
              disabled={generatingSummary}
              className="bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-white p-3.5 rounded-xl text-left hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50"
            >
              <FileText className="h-4 w-4 text-cyan-400 mb-1" />
              <p className="text-xs font-bold text-white">AI Wealth Summary</p>
              <p className="text-[8px] text-slate-500 font-bold mt-0.5">Generate monthly insights</p>
            </button>
          </div>
        </div>
      </div>

      {/* History Timeline Column */}
      <div className="lg:col-span-2 space-y-6">
        <div className="glass-panel p-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-5">
            <div>
              <h3 className="font-display font-bold text-base text-white">Notification Ledger</h3>
              <p className="text-xs text-slate-500">Chronological history of security, transactions and alert logs</p>
            </div>
            <button
              onClick={handleMarkAllAsRead}
              className="text-primary hover:underline text-xs font-bold flex items-center gap-1.5"
            >
              Mark all as read
            </button>
          </div>

          {loadingHistory ? (
            <div className="py-24 flex flex-col justify-center items-center gap-2">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="text-slate-600 text-xs font-bold uppercase tracking-wider">Loading history...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-24 flex flex-col items-center justify-center space-y-2">
              <Bell className="h-10 w-10 text-slate-700" />
              <p className="text-slate-500 text-xs font-bold">No notifications logged yet.</p>
              <p className="text-[10px] text-slate-600 text-center max-w-xs font-medium">Use the "Test Suite Sandbox" panel to dispatch alerts and check results.</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[640px] overflow-y-auto pr-1 text-left">
              {notifications.map((not) => {
                const icon = getNotificationIcon(not.type);
                const colorClass = getNotificationColorClass(not.type);
                const formattedDate = new Date(not.date).toLocaleString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <div
                    key={not.id}
                    onClick={() => !not.read && handleMarkAsRead(not.id)}
                    className={`flex gap-4 p-4 border rounded-2xl transition-all duration-300 relative group cursor-pointer ${
                      not.read 
                        ? 'border-slate-850 bg-slate-900/10 opacity-75 hover:bg-slate-900/20' 
                        : 'border-slate-800 bg-[#121827]/40 hover:bg-[#121827]/60 shadow-lg shadow-black/5 hover:border-slate-755'
                    }`}
                  >
                    {/* Read status light */}
                    {!not.read && (
                      <span className="absolute top-4 right-4 h-2 w-2 rounded-full bg-primary animate-ping" />
                    )}

                    {/* Icon container */}
                    <div className={`h-10 w-10 shrink-0 border rounded-xl flex items-center justify-center ${colorClass}`}>
                      {icon}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-xs font-bold truncate ${not.read ? 'text-slate-400' : 'text-white font-extrabold'}`}>
                          {not.title}
                        </p>
                        <span className="text-[9px] text-slate-500 font-bold shrink-0">{formattedDate}</span>
                      </div>
                      
                      <p className="text-[11px] text-slate-400 leading-relaxed font-semibold">
                        {not.message}
                      </p>

                      {/* Ethereal Sandbox Link */}
                      {not.emailSent && not.emailLink && (
                        <div className="flex items-center gap-1.5 pt-2">
                          <span className="text-[9px] text-success font-extrabold bg-success/15 border border-success/20 px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0">
                            <Mail className="h-3 w-3" /> Email Dispatched
                          </span>
                          <a
                            href={not.emailLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()} // don't trigger read status click
                            className="text-[9px] text-primary font-extrabold hover:underline flex items-center gap-0.5"
                          >
                            View Sandbox Email <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
