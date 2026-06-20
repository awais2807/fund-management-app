import React from 'react';
import type { Fund, Transaction } from '../types';
import { formatCurrency, fundIcons, getPastelStyles } from '../utils/helpers';
import { Card, Button } from './ui/Common';
import { ArrowUpRight, ArrowDownRight, ArrowLeftRight, Briefcase } from 'lucide-react';

interface FundCardProps {
  fund: Fund;
  balance: number;
  transactions: Transaction[];
  totalAccountBalance: number;
  currency: string;
  onQuickAction: (actionType: 'credit' | 'expense' | 'transfer', fundId: string) => void;
}

export const FundCard: React.FC<FundCardProps> = ({
  fund,
  balance,
  transactions,
  totalAccountBalance,
  currency,
  onQuickAction,
}) => {
  // Calculate specific fund credits/expenses (literal type 'credit' / 'expense')
  const totalCredits = React.useMemo(() => {
    return transactions
      .filter((t) => t.type === 'credit' && (t as any).fundId === fund.id)
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions, fund.id]);

  const totalExpenses = React.useMemo(() => {
    return transactions
      .filter((t) => t.type === 'expense' && (t as any).fundId === fund.id)
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions, fund.id]);

  const currentMonthExpenses = React.useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    return transactions
      .filter((t) => {
        if ((t as any).fundId !== fund.id) return false;
        const tDate = new Date(t.date);
        return (
          tDate.getFullYear() === year &&
          tDate.getMonth() === month &&
          (t.type === 'expense' || (t.type === 'adjustment' && t.amount < 0))
        );
      })
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  }, [transactions, fund.id]);

  // Calculate percentage of total account balance
  const allocationPercentage = React.useMemo(() => {
    if (totalAccountBalance <= 0) return 0;
    const pct = (balance / totalAccountBalance) * 100;
    return Math.max(0, parseFloat(pct.toFixed(1)));
  }, [balance, totalAccountBalance]);

  const IconComponent = fundIcons[fund.icon] || Briefcase;
  const pastelStyle = getPastelStyles(fund.color);

  return (
    <Card className="hover:shadow-md transition-shadow duration-200 flex flex-col justify-between group h-full">
      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center border transition-all duration-200"
              style={pastelStyle}
            >
              <IconComponent className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-neutral-850 dark:text-neutral-100 group-hover:text-neutral-950 dark:group-hover:text-white transition-colors duration-150">
                {fund.name}
              </h3>
              <span className="text-[10px] font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                {allocationPercentage}% of total
              </span>
            </div>
          </div>
          {fund.archived && (
            <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-450 dark:text-neutral-500 uppercase tracking-wide">
              Archived
            </span>
          )}
        </div>

        {/* Balance */}
        <div className="mb-4">
          <span className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
            {formatCurrency(balance, currency)}
          </span>
        </div>

        {/* Small stats */}
        <div className="grid grid-cols-2 gap-3 mb-6 border-t border-neutral-100 dark:border-neutral-850/60 pt-3 text-xs">
          <div className="flex flex-col">
            <span className="text-neutral-400 font-medium">Credits</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-500 flex items-center gap-0.5 mt-0.5">
              <ArrowUpRight className="h-3 w-3 shrink-0" />
              {formatCurrency(totalCredits, currency)}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-neutral-400 font-medium">Expenses</span>
            <span className="font-semibold text-rose-500 dark:text-rose-400 flex items-center gap-0.5 mt-0.5">
              <ArrowDownRight className="h-3 w-3 shrink-0" />
              {formatCurrency(totalExpenses, currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Allocation Progress Bar */}
      <div className="mb-5 flex flex-col gap-1">
        <div className="flex justify-between items-center text-[9px] font-semibold text-neutral-400 dark:text-neutral-500">
          <span>Allocation of Treasury</span>
          <span>{allocationPercentage}%</span>
        </div>
        <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${allocationPercentage}%`, backgroundColor: fund.color }}
          />
        </div>
      </div>

      {/* Budget Progress Bar (If configured) */}
      {fund.budget && fund.budget > 0 ? (
        <div className="mb-5 flex flex-col gap-1">
          <div className="flex justify-between items-center text-[9px] font-semibold">
            <span className="text-neutral-400 dark:text-neutral-500">Monthly Budget Spent</span>
            <span className={currentMonthExpenses > fund.budget ? 'text-rose-500 font-bold' : 'text-neutral-500 dark:text-neutral-400'}>
              {formatCurrency(currentMonthExpenses, currency)} / {formatCurrency(fund.budget, currency)}
            </span>
          </div>
          <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                currentMonthExpenses >= fund.budget
                  ? 'bg-rose-500'
                  : currentMonthExpenses >= fund.budget * 0.75
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, (currentMonthExpenses / fund.budget) * 100)}%` }}
            />
          </div>
        </div>
      ) : null}

      {/* Actions */}
      <div className="grid grid-cols-3 gap-2 mt-auto shrink-0">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => onQuickAction('credit', fund.id)}
          disabled={fund.archived}
          className="py-1.5 px-0 text-[11px] justify-center cursor-pointer disabled:cursor-not-allowed"
          title="Add Credit"
        >
          <ArrowUpRight className="h-3.5 w-3.5" />
          Credit
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => onQuickAction('expense', fund.id)}
          disabled={fund.archived}
          className="py-1.5 px-0 text-[11px] justify-center cursor-pointer disabled:cursor-not-allowed"
          title="Add Expense"
        >
          <ArrowDownRight className="h-3.5 w-3.5" />
          Expense
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => onQuickAction('transfer', fund.id)}
          disabled={fund.archived}
          className="py-1.5 px-0 text-[11px] justify-center cursor-pointer disabled:cursor-not-allowed col-span-1"
          title="Transfer Money"
        >
          <ArrowLeftRight className="h-3.5 w-3.5" />
          Transfer
        </Button>
      </div>
    </Card>
  );
};
export default FundCard;
