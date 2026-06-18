import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { Fund, Transaction, ReconciliationRecord, Reminder, ExportData } from '../types';

interface FinanceContextType {
  funds: Fund[];
  transactions: Transaction[];
  reconciliations: ReconciliationRecord[];
  reminders: Reminder[];
  currency: string;
  notes: string;
  theme: 'light' | 'dark' | 'system';
  isFirstLaunch: boolean;
  fundBalances: Record<string, number>;
  currentAccountBalance: number;
  setupApp: (currency: string, initialBalances: Record<string, number>) => void;
  addTransaction: (tx: Omit<Transaction, 'id'>) => void;
  editTransaction: (id: string, tx: Omit<Transaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;
  addFund: (name: string, color: string, icon: string) => void;
  updateFund: (id: string, updates: Partial<Omit<Fund, 'id'>>) => void;
  archiveFund: (id: string) => boolean;
  restoreFund: (id: string) => void;
  reorderFunds: (reordered: Fund[]) => void;
  addReconciliation: (
    actualBalance: number,
    calculatedBalance: number,
    difference: number,
    fundIdForAdjustment?: string,
    notes?: string
  ) => void;
  addReminder: (reminder: Omit<Reminder, 'id' | 'completed'>) => void;
  payReminder: (id: string) => void;
  deleteReminder: (id: string) => void;
  updateNotes: (notes: string) => void;
  updateCurrency: (currency: string) => void;
  updateTheme: (theme: 'light' | 'dark' | 'system') => void;
  resetData: () => void;
  exportData: () => string;
  importData: (jsonString: string) => { success: boolean; error?: string };
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'personal_finance_data';
const DATA_VERSION = 1;

export const generateUUID = (): string => {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const loadInitialData = (): ExportData | null => {
  if (typeof window === 'undefined') return null;
  const rawData = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (rawData) {
    try {
      const parsed = JSON.parse(rawData) as ExportData;
      if (parsed && parsed.version === DATA_VERSION) {
        return parsed;
      }
    } catch (e) {
      console.error('Failed to parse financial data from localStorage', e);
    }
  }
  return null;
};

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load data synchronously on initial render to prevent state lag
  const initialData = React.useMemo(() => loadInitialData(), []);

  const [funds, setFunds] = useState<Fund[]>(() => initialData?.funds || []);
  const [transactions, setTransactions] = useState<Transaction[]>(() => initialData?.transactions || []);
  const [reconciliations, setReconciliations] = useState<ReconciliationRecord[]>(() => initialData?.reconciliations || []);
  const [reminders, setReminders] = useState<Reminder[]>(() => initialData?.reminders || []);
  const [currency, setCurrency] = useState<string>(() => initialData?.currency || '₹');
  const [notes, setNotes] = useState<string>(() => initialData?.notes || '');
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => initialData?.theme || 'system');
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean>(() => !initialData);

  // Save data to localStorage when state changes (only if not first launch or setup done)
  const saveData = (
    updatedFunds: Fund[],
    updatedTransactions: Transaction[],
    updatedReconciliations: ReconciliationRecord[],
    updatedReminders: Reminder[],
    updatedCurrency: string,
    updatedNotes: string,
    updatedTheme: 'light' | 'dark' | 'system',
    firstLaunchState: boolean
  ) => {
    if (firstLaunchState) return;
    const dataToSave: ExportData = {
      version: DATA_VERSION,
      funds: updatedFunds,
      transactions: updatedTransactions,
      reconciliations: updatedReconciliations,
      reminders: updatedReminders,
      notes: updatedNotes,
      currency: updatedCurrency,
      theme: updatedTheme,
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToSave));
  };

  // Dynamic calculations
  const fundBalances = useMemo(() => {
    const balances: Record<string, number> = {};
    funds.forEach((f) => {
      balances[f.id] = 0;
    });

    transactions.forEach((t) => {
      if (t.type === 'credit') {
        if (balances[t.fundId] !== undefined) balances[t.fundId] += t.amount;
      } else if (t.type === 'expense') {
        if (balances[t.fundId] !== undefined) balances[t.fundId] -= t.amount;
      } else if (t.type === 'transfer') {
        if (balances[t.fundId] !== undefined) balances[t.fundId] -= t.amount;
        if (balances[t.toFundId] !== undefined) balances[t.toFundId] += t.amount;
      } else if (t.type === 'adjustment') {
        if (balances[t.fundId] !== undefined) balances[t.fundId] += t.amount;
      }
    });

    return balances;
  }, [funds, transactions]);

  const currentAccountBalance = useMemo(() => {
    return funds
      .filter((f) => !f.archived)
      .reduce((sum, f) => sum + (fundBalances[f.id] || 0), 0);
  }, [funds, fundBalances]);

  // Setup Wizard
  const setupApp = (selectedCurrency: string, initialBalances: Record<string, number>) => {
    const today = new Date().toISOString().split('T')[0];
    
    // Create Default Funds
    const defaultFunds: Fund[] = [
      {
        id: generateUUID(),
        name: 'Project Fund',
        color: '#BAD7E9', // Pastel Blue
        icon: 'Briefcase',
        order: 0,
        archived: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: generateUUID(),
        name: 'Home Fund',
        color: '#C1E1C1', // Pastel Green
        icon: 'Home',
        order: 1,
        archived: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: generateUUID(),
        name: 'Personal Fund',
        color: '#FFD1B3', // Pastel Peach
        icon: 'User',
        order: 2,
        archived: false,
        createdAt: new Date().toISOString(),
      },
    ];

    // Create Opening Balance transactions
    const initialTransactions: Transaction[] = [];
    defaultFunds.forEach((f) => {
      let balanceKey = '';
      if (f.name === 'Project Fund') balanceKey = 'project';
      if (f.name === 'Home Fund') balanceKey = 'home';
      if (f.name === 'Personal Fund') balanceKey = 'personal';

      const initialAmount = initialBalances[balanceKey] || 0;
      if (initialAmount > 0) {
        initialTransactions.push({
          id: generateUUID(),
          type: 'credit',
          amount: initialAmount,
          date: today,
          notes: 'Opening Balance',
          fundId: f.id,
        });
      }
    });

    setFunds(defaultFunds);
    setTransactions(initialTransactions);
    setCurrency(selectedCurrency);
    setIsFirstLaunch(false);

    // Save directly
    const dataToSave: ExportData = {
      version: DATA_VERSION,
      funds: defaultFunds,
      transactions: initialTransactions,
      reconciliations: [],
      reminders: [],
      notes: '',
      currency: selectedCurrency,
      theme,
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToSave));
  };

  // Transaction Actions
  const addTransaction = (tx: Omit<Transaction, 'id'>) => {
    const newTx = { ...tx, id: generateUUID() } as Transaction;
    const updated = [newTx, ...transactions];
    setTransactions(updated);
    saveData(funds, updated, reconciliations, reminders, currency, notes, theme, isFirstLaunch);
  };

  const editTransaction = (id: string, updatedTx: Omit<Transaction, 'id'>) => {
    const updated = transactions.map((t) => (t.id === id ? ({ ...updatedTx, id } as Transaction) : t));
    setTransactions(updated);
    saveData(funds, updated, reconciliations, reminders, currency, notes, theme, isFirstLaunch);
  };

  const deleteTransaction = (id: string) => {
    const updated = transactions.filter((t) => t.id !== id);
    setTransactions(updated);
    saveData(funds, updated, reconciliations, reminders, currency, notes, theme, isFirstLaunch);
  };

  // Fund Actions
  const addFund = (name: string, color: string, icon: string) => {
    const newFund: Fund = {
      id: generateUUID(),
      name,
      color,
      icon,
      order: funds.length,
      archived: false,
      createdAt: new Date().toISOString(),
    };
    const updated = [...funds, newFund];
    setFunds(updated);
    saveData(updated, transactions, reconciliations, reminders, currency, notes, theme, isFirstLaunch);
  };

  const updateFund = (id: string, updates: Partial<Omit<Fund, 'id'>>) => {
    const updated = funds.map((f) => (f.id === id ? { ...f, ...updates } : f));
    setFunds(updated);
    saveData(updated, transactions, reconciliations, reminders, currency, notes, theme, isFirstLaunch);
  };

  const archiveFund = (id: string): boolean => {
    // Check if we have at least one OTHER active fund
    const activeFunds = funds.filter((f) => !f.archived && f.id !== id);
    if (activeFunds.length === 0) {
      return false; // Cannot archive the last active fund
    }
    const updated = funds.map((f) => (f.id === id ? { ...f, archived: true } : f));
    setFunds(updated);
    saveData(updated, transactions, reconciliations, reminders, currency, notes, theme, isFirstLaunch);
    return true;
  };

  const restoreFund = (id: string) => {
    const updated = funds.map((f) => (f.id === id ? { ...f, archived: false } : f));
    setFunds(updated);
    saveData(updated, transactions, reconciliations, reminders, currency, notes, theme, isFirstLaunch);
  };

  const reorderFunds = (reordered: Fund[]) => {
    const updated = reordered.map((f, index) => ({ ...f, order: index }));
    setFunds(updated);
    saveData(updated, transactions, reconciliations, reminders, currency, notes, theme, isFirstLaunch);
  };

  // Reconciliation Actions
  const addReconciliation = (
    actualBalance: number,
    calculatedBalance: number,
    difference: number,
    fundIdForAdjustment?: string,
    recNotes?: string
  ) => {
    const today = new Date().toISOString().split('T')[0];
    const recId = generateUUID();
    let adjAmount = 0;

    const updatedTransactions = [...transactions];

    // Create adjustment transaction if difference is non-zero and a fund is selected
    if (difference !== 0 && fundIdForAdjustment) {
      adjAmount = difference; // if difference is -350, it means calculated is 99100 and actual is 98750, so we need to SUBTRACT 350, hence -350 adjustment
      const adjTx: Transaction = {
        id: generateUUID(),
        type: 'adjustment',
        amount: adjAmount, // can be positive or negative
        date: today,
        notes: recNotes ? `Reconciliation: ${recNotes}` : 'Reconciliation Adjustment',
        fundId: fundIdForAdjustment,
        adjustmentType: adjAmount < 0 ? 'Correction Entry' : 'Correction Entry',
      };
      updatedTransactions.unshift(adjTx);
      setTransactions(updatedTransactions);
    }

    const newRec: ReconciliationRecord = {
      id: recId,
      date: today,
      actualBalance,
      calculatedBalance,
      difference,
      adjustmentAmount: adjAmount,
      notes: recNotes || 'Routine Reconciliation Check',
    };

    const updatedReconciliations = [newRec, ...reconciliations];
    setReconciliations(updatedReconciliations);
    saveData(funds, updatedTransactions, updatedReconciliations, reminders, currency, notes, theme, isFirstLaunch);
  };

  // Reminders Actions
  const addReminder = (rem: Omit<Reminder, 'id' | 'completed'>) => {
    const newRem: Reminder = {
      ...rem,
      id: generateUUID(),
      completed: false,
    };
    const updated = [...reminders, newRem];
    setReminders(updated);
    saveData(funds, transactions, reconciliations, updated, currency, notes, theme, isFirstLaunch);
  };

  const payReminder = (id: string) => {
    const reminder = reminders.find((r) => r.id === id);
    if (!reminder) return;

    // Create Expense transaction
    const expenseTx: Transaction = {
      id: generateUUID(),
      type: 'expense',
      amount: reminder.amount,
      date: new Date().toISOString().split('T')[0],
      notes: `Bill Paid: ${reminder.title}${reminder.notes ? ` (${reminder.notes})` : ''}`,
      fundId: reminder.fundId,
    };

    const updatedTransactions = [expenseTx, ...transactions];
    const updatedReminders = reminders.filter((r) => r.id !== id); // We delete reminder on pay (or can set completed: true, we'll delete it to keep it clean)
    
    setTransactions(updatedTransactions);
    setReminders(updatedReminders);
    saveData(funds, updatedTransactions, reconciliations, updatedReminders, currency, notes, theme, isFirstLaunch);
  };

  const deleteReminder = (id: string) => {
    const updated = reminders.filter((r) => r.id !== id);
    setReminders(updated);
    saveData(funds, transactions, reconciliations, updated, currency, notes, theme, isFirstLaunch);
  };

  // Miscellaneous Actions
  const updateNotes = (newNotes: string) => {
    setNotes(newNotes);
    saveData(funds, transactions, reconciliations, reminders, currency, newNotes, theme, isFirstLaunch);
  };

  const updateCurrency = (newCurrency: string) => {
    setCurrency(newCurrency);
    saveData(funds, transactions, reconciliations, reminders, newCurrency, notes, theme, isFirstLaunch);
  };

  const updateTheme = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    saveData(funds, transactions, reconciliations, reminders, currency, notes, newTheme, isFirstLaunch);
  };

  const resetData = () => {
    setFunds([]);
    setTransactions([]);
    setReconciliations([]);
    setReminders([]);
    setCurrency('₹');
    setNotes('');
    setTheme('system');
    setIsFirstLaunch(true);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  };

  const exportData = (): string => {
    const data: ExportData = {
      version: DATA_VERSION,
      funds,
      transactions,
      reconciliations,
      reminders,
      notes,
      currency,
      theme,
    };
    return JSON.stringify(data, null, 2);
  };

  const importData = (jsonString: string): { success: boolean; error?: string } => {
    try {
      const parsed = JSON.parse(jsonString);
      
      // Basic validation
      if (!parsed || typeof parsed !== 'object') {
        return { success: false, error: 'Invalid file format. Must be a JSON object.' };
      }
      
      if (parsed.version !== DATA_VERSION) {
        return { success: false, error: `Unsupported data version: ${parsed.version}. Expected version: ${DATA_VERSION}.` };
      }

      if (!Array.isArray(parsed.funds) || !Array.isArray(parsed.transactions)) {
        return { success: false, error: 'Missing critical fields: funds or transactions.' };
      }

      // Valid structure, update state
      setFunds(parsed.funds);
      setTransactions(parsed.transactions);
      setReconciliations(parsed.reconciliations || []);
      setReminders(parsed.reminders || []);
      setCurrency(parsed.currency || '₹');
      setNotes(parsed.notes || '');
      setTheme(parsed.theme || 'system');
      setIsFirstLaunch(false);

      // Save directly to localStorage
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(parsed));
      return { success: true };
    } catch (e) {
      return { success: false, error: 'Failed to parse JSON file. Ensure it is valid JSON.' };
    }
  };

  // Sync dark mode class with theme state
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      // System mode
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        if (mediaQuery.matches) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      };
      
      handleChange(); // initial execution
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  return (
    <FinanceContext.Provider
      value={{
        funds,
        transactions,
        reconciliations,
        reminders,
        currency,
        notes,
        theme,
        isFirstLaunch,
        fundBalances,
        currentAccountBalance,
        setupApp,
        addTransaction,
        editTransaction,
        deleteTransaction,
        addFund,
        updateFund,
        archiveFund,
        restoreFund,
        reorderFunds,
        addReconciliation,
        addReminder,
        payReminder,
        deleteReminder,
        updateNotes,
        updateCurrency,
        updateTheme,
        resetData,
        exportData,
        importData,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
