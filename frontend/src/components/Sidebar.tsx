import React from 'react';
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  Camera, 
  PiggyBank, 
  TrendingUp, 
  RefreshCw,
  Zap,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Bell,
  Sparkles,
  Lock
} from 'lucide-react';
import type { User } from '../types';

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  syncStatus: 'online' | 'offline';
  onSync: () => void;
  syncing: boolean;
  currentUser: User | null;
  onLogout: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  setCurrentView, 
  syncStatus, 
  onSync,
  syncing,
  currentUser,
  onLogout,
  collapsed,
  onToggleCollapse
}) => {
  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', name: 'Transactions', icon: ArrowLeftRight },
    { id: 'scanner', name: 'Receipt Scanner', icon: Camera },
    { id: 'budgets', name: 'Budgets', icon: PiggyBank },
    { id: 'analytics', name: 'Analytics', icon: TrendingUp },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'billing', name: 'Premium Billing', icon: Sparkles },
  ];

  return (
    <aside className={`fixed inset-y-0 left-0 bg-[#0e1322] border-r border-slate-800/80 flex flex-col z-25 transition-all duration-300 ${
      collapsed ? 'w-20' : 'w-64'
    }`}>
      {/* Sleek Floating Toggle Button */}
      <button
        onClick={onToggleCollapse}
        className="absolute top-7 -right-3 h-6 w-6 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-all shadow-md z-30 hover:scale-105 active:scale-95"
        title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
      >
        {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
      </button>

      {/* Brand Header */}
      <div className={`h-20 flex items-center border-b border-slate-800/50 gap-3 ${
        collapsed ? 'justify-center px-4' : 'px-6'
      }`}>
        <div className="bg-primary/10 p-2 rounded-lg border border-primary/20 flex-shrink-0">
          <Zap className="h-6 w-6 text-primary" />
        </div>
        {!collapsed && (
          <div>
            <h1 className="font-display font-extrabold text-xl tracking-wider text-white">AETHER</h1>
            <span className="text-[10px] text-slate-500 font-medium tracking-widest uppercase">Wealth Engine</span>
          </div>
        )}
      </div>

      {/* Navigation Options */}
      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              title={collapsed ? item.name : undefined}
              className={`w-full flex items-center rounded-xl transition-all duration-200 group font-medium text-sm gap-3.5 ${
                collapsed ? 'justify-center p-3' : 'px-4 py-3'
              } ${
                isActive 
                  ? 'bg-primary/10 text-primary border-l-4 border-primary font-bold' 
                  : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
              }`}
            >
              <Icon className={`h-5 w-5 transition-transform duration-200 group-hover:scale-105 ${
                isActive ? 'text-primary' : 'text-slate-400 group-hover:text-slate-300'
              }`} />
              {!collapsed && <span>{item.name}</span>}
            </button>
          );
        })}
      </nav>

      {/* Sync Badge & Actions Footer */}
      <div className="p-4 border-t border-slate-800/50 bg-[#0a0d18]/50 space-y-3">
        {currentUser && (
          <div className={`flex items-center bg-[#121829] rounded-xl border border-slate-800/80 mb-2 ${
            collapsed ? 'p-1 justify-center' : 'p-2'
          }`}>
            <div 
              title={currentUser.name}
              className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-xs text-primary uppercase select-none flex-shrink-0"
            >
              {currentUser.name.split(' ').map(n => n[0]).join('')}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0 ml-2.5">
                <div className="flex items-center gap-1">
                  <p className="text-[11px] font-bold text-white truncate leading-tight">{currentUser.name}</p>
                  {currentUser.tier === 'premium' && (
                    <span className="text-[8px] font-black tracking-widest text-yellow-400 bg-yellow-500/10 border border-yellow-500/25 px-1 py-0.5 rounded scale-90 origin-left uppercase flex items-center gap-0.5 shrink-0">
                      ★ PRO
                    </span>
                  )}
                </div>
                <p className="text-[9px] text-slate-400 font-medium truncate leading-none mb-0.5">{currentUser.role}</p>
                <p className="text-[8px] text-slate-500 truncate leading-none">{currentUser.email}</p>
              </div>
            )}
            {!collapsed && (
              <button
                onClick={onLogout}
                title="Logout"
                className="p-1 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex-shrink-0"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}

        {collapsed && currentUser && (
          <button
            onClick={onLogout}
            title="Logout"
            className="w-full flex items-center justify-center p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        )}

        {!collapsed ? (
          <>
            <div className="flex items-center justify-between px-2">
              <span className="text-[11px] text-slate-500 font-semibold tracking-wider uppercase">Setu Sync</span>
              <div className="flex items-center gap-1.5">
                <span className={`h-2.5 w-2.5 rounded-full ${
                  syncStatus === 'online' ? 'bg-success badge-pulse' : 'bg-slate-600'
                }`} />
                <span className={`text-[11px] font-bold uppercase tracking-wider ${
                  syncStatus === 'online' ? 'text-success' : 'text-slate-400'
                }`}>
                  {syncStatus === 'online' ? 'Connected' : 'Offline'}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                if (currentUser?.tier !== 'premium') {
                  setCurrentView('billing');
                  alert('Aether Premium Required: Live Setu Sandbox connection requires Premium Pro subscription.');
                } else {
                  onSync();
                }
              }}
              disabled={syncing}
              className="w-full flex items-center justify-center py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-primary hover:bg-primary-hover active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all duration-200 shadow-lg shadow-primary/10 gap-2"
            >
              {currentUser?.tier !== 'premium' ? (
                <>
                  <Lock className="h-3.5 w-3.5 text-yellow-400" />
                  <span>Sync via Setu (PRO)</span>
                </>
              ) : (
                <>
                  <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
                  <span>{syncing ? 'Syncing...' : 'Sync Real Bank via Setu'}</span>
                </>
              )}
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2.5">
            <span 
              title={`Setu Sync: ${syncStatus === 'online' ? 'Connected' : 'Offline'}`}
              className={`h-3 w-3 rounded-full ${
                syncStatus === 'online' ? 'bg-success badge-pulse' : 'bg-slate-600'
              }`} 
            />
            <button
              onClick={onSync}
              disabled={syncing}
              title="Sync Real Bank via Setu"
              className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
