export type TransactionType = 'credit' | 'expense' | 'transfer' | 'adjustment';

export interface BaseTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  date: string;
  notes: string;
}

export interface CreditTransaction extends BaseTransaction {
  type: 'credit';
  fundId: string;
}

export interface ExpenseTransaction extends BaseTransaction {
  type: 'expense';
  fundId: string;
}

export interface TransferTransaction extends BaseTransaction {
  type: 'transfer';
  fundId: string; // source fund
  toFundId: string; // destination fund
}

export interface AdjustmentTransaction extends BaseTransaction {
  type: 'adjustment';
  fundId: string;
  adjustmentType: string; // 'Bank Charges' | 'Interest Credit' | 'Forgotten Expense' | 'Correction Entry' | 'Cash Deposit' | 'Other'
}

export type Transaction = CreditTransaction | ExpenseTransaction | TransferTransaction | AdjustmentTransaction;

export interface Fund {
  id: string;
  name: string;
  color: string; // hex pastel code
  icon: string; // lucide icon name
  order: number;
  archived: boolean;
  createdAt: string;
}

export interface ReconciliationRecord {
  id: string;
  date: string;
  actualBalance: number;
  calculatedBalance: number;
  difference: number;
  adjustmentAmount: number;
  notes: string;
}

export interface Reminder {
  id: string;
  title: string;
  amount: number;
  date: string;
  fundId: string;
  notes: string;
  completed: boolean;
}

export interface ExportData {
  version: number;
  funds: Fund[];
  transactions: Transaction[];
  reconciliations: ReconciliationRecord[];
  reminders: Reminder[];
  notes: string;
  currency: string;
  theme: 'light' | 'dark' | 'system';
}
