import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils/helpers';
import FundCard from './FundCard';
import { Card, Button, Input, Select } from './ui/Common';
import Dialog from './ui/Dialog';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import {
  TrendingUp,
  Plus,
  Scale,
  AlertCircle,
  Trash2,
  Check,
  FileText,
  Clock,
  HelpCircle,
} from 'lucide-react';

interface DashboardProps {
  onOpenTransactionModal: (type?: 'credit' | 'expense' | 'transfer', fundId?: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onOpenTransactionModal }) => {
  const {
    funds,
    transactions,
    fundBalances,
    currentAccountBalance,
    currency,
    notes,
    updateNotes,
    reminders,
    addReminder,
    payReminder,
    deleteReminder,
    addReconciliation,
  } = useFinance();

  // Reconcile Modal State
  const [isReconcileOpen, setIsReconcileOpen] = useState(false);
  const [actualBankBalance, setActualBankBalance] = useState('');
  const [reconcileNotes, setReconcileNotes] = useState('');
  const [selectedAdjustmentFund, setSelectedAdjustmentFund] = useState('');

  // Add Reminder Modal State
  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [reminderTitle, setReminderTitle] = useState('');
  const [reminderAmount, setReminderAmount] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [reminderFundId, setReminderFundId] = useState('');
  const [reminderNotes, setReminderNotes] = useState('');

  // Filter out archived funds for dashboard display
  const activeFunds = useMemo(() => {
    return funds.filter((f) => !f.archived).sort((a, b) => a.order - b.order);
  }, [funds]);

  // Set default fund for adjustment and reminder modals
  React.useEffect(() => {
    if (activeFunds.length > 0) {
      setSelectedAdjustmentFund(activeFunds[0].id);
      setReminderFundId(activeFunds[0].id);
    }
  }, [activeFunds]);

  // Compute monthly stats (Credits vs Expenses)
  const monthlyStats = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    let income = 0;
    let expenses = 0;

    transactions.forEach((t) => {
      const tDate = new Date(t.date);
      if (tDate.getFullYear() === year && tDate.getMonth() === month) {
        if (t.type === 'credit') {
          income += t.amount;
        } else if (t.type === 'expense') {
          expenses += t.amount;
        } else if (t.type === 'adjustment') {
          if (t.amount > 0) {
            income += t.amount;
          } else {
            expenses += Math.abs(t.amount);
          }
        }
      }
    });

    return {
      income,
      expenses,
      netChange: income - expenses,
    };
  }, [transactions]);

  // Recharts allocation data
  const chartData = useMemo(() => {
    return activeFunds
      .map((f) => ({
        name: f.name,
        value: fundBalances[f.id] || 0,
        color: f.color,
      }))
      .filter((d) => d.value > 0);
  }, [activeFunds, fundBalances]);

  // Reconcile Math
  const calculatedAppBalance = currentAccountBalance;
  const reconcileDiff = useMemo(() => {
    const bankVal = parseFloat(actualBankBalance) || 0;
    if (actualBankBalance === '') return 0;
    return parseFloat((bankVal - calculatedAppBalance).toFixed(2));
  }, [actualBankBalance, calculatedAppBalance]);

  const handleReconcileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const bankVal = parseFloat(actualBankBalance);
    if (isNaN(bankVal)) return;

    addReconciliation(
      bankVal,
      calculatedAppBalance,
      reconcileDiff,
      reconcileDiff !== 0 ? selectedAdjustmentFund : undefined,
      reconcileNotes
    );

    // Reset state & close
    setActualBankBalance('');
    setReconcileNotes('');
    setIsReconcileOpen(false);
  };

  const handleReminderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(reminderAmount);
    if (!reminderTitle || isNaN(amountVal) || !reminderDate || !reminderFundId) return;

    addReminder({
      title: reminderTitle,
      amount: amountVal,
      date: reminderDate,
      fundId: reminderFundId,
      notes: reminderNotes,
    });

    // Reset state & close
    setReminderTitle('');
    setReminderAmount('');
    setReminderDate('');
    setReminderNotes('');
    setIsReminderOpen(false);
  };

  // Recent activity logs (latest 5)
  const recentActivities = useMemo(() => {
    return transactions.slice(0, 5).map((t) => {
      let title = '';
      let fundName = '';
      
      if (t.type === 'credit') {
        const f = funds.find((fd) => fd.id === t.fundId);
        fundName = f ? f.name : 'Unknown Fund';
        title = `Credit to ${fundName}`;
      } else if (t.type === 'expense') {
        const f = funds.find((fd) => fd.id === t.fundId);
        fundName = f ? f.name : 'Unknown Fund';
        title = `Spent from ${fundName}`;
      } else if (t.type === 'transfer') {
        const fromF = funds.find((fd) => fd.id === t.fundId);
        const toF = funds.find((fd) => fd.id === t.toFundId);
        title = `Transfer: ${fromF?.name || 'Unknown'} → ${toF?.name || 'Unknown'}`;
      } else if (t.type === 'adjustment') {
        const f = funds.find((fd) => fd.id === t.fundId);
        title = `Adjustment in ${f?.name || 'Unknown'}`;
      }

      return {
        id: t.id,
        title,
        amount: t.amount,
        type: t.type,
        date: t.date,
        notes: t.notes,
      };
    });
  }, [transactions, funds]);

  return (
    <div className="flex flex-col gap-6 animate-enter">
      {/* Top Banner section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Welcome to your personal treasury.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsReconcileOpen(true)} className="cursor-pointer">
            <Scale className="h-4 w-4" />
            Reconcile Balance
          </Button>
          <Button variant="primary" size="sm" onClick={() => onOpenTransactionModal()} className="cursor-pointer">
            <Plus className="h-4 w-4" />
            Quick Transaction
          </Button>
        </div>
      </div>

      {/* Large Stats Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="md:col-span-2 border border-neutral-150/40 dark:border-neutral-800 shadow-xs flex flex-col justify-between p-6">
          <div>
            <span className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
              Current Account Balance
            </span>
            <div className="text-3xl font-extrabold text-neutral-950 dark:text-white tracking-tight mt-1.5">
              {formatCurrency(currentAccountBalance, currency)}
            </div>
          </div>
          <div className="text-xs text-neutral-400 dark:text-neutral-400 mt-6 border-t border-neutral-100 dark:border-neutral-850/60 pt-3">
            Sum of all active funds. Direct balance editing is disabled to ensure audit integrity.
          </div>
        </Card>

        <Card className="border border-neutral-150/40 dark:border-neutral-800 shadow-xs p-6">
          <span className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider flex items-center gap-1">
            Monthly Credits
          </span>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-500 mt-1.5">
            {formatCurrency(monthlyStats.income, currency)}
          </div>
          <span className="text-[10px] text-neutral-400 mt-2 block">For the current calendar month</span>
        </Card>

        <Card className="border border-neutral-150/40 dark:border-neutral-800 shadow-xs p-6">
          <span className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider flex items-center gap-1">
            Monthly Expenses
          </span>
          <div className="text-2xl font-bold text-rose-500 dark:text-rose-400 mt-1.5">
            {formatCurrency(monthlyStats.expenses, currency)}
          </div>
          <span className="text-[10px] text-neutral-400 mt-2 block">For the current calendar month</span>
        </Card>
      </div>

      {/* Net Change Alert */}
      <div
        className={`p-4 rounded-2xl flex items-center justify-between border ${
          monthlyStats.netChange >= 0
            ? 'bg-emerald-50/40 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-400'
            : 'bg-rose-50/40 dark:bg-rose-950/10 border-rose-100 dark:border-rose-900/30 text-rose-800 dark:text-rose-450'
        }`}
      >
        <div className="flex items-center gap-3">
          <TrendingUp className="h-5 w-5 shrink-0" />
          <div className="text-sm">
            <span className="font-semibold">Monthly Net Change:</span> You have{' '}
            <span className="font-bold">
              {monthlyStats.netChange >= 0 ? 'gained' : 'spent'} {formatCurrency(Math.abs(monthlyStats.netChange), currency)}
            </span>{' '}
            overall this month.
          </div>
        </div>
      </div>

      {/* Allocation bar & Pie Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Stacked Allocation Bar */}
        <Card className="lg:col-span-2 border border-neutral-150/40 dark:border-neutral-800 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-4">Allocation Overview</h2>
            
            {/* Visual stacked allocation bar */}
            <div className="w-full h-8 rounded-xl overflow-hidden flex bg-neutral-100 dark:bg-neutral-800 border border-neutral-150/20 dark:border-neutral-800 mb-6">
              {activeFunds.map((f) => {
                const bal = fundBalances[f.id] || 0;
                const pct = currentAccountBalance > 0 ? (bal / currentAccountBalance) * 100 : 0;
                if (pct <= 0) return null;
                return (
                  <div
                    key={f.id}
                    className="h-full first:rounded-l-xl last:rounded-r-xl transition-all duration-300 relative group cursor-pointer"
                    style={{ width: `${pct}%`, backgroundColor: f.color }}
                    title={`${f.name}: ${pct.toFixed(1)}% (${formatCurrency(bal, currency)})`}
                  >
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-neutral-900 text-white text-[10px] px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-md z-10">
                      {f.name}: {pct.toFixed(1)}%
                    </div>
                  </div>
                );
              })}
              {currentAccountBalance <= 0 && (
                <div className="w-full h-full flex items-center justify-center text-xs text-neutral-400 italic">
                  No funds allocated (Account balance is {currency}0)
                </div>
              )}
            </div>

            {/* List with color indicators */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {activeFunds.map((f) => {
                const bal = fundBalances[f.id] || 0;
                const pct = currentAccountBalance > 0 ? (bal / currentAccountBalance) * 100 : 0;
                return (
                  <div key={f.id} className="flex items-center gap-2.5">
                    <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: f.color }} />
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-300 leading-tight">{f.name}</span>
                      <span className="text-[10px] text-neutral-400 dark:text-neutral-400">{pct.toFixed(1)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="text-xs text-neutral-400 italic mt-6 border-t border-neutral-100 dark:border-neutral-850/60 pt-3">
            Tip: Hover over the segments of the allocation bar to see quick breakdowns.
          </div>
        </Card>

        {/* Right: Pie Chart */}
        <Card className="border border-neutral-150/40 dark:border-neutral-800 shadow-xs flex flex-col items-center justify-center p-6 min-h-[260px]">
          <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 self-start mb-2">Fund Distribution</h2>
          {chartData.length > 0 ? (
            <div className="w-full h-44 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    formatter={(value: any) => [formatCurrency(value, currency), 'Balance']}
                    contentStyle={{
                      backgroundColor: 'rgba(30, 30, 30, 0.9)',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '11px',
                    }}
                  />
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide leading-none">Total</span>
                <span className="text-sm font-bold text-neutral-900 dark:text-white mt-1">
                  {formatCurrency(currentAccountBalance, currency)}
                </span>
              </div>
            </div>
          ) : (
            <div className="h-44 w-full flex flex-col items-center justify-center text-xs text-neutral-400 italic gap-1">
              <HelpCircle className="h-6 w-6 text-neutral-300" />
              No positive balances to plot
            </div>
          )}
        </Card>
      </div>

      {/* Fund Cards Section */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-4">Allocated Funds</h2>
        {activeFunds.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {activeFunds.map((fund) => (
              <FundCard
                key={fund.id}
                fund={fund}
                balance={fundBalances[fund.id] || 0}
                transactions={transactions}
                totalAccountBalance={currentAccountBalance}
                currency={currency}
                onQuickAction={onOpenTransactionModal}
              />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800">
            <span className="text-sm text-neutral-400">No active funds found. Create one in Settings.</span>
          </div>
        )}
      </div>

      {/* Budgets Overview Widget */}
      {funds.some((f) => !f.archived && f.budget && f.budget > 0) && (
        <Card className="border border-neutral-150/40 dark:border-neutral-800 shadow-xs p-6">
          <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-4">Monthly Budgets Utilization</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {funds
              .filter((f) => !f.archived && f.budget && f.budget > 0)
              .map((f) => {
                const now = new Date();
                const year = now.getFullYear();
                const month = now.getMonth();
                const spent = transactions
                  .filter((t) => {
                    if ((t as any).fundId !== f.id) return false;
                    const tDate = new Date(t.date);
                    return (
                      tDate.getFullYear() === year &&
                      tDate.getMonth() === month &&
                      (t.type === 'expense' || (t.type === 'adjustment' && t.amount < 0))
                    );
                  })
                  .reduce((sum, t) => sum + Math.abs(t.amount), 0);

                const pct = f.budget ? (spent / f.budget) * 100 : 0;
                const isOver = f.budget ? spent > f.budget : false;

                return (
                  <div key={f.id} className="p-4 rounded-xl border border-neutral-100 dark:border-neutral-850 bg-neutral-50/20 dark:bg-neutral-900/10 flex flex-col gap-2.5">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-sm text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: f.color }} />
                        {f.name}
                      </span>
                      <span className={`text-xs font-bold ${isOver ? 'text-rose-500' : 'text-neutral-550 dark:text-neutral-400'}`}>
                        {pct.toFixed(0)}%
                      </span>
                    </div>

                    <div className="w-full bg-neutral-150 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isOver ? 'bg-rose-500' : pct >= 75 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[10px] text-neutral-400 dark:text-neutral-400">
                      <span>Spent: {formatCurrency(spent, currency)}</span>
                      <span>Budget: {formatCurrency(f.budget || 0, currency)}</span>
                    </div>
                  </div>
                );
              })}
          </div>
        </Card>
      )}

      {/* Grid for Reminders, Notes, and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 1. Upcoming Expenses / Reminders */}
        <Card className="border border-neutral-150/40 dark:border-neutral-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Upcoming Reminders</h2>
              <Button size="sm" variant="ghost" onClick={() => setIsReminderOpen(true)} className="p-1.5 rounded-lg cursor-pointer">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-col gap-3 max-h-[240px] overflow-y-auto pr-1">
              {reminders.length > 0 ? (
                reminders.map((rem) => {
                  const fund = funds.find((f) => f.id === rem.fundId);
                  return (
                    <div
                      key={rem.id}
                      className="p-3 rounded-xl border border-neutral-100 dark:border-neutral-850 flex items-center justify-between gap-3 bg-neutral-50/40 dark:bg-neutral-900/30"
                    >
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                          {rem.title}
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px] text-neutral-400">
                          <Clock className="h-3 w-3 shrink-0" />
                          <span>{rem.date}</span>
                          <span>•</span>
                          <span className="truncate" style={{ color: fund?.color }}>{fund?.name || 'Unknown'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-bold text-neutral-900 dark:text-white">
                          {formatCurrency(rem.amount, currency)}
                        </span>
                        <button
                          onClick={() => payReminder(rem.id)}
                          className="p-1 rounded-md bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 cursor-pointer"
                          title="Mark as Paid"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => deleteReminder(rem.id)}
                          className="p-1 rounded-md bg-rose-50 dark:bg-rose-950/30 text-rose-500 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/60 cursor-pointer"
                          title="Delete Reminder"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-xs text-neutral-400 italic">
                  No upcoming reminders. Add one!
                </div>
              )}
            </div>
          </div>
          <div className="text-[10px] text-neutral-400 mt-4 border-t border-neutral-100 dark:border-neutral-850/60 pt-2 flex items-center gap-1">
            <AlertCircle className="h-3.5 w-3.5" />
            "Mark as Paid" creates a corresponding expense in the selected fund.
          </div>
        </Card>

        {/* 2. Dashboard Notes Widget */}
        <Card className="border border-neutral-150/40 dark:border-neutral-800 shadow-xs flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-4 w-4 text-neutral-400" />
            <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Notes Notepad</h2>
          </div>
          <textarea
            className="w-full flex-grow min-h-[140px] lg:min-h-0 bg-neutral-50/30 dark:bg-neutral-900/20 border border-neutral-100 dark:border-neutral-850/80 rounded-xl p-3.5 text-xs text-neutral-700 dark:text-neutral-300 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-200 dark:focus:ring-neutral-800 resize-none font-mono"
            placeholder="Jot down quick reminders, savings goals, or notes here. Persists automatically."
            value={notes}
            onChange={(e) => updateNotes(e.target.value)}
          />
          <span className="text-[9px] text-neutral-400 mt-2 text-right">Auto-saved to localStorage</span>
        </Card>

        {/* 3. Recent Activity */}
        <Card className="border border-neutral-150/40 dark:border-neutral-800 shadow-xs">
          <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-4">Recent Activity</h2>
          <div className="flex flex-col gap-3">
            {recentActivities.length > 0 ? (
              recentActivities.map((act) => {
                const isPositive =
                  act.type === 'credit' || (act.type === 'adjustment' && act.amount > 0);
                const isTransfer = act.type === 'transfer';
                
                return (
                  <div key={act.id} className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-850/40 pb-2.5 last:border-0 last:pb-0">
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                        {act.title}
                      </span>
                      <span className="text-[10px] text-neutral-400 truncate">
                        {act.notes || 'No description'}
                      </span>
                    </div>
                    <div className="flex flex-col items-end shrink-0 pl-2">
                      <span
                        className={`text-xs font-bold ${
                          isTransfer
                            ? 'text-blue-500'
                            : isPositive
                            ? 'text-emerald-600 dark:text-emerald-500'
                            : 'text-rose-500 dark:text-rose-400'
                        }`}
                      >
                        {isTransfer ? '' : isPositive ? '+' : '-'}
                        {formatCurrency(Math.abs(act.amount), currency)}
                      </span>
                      <span className="text-[9px] text-neutral-400 mt-0.5">{act.date}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-xs text-neutral-400 italic">
                No recent transactions. Add one to start tracking!
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* ========================================== */}
      {/* MODALS / DIALOGS SECTION                    */}
      {/* ========================================== */}

      {/* 1. Reconcile Balance Modal */}
      <Dialog isOpen={isReconcileOpen} onClose={() => setIsReconcileOpen(false)} title="Reconcile Account Balance">
        <form onSubmit={handleReconcileSubmit} className="flex flex-col gap-4">
          <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-normal">
            Compare your actual bank statement balance against the app's calculated balance. If they differ, you can generate an audit correction adjustment.
          </p>

          <div className="grid grid-cols-2 gap-4 bg-neutral-50 dark:bg-neutral-900/40 p-4 rounded-xl border border-neutral-100 dark:border-neutral-850">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Calculated App</span>
              <span className="text-sm font-bold text-neutral-800 dark:text-white mt-1">
                {formatCurrency(calculatedAppBalance, currency)}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Discrepancy Difference</span>
              <span
                className={`text-sm font-bold mt-1 ${
                  reconcileDiff === 0
                    ? 'text-neutral-500'
                    : reconcileDiff > 0
                    ? 'text-emerald-600 dark:text-emerald-500'
                    : 'text-rose-500 dark:text-rose-400'
                }`}
              >
                {reconcileDiff > 0 ? '+' : ''}
                {formatCurrency(reconcileDiff, currency)}
              </span>
            </div>
          </div>

          <Input
            type="number"
            step="any"
            label="Actual Bank Statement Balance"
            placeholder="Enter exact bank balance"
            value={actualBankBalance}
            onChange={(e) => setActualBankBalance(e.target.value)}
            required
          />

          {reconcileDiff !== 0 && (
            <div className="p-4 rounded-xl border border-amber-100 dark:border-amber-900/30 bg-amber-50/20 dark:bg-amber-950/10 flex flex-col gap-4">
              <div className="flex gap-2">
                <AlertCircle className="h-4.5 w-4.5 text-amber-505 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800 dark:text-amber-400 leading-normal">
                  <span className="font-bold">Audit Adjustment Required:</span> A correction of{' '}
                  <span className="font-extrabold">
                    {reconcileDiff > 0 ? '+' : ''}
                    {formatCurrency(reconcileDiff, currency)}
                  </span>{' '}
                  will be recorded to align the balances.
                </div>
              </div>

              <Select
                label="Apply Adjustment Correction To"
                options={activeFunds.map((f) => ({ value: f.id, label: f.name }))}
                value={selectedAdjustmentFund}
                onChange={(e) => setSelectedAdjustmentFund(e.target.value)}
                required
              />
            </div>
          )}

          <Input
            label="Audit Notes / Remarks"
            placeholder="e.g. Bank charges check, statement sync"
            value={reconcileNotes}
            onChange={(e) => setReconcileNotes(e.target.value)}
          />

          <div className="flex justify-end gap-3 border-t border-neutral-100 dark:border-neutral-850/60 pt-4 mt-2">
            <Button type="button" variant="secondary" onClick={() => setIsReconcileOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={actualBankBalance === ''}>
              {reconcileDiff === 0 ? 'Conclude Reconcile' : 'Create Adjustment Transaction'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* 2. Add Reminder Modal */}
      <Dialog isOpen={isReminderOpen} onClose={() => setIsReminderOpen(false)} title="Schedule Upcoming Expense Reminder">
        <form onSubmit={handleReminderSubmit} className="flex flex-col gap-4">
          <Input
            label="Reminder Name / Bill"
            placeholder="e.g. Electric Bill, Office Rent"
            value={reminderTitle}
            onChange={(e) => setReminderTitle(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              type="number"
              min="0"
              step="any"
              label="Expected Amount"
              placeholder="0.00"
              value={reminderAmount}
              onChange={(e) => setReminderAmount(e.target.value)}
              required
            />
            <Input
              type="date"
              label="Due Date"
              value={reminderDate}
              onChange={(e) => setReminderDate(e.target.value)}
              required
            />
          </div>

          <Select
            label="Target Account/Fund"
            options={activeFunds.map((f) => ({ value: f.id, label: f.name }))}
            value={reminderFundId}
            onChange={(e) => setReminderFundId(e.target.value)}
            required
          />

          <Input
            label="Quick notes"
            placeholder="Add invoice info or details"
            value={reminderNotes}
            onChange={(e) => setReminderNotes(e.target.value)}
          />

          <div className="flex justify-end gap-3 border-t border-neutral-100 dark:border-neutral-850/60 pt-4 mt-2">
            <Button type="button" variant="secondary" onClick={() => setIsReminderOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Add Reminder
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
export default Dashboard;
