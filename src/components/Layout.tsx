import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils/helpers';
import { LayoutDashboard, Receipt, BarChart3, Settings as SettingsIcon, Sun, Moon, Monitor, Wallet } from 'lucide-react';

interface LayoutProps {
  activeTab: 'dashboard' | 'transactions' | 'analytics' | 'settings';
  setActiveTab: (tab: 'dashboard' | 'transactions' | 'analytics' | 'settings') => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ activeTab, setActiveTab, children }) => {
  const { currentAccountBalance, currency, theme, updateTheme } = useFinance();

  const navigationItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', name: 'Transactions', icon: Receipt },
    { id: 'analytics', name: 'Analytics', icon: BarChart3 },
    { id: 'settings', name: 'Settings', icon: SettingsIcon },
  ] as const;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-800 dark:text-neutral-250 flex flex-col transition-colors duration-200 font-sans pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/85 dark:bg-neutral-900/85 backdrop-blur-md border-b border-neutral-100 dark:border-neutral-850 transition-colors duration-200">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="h-9 w-9 rounded-xl bg-neutral-900 dark:bg-neutral-50 flex items-center justify-center text-white dark:text-neutral-900">
              <Wallet className="h-5 w-5" />
            </div>
            <span className="font-bold text-sm tracking-tight text-neutral-950 dark:text-white">
              Personal <span className="font-normal text-neutral-400 dark:text-neutral-500">Finance</span>
            </span>
          </div>

          {/* Center navigation (Desktop) */}
          <nav className="hidden md:flex items-center gap-1.5">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-neutral-100 text-neutral-950 dark:bg-neutral-800 dark:text-white'
                      : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-450 dark:hover:text-neutral-200 hover:bg-neutral-50/50 dark:hover:bg-neutral-850/50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </button>
              );
            })}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            {/* Quick Balance Header Badging */}
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Total Balance</span>
              <span className="text-sm font-bold text-neutral-950 dark:text-white leading-none">
                {formatCurrency(currentAccountBalance, currency)}
              </span>
            </div>

            {/* Theme Toggle */}
            <div className="flex bg-neutral-100 dark:bg-neutral-850 p-1 rounded-xl border border-neutral-150/40 dark:border-neutral-800">
              <button
                onClick={() => updateTheme('light')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  theme === 'light'
                    ? 'bg-white text-neutral-900 shadow-xs dark:bg-neutral-900 dark:text-neutral-50'
                    : 'text-neutral-400 hover:text-neutral-600'
                }`}
                title="Light Theme"
              >
                <Sun className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => updateTheme('dark')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-white text-neutral-900 shadow-xs dark:bg-neutral-900 dark:text-neutral-50'
                    : 'text-neutral-400 hover:text-neutral-600'
                }`}
                title="Dark Theme"
              >
                <Moon className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => updateTheme('system')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  theme === 'system'
                    ? 'bg-white text-neutral-900 shadow-xs dark:bg-neutral-900 dark:text-neutral-50'
                    : 'text-neutral-400 hover:text-neutral-600'
                }`}
                title="System Theme"
              >
                <Monitor className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow max-w-6xl w-full mx-auto px-4 py-8">
        {children}
      </main>

      {/* Mobile Navigation (Fixed bottom) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-neutral-900/95 border-t border-neutral-100 dark:border-neutral-850 flex items-center justify-around pb-[env(safe-area-inset-bottom)] h-[calc(4rem+env(safe-area-inset-bottom))] px-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] backdrop-blur-md">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-medium transition-colors cursor-pointer ${
                isActive ? 'text-neutral-950 dark:text-white' : 'text-neutral-450 dark:text-neutral-500'
              }`}
            >
              <Icon className="h-5 w-5 mb-0.5" />
              {item.name}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
export default Layout;
