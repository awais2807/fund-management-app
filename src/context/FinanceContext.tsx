import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { Fund, Transaction, ReconciliationRecord, Reminder, RecurringTransaction, ExportData } from '../types';
import { getValue, setValue } from '../utils/db';

interface FinanceContextType {
  funds: Fund[];
  transactions: Transaction[];
  reconciliations: ReconciliationRecord[];
  reminders: Reminder[];
  recurringTransactions: RecurringTransaction[];
  currency: string;
  notes: string;
  theme: 'light' | 'dark' | 'system';
  isFirstLaunch: boolean;
  isLoading: boolean;
  fundBalances: Record<string, number>;
  currentAccountBalance: number;
  setupApp: (currency: string, initialBalances: Record<string, number>) => void;
  addTransaction: (tx: Omit<Transaction, 'id'>) => void;
  editTransaction: (id: string, tx: Omit<Transaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;
  addFund: (name: string, color: string, icon: string, budget?: number) => void;
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
  addRecurringTransaction: (recurring: Omit<RecurringTransaction, 'id' | 'nextDate' | 'active'>) => void;
  deleteRecurringTransaction: (id: string) => void;
  toggleRecurringTransaction: (id: string) => void;
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

export const CATEGORIES = [
  'Food & Dining',
  'Utilities & Bills',
  'Entertainment',
  'Shopping',
  'Housing & Rent',
  'Travel & Transit',
  'Healthcare',
  'Salary & Income',
  'Other',
];

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

export const advanceDate = (dateStr: string, frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'): string => {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  switch (frequency) {
    case 'daily':
      date.setDate(date.getDate() + 1);
      break;
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'yearly':
      date.setFullYear(date.getFullYear() + 1);
      break;
  }
  return date.toISOString().split('T')[0];
};

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [funds, setFunds] = useState<Fund[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [reconciliations, setReconciliations] = useState<ReconciliationRecord[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [currency, setCurrency] = useState<string>('₹');
  const [notes, setNotes] = useState<string>('');
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load data from IndexedDB (with LocalStorage migration fallback)
  useEffect(() => {
    const loadData = async () => {
      try {
        let data = await getValue<ExportData>('finance_data');

        // Migration logic
        if (!data) {
          const rawLocal = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (rawLocal) {
            try {
              const parsed = JSON.parse(rawLocal) as ExportData;
              if (parsed && parsed.version === DATA_VERSION) {
                data = parsed;
                await setValue('finance_data', parsed);
                localStorage.removeItem(LOCAL_STORAGE_KEY); // Clean up
                console.log('Successfully migrated from LocalStorage to IndexedDB');
              }
            } catch (e) {
              console.error('LocalStorage migration failed:', e);
            }
          }
        }

        if (data) {
          let updatedTransactions = [...(data.transactions || [])];
          let updatedRecurring = [...(data.recurringTransactions || [])];
          let scheduleModified = false;
          const currentDateStr = new Date().toISOString().split('T')[0];

          // Recurring Transactions Engine execution loop
          updatedRecurring = updatedRecurring.map((rec) => {
            if (!rec.active) return rec;

            let nextDate = rec.nextDate;
            let recurringModified = false;
            const newTxs: Transaction[] = [];

            while (nextDate <= currentDateStr) {
              const tx: Transaction = {
                id: generateUUID(),
                type: rec.type,
                amount: rec.amount,
                date: nextDate,
                notes: `Recurring: ${rec.title}${rec.notes ? ` (${rec.notes})` : ''}`,
                fundId: rec.fundId,
                category: rec.category,
              };
              newTxs.push(tx);
              nextDate = advanceDate(nextDate, rec.frequency);
              recurringModified = true;
            }

            if (recurringModified) {
              updatedTransactions = [...newTxs, ...updatedTransactions];
              scheduleModified = true;
              return { ...rec, nextDate };
            }
            return rec;
          });

          setFunds(data.funds || []);
          setTransactions(updatedTransactions);
          setReconciliations(data.reconciliations || []);
          setReminders(data.reminders || []);
          setRecurringTransactions(updatedRecurring);
          setCurrency(data.currency || '₹');
          setNotes(data.notes || '');
          setTheme(data.theme || 'system');
          setIsFirstLaunch(false);

          // Save back if recurring engine ran
          if (scheduleModified) {
            const updatedData: ExportData = {
              version: DATA_VERSION,
              funds: data.funds || [],
              transactions: updatedTransactions,
              reconciliations: data.reconciliations || [],
              reminders: data.reminders || [],
              notes: data.notes || '',
              currency: data.currency || '₹',
              theme: data.theme || 'system',
              recurringTransactions: updatedRecurring,
            };
            await setValue('finance_data', updatedData);
          }
        } else {
          setIsFirstLaunch(true);
        }
      } catch (err) {
        console.error('Error opening IndexedDB:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const saveData = async (
    updatedFunds: Fund[],
    updatedTransactions: Transaction[],
    updatedReconciliations: ReconciliationRecord[],
    updatedReminders: Reminder[],
    updatedCurrency: string,
    updatedNotes: string,
    updatedTheme: 'light' | 'dark' | 'system',
    updatedRecurring: RecurringTransaction[],
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
      recurringTransactions: updatedRecurring,
    };
    try {
      await setValue('finance_data', dataToSave);
    } catch (e) {
      console.error('Failed to save state to IndexedDB:', e);
    }
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
  const setupApp = async (selectedCurrency: string, initialBalances: Record<string, number>) => {
    const today = new Date().toISOString().split('T')[0];

    const defaultFunds: Fund[] = [
      {
        id: generateUUID(),
        name: 'Project Fund',
        color: '#BAD7E9',
        icon: 'Briefcase',
        order: 0,
        archived: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: generateUUID(),
        name: 'Home Fund',
        color: '#C1E1C1',
        icon: 'Home',
        order: 1,
        archived: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: generateUUID(),
        name: 'Personal Fund',
        color: '#FFD1B3',
        icon: 'User',
        order: 2,
        archived: false,
        createdAt: new Date().toISOString(),
      },
    ];

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
          category: 'Salary & Income',
        });
      }
    });

    setFunds(defaultFunds);
    setTransactions(initialTransactions);
    setCurrency(selectedCurrency);
    setIsFirstLaunch(false);

    const dataToSave: ExportData = {
      version: DATA_VERSION,
      funds: defaultFunds,
      transactions: initialTransactions,
      reconciliations: [],
      reminders: [],
      notes: '',
      currency: selectedCurrency,
      theme,
      recurringTransactions: [],
    };
    await setValue('finance_data', dataToSave);
  };

  // Transaction Actions
  const addTransaction = (tx: Omit<Transaction, 'id'>) => {
    const newTx = { ...tx, id: generateUUID() } as Transaction;
    const updated = [newTx, ...transactions];
    setTransactions(updated);
    saveData(funds, updated, reconciliations, reminders, currency, notes, theme, recurringTransactions, isFirstLaunch);
  };

  const editTransaction = (id: string, updatedTx: Omit<Transaction, 'id'>) => {
    const updated = transactions.map((t) => (t.id === id ? ({ ...updatedTx, id } as Transaction) : t));
    setTransactions(updated);
    saveData(funds, updated, reconciliations, reminders, currency, notes, theme, recurringTransactions, isFirstLaunch);
  };

  const deleteTransaction = (id: string) => {
    const updated = transactions.filter((t) => t.id !== id);
    setTransactions(updated);
    saveData(funds, updated, reconciliations, reminders, currency, notes, theme, recurringTransactions, isFirstLaunch);
  };

  // Fund Actions
  const addFund = (name: string, color: string, icon: string, budget?: number) => {
    const newFund: Fund = {
      id: generateUUID(),
      name,
      color,
      icon,
      order: funds.length,
      archived: false,
      createdAt: new Date().toISOString(),
      budget,
    };
    const updated = [...funds, newFund];
    setFunds(updated);
    saveData(updated, transactions, reconciliations, reminders, currency, notes, theme, recurringTransactions, isFirstLaunch);
  };

  const updateFund = (id: string, updates: Partial<Omit<Fund, 'id'>>) => {
    const updated = funds.map((f) => (f.id === id ? { ...f, ...updates } : f));
    setFunds(updated);
    saveData(updated, transactions, reconciliations, reminders, currency, notes, theme, recurringTransactions, isFirstLaunch);
  };

  const archiveFund = (id: string): boolean => {
    const activeFunds = funds.filter((f) => !f.archived && f.id !== id);
    if (activeFunds.length === 0) {
      return false;
    }
    const updated = funds.map((f) => (f.id === id ? { ...f, archived: true } : f));
    setFunds(updated);
    saveData(updated, transactions, reconciliations, reminders, currency, notes, theme, recurringTransactions, isFirstLaunch);
    return true;
  };

  const restoreFund = (id: string) => {
    const updated = funds.map((f) => (f.id === id ? { ...f, archived: false } : f));
    setFunds(updated);
    saveData(updated, transactions, reconciliations, reminders, currency, notes, theme, recurringTransactions, isFirstLaunch);
  };

  const reorderFunds = (reordered: Fund[]) => {
    const updated = reordered.map((f, index) => ({ ...f, order: index }));
    setFunds(updated);
    saveData(updated, transactions, reconciliations, reminders, currency, notes, theme, recurringTransactions, isFirstLaunch);
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

    if (difference !== 0 && fundIdForAdjustment) {
      adjAmount = difference;
      const adjTx: Transaction = {
        id: generateUUID(),
        type: 'adjustment',
        amount: adjAmount,
        date: today,
        notes: recNotes ? `Reconciliation: ${recNotes}` : 'Reconciliation Adjustment',
        fundId: fundIdForAdjustment,
        adjustmentType: 'Correction Entry',
        category: 'Other',
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
    saveData(funds, updatedTransactions, updatedReconciliations, reminders, currency, notes, theme, recurringTransactions, isFirstLaunch);
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
    saveData(funds, transactions, reconciliations, updated, currency, notes, theme, recurringTransactions, isFirstLaunch);
  };

  const payReminder = (id: string) => {
    const reminder = reminders.find((r) => r.id === id);
    if (!reminder) return;

    const expenseTx: Transaction = {
      id: generateUUID(),
      type: 'expense',
      amount: reminder.amount,
      date: new Date().toISOString().split('T')[0],
      notes: `Bill Paid: ${reminder.title}${reminder.notes ? ` (${reminder.notes})` : ''}`,
      fundId: reminder.fundId,
      category: 'Utilities & Bills',
    };

    const updatedTransactions = [expenseTx, ...transactions];
    const updatedReminders = reminders.filter((r) => r.id !== id);

    setTransactions(updatedTransactions);
    setReminders(updatedReminders);
    saveData(funds, updatedTransactions, reconciliations, updatedReminders, currency, notes, theme, recurringTransactions, isFirstLaunch);
  };

  const deleteReminder = (id: string) => {
    const updated = reminders.filter((r) => r.id !== id);
    setReminders(updated);
    saveData(funds, transactions, reconciliations, updated, currency, notes, theme, recurringTransactions, isFirstLaunch);
  };

  // Recurring Transactions Actions
  const addRecurringTransaction = (rec: Omit<RecurringTransaction, 'id' | 'nextDate' | 'active'>) => {
    const newRec: RecurringTransaction = {
      ...rec,
      id: generateUUID(),
      nextDate: rec.startDate,
      active: true,
    };
    const updated = [...recurringTransactions, newRec];
    setRecurringTransactions(updated);
    saveData(funds, transactions, reconciliations, reminders, currency, notes, theme, updated, isFirstLaunch);
  };

  const deleteRecurringTransaction = (id: string) => {
    const updated = recurringTransactions.filter((r) => r.id !== id);
    setRecurringTransactions(updated);
    saveData(funds, transactions, reconciliations, reminders, currency, notes, theme, updated, isFirstLaunch);
  };

  const toggleRecurringTransaction = (id: string) => {
    const updated = recurringTransactions.map((r) =>
      r.id === id ? { ...r, active: !r.active } : r
    );
    setRecurringTransactions(updated);
    saveData(funds, transactions, reconciliations, reminders, currency, notes, theme, updated, isFirstLaunch);
  };

  // Miscellaneous Actions
  const updateNotes = (newNotes: string) => {
    setNotes(newNotes);
    saveData(funds, transactions, reconciliations, reminders, currency, newNotes, theme, recurringTransactions, isFirstLaunch);
  };

  const updateCurrency = (newCurrency: string) => {
    setCurrency(newCurrency);
    saveData(funds, transactions, reconciliations, reminders, newCurrency, notes, theme, recurringTransactions, isFirstLaunch);
  };

  const updateTheme = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    saveData(funds, transactions, reconciliations, reminders, currency, notes, newTheme, recurringTransactions, isFirstLaunch);
  };

  const resetData = async () => {
    setFunds([]);
    setTransactions([]);
    setReconciliations([]);
    setReminders([]);
    setRecurringTransactions([]);
    setCurrency('₹');
    setNotes('');
    setTheme('system');
    setIsFirstLaunch(true);
    try {
      await setValue('finance_data', null);
    } catch (e) {
      console.error('Failed to clear IndexedDB:', e);
    }
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
      recurringTransactions,
    };
    return JSON.stringify(data, null, 2);
  };

  const importData = (jsonString: string): { success: boolean; error?: string } => {
    try {
      const parsed = JSON.parse(jsonString);

      if (!parsed || typeof parsed !== 'object') {
        return { success: false, error: 'Invalid file format. Must be a JSON object.' };
      }

      if (parsed.version !== DATA_VERSION) {
        return { success: false, error: `Unsupported data version: ${parsed.version}. Expected version: ${DATA_VERSION}.` };
      }

      if (!Array.isArray(parsed.funds) || !Array.isArray(parsed.transactions)) {
        return { success: false, error: 'Missing critical fields: funds or transactions.' };
      }

      setFunds(parsed.funds);
      setTransactions(parsed.transactions);
      setReconciliations(parsed.reconciliations || []);
      setReminders(parsed.reminders || []);
      setRecurringTransactions(parsed.recurringTransactions || []);
      setCurrency(parsed.currency || '₹');
      setNotes(parsed.notes || '');
      setTheme(parsed.theme || 'system');
      setIsFirstLaunch(false);

      // Save directly to IndexedDB
      setValue('finance_data', parsed);
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
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        if (mediaQuery.matches) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      };

      handleChange();
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
        recurringTransactions,
        currency,
        notes,
        theme,
        isFirstLaunch,
        isLoading,
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
        addRecurringTransaction,
        deleteRecurringTransaction,
        toggleRecurringTransaction,
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
