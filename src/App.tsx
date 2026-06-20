import { useState } from 'react';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import Layout from './components/Layout';
import SetupWizard from './components/SetupWizard';
import Dashboard from './components/Dashboard';
import TransactionHistory from './components/TransactionHistory';
import Analytics from './components/Analytics';
import Settings from './components/Settings';
import TransactionModal from './components/TransactionModal';
import PasscodeLock from './components/PasscodeLock';
import type { TransactionType } from './types';
import { Plus } from 'lucide-react';

function AppContent() {
  const { isFirstLaunch, passcode, isLocked } = useFinance();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'analytics' | 'settings'>('dashboard');

  // Unified Transaction Modal State
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txModalType, setTxModalType] = useState<TransactionType>('credit');
  const [txModalFundId, setTxModalFundId] = useState<string | undefined>(undefined);

  const handleOpenTxModal = (type?: TransactionType, fundId?: string) => {
    setTxModalType(type || 'credit');
    setTxModalFundId(fundId);
    setIsTxModalOpen(true);
  };

  if (isFirstLaunch) {
    return <SetupWizard />;
  }

  if (passcode && isLocked) {
    return <PasscodeLock />;
  }

  return (
    <>
      <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
        {activeTab === 'dashboard' && (
          <Dashboard onOpenTransactionModal={handleOpenTxModal} />
        )}
        {activeTab === 'transactions' && <TransactionHistory />}
        {activeTab === 'analytics' && <Analytics />}
        {activeTab === 'settings' && <Settings />}
      </Layout>

      {/* Floating Action Button (FAB) */}
      <button
        onClick={() => handleOpenTxModal()}
        className="fixed bottom-20 right-6 md:bottom-8 md:right-8 z-40 h-14 w-14 rounded-full bg-neutral-900 text-white dark:bg-neutral-50 dark:text-neutral-950 flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-950 dark:focus:ring-neutral-100"
        title="Record Quick Transaction"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Unified Transaction Dialog */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        initialType={txModalType}
        initialFundId={txModalFundId}
      />
    </>
  );
}

function App() {
  return (
    <FinanceProvider>
      <AppContent />
    </FinanceProvider>
  );
}

export default App;
