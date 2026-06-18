import React, { useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils/helpers';
import { Card } from './ui/Common';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Calendar, ArrowUpRight, ArrowDownRight, HelpCircle } from 'lucide-react';

export const Analytics: React.FC = () => {
  const { funds, transactions, fundBalances, currency } = useFinance();

  const activeFunds = useMemo(() => {
    return funds.filter((f) => !f.archived).sort((a, b) => a.order - b.order);
  }, [funds]);

  // Current date parameters
  const currentMonthLabel = useMemo(() => {
    return new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  }, []);

  // 1. Last 6 Months Income vs Expenses data
  const historicalData = useMemo(() => {
    const result: {
      year: number;
      month: number;
      name: string;
      income: number;
      expenses: number;
      spending: number;
    }[] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth();
      const monthLabel = d.toLocaleString('default', { month: 'short' });

      result.push({
        year,
        month,
        name: monthLabel,
        income: 0,
        expenses: 0,
        spending: 0,
      });
    }

    transactions.forEach((t) => {
      const tDate = new Date(t.date);
      const tYear = tDate.getFullYear();
      const tMonth = tDate.getMonth();

      const monthObj = result.find((r) => r.year === tYear && r.month === tMonth);
      if (monthObj) {
        if (t.type === 'credit') {
          monthObj.income += t.amount;
        } else if (t.type === 'expense') {
          monthObj.expenses += t.amount;
          monthObj.spending += t.amount;
        } else if (t.type === 'adjustment') {
          if (t.amount > 0) {
            monthObj.income += t.amount;
          } else {
            monthObj.expenses += Math.abs(t.amount);
            monthObj.spending += Math.abs(t.amount);
          }
        }
      }
    });

    return result;
  }, [transactions]);

  // 2. Fund Allocation Chart data (Balances comparison)
  const fundAllocationData = useMemo(() => {
    return activeFunds.map((f) => ({
      name: f.name,
      Balance: fundBalances[f.id] || 0,
      color: f.color,
    }));
  }, [activeFunds, fundBalances]);

  // 3. Pie chart data
  const pieData = useMemo(() => {
    return activeFunds
      .map((f) => ({
        name: f.name,
        value: fundBalances[f.id] || 0,
        color: f.color,
      }))
      .filter((d) => d.value > 0);
  }, [activeFunds, fundBalances]);

  // 4. Fund-wise monthly summaries (Credits vs Expenses for current month)
  const fundMonthlySummaries = useMemo(() => {
    const summaries: Record<string, { income: number; expenses: number; net: number }> = {};

    activeFunds.forEach((f) => {
      summaries[f.id] = { income: 0, expenses: 0, net: 0 };
    });

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    transactions.forEach((t) => {
      const tDate = new Date(t.date);
      if (tDate.getFullYear() === currentYear && tDate.getMonth() === currentMonth) {
        if (t.type === 'credit') {
          if (summaries[t.fundId]) summaries[t.fundId].income += t.amount;
        } else if (t.type === 'expense') {
          if (summaries[t.fundId]) summaries[t.fundId].expenses += t.amount;
        } else if (t.type === 'transfer') {
          // Transfers affect individual fund monthly inflows/outflows
          if (summaries[t.fundId]) summaries[t.fundId].expenses += t.amount; // source
          if (summaries[t.toFundId]) summaries[t.toFundId].income += t.amount; // destination
        } else if (t.type === 'adjustment') {
          if (summaries[t.fundId]) {
            if (t.amount > 0) {
              summaries[t.fundId].income += t.amount;
            } else {
              summaries[t.fundId].expenses += Math.abs(t.amount);
            }
          }
        }
      }
    });

    // Compute nets
    activeFunds.forEach((f) => {
      if (summaries[f.id]) {
        summaries[f.id].net = summaries[f.id].income - summaries[f.id].expenses;
      }
    });

    return summaries;
  }, [activeFunds, transactions]);

  // Total Account Monthly Stats
  const totalMonthlyStats = useMemo(() => {
    let income = 0;
    let expenses = 0;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    transactions.forEach((t) => {
      const tDate = new Date(t.date);
      if (tDate.getFullYear() === currentYear && tDate.getMonth() === currentMonth) {
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
      net: income - expenses,
    };
  }, [transactions]);

  return (
    <div className="flex flex-col gap-6 animate-enter">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Analytics & Reports</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Deep-dive financial visualizers and breakdowns.</p>
      </div>

      {/* Monthly Summary Banner */}
      <Card className="border border-neutral-150/40 dark:border-neutral-800 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-6 bg-gradient-to-br from-neutral-50/50 via-white to-neutral-50/20 dark:from-neutral-900 dark:to-neutral-900/60 p-6">
        <div className="flex flex-col justify-center">
          <span className="text-xs font-bold text-neutral-450 dark:text-neutral-550 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            Current Summary ({currentMonthLabel})
          </span>
          <p className="text-xs text-neutral-400 mt-1.5 max-w-xs leading-normal">
            Income and expenses aggregated for this month. Inflows/outflows include adjust correction entries.
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-4 md:col-span-2">
          <div className="p-4 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-emerald-50/10 dark:bg-emerald-950/5">
            <span className="text-[10px] font-bold text-[#6D9886] dark:text-[#A9DFBF] uppercase tracking-wider flex items-center gap-1">
              <ArrowUpRight className="h-3.5 w-3.5" /> Monthly Inflows
            </span>
            <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-500 mt-2">
              {formatCurrency(totalMonthlyStats.income, currency)}
            </div>
          </div>
          
          <div className="p-4 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-rose-50/10 dark:bg-rose-950/5">
            <span className="text-[10px] font-bold text-[#D08C8C] dark:text-[#F1948A] uppercase tracking-wider flex items-center gap-1">
              <ArrowDownRight className="h-3.5 w-3.5" /> Monthly Outflows
            </span>
            <div className="text-xl font-extrabold text-rose-500 dark:text-rose-455 mt-2">
              {formatCurrency(totalMonthlyStats.expenses, currency)}
            </div>
          </div>
        </div>
      </Card>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Monthly Income vs Expenses (Bar Chart) */}
        <Card className="border border-neutral-150/40 dark:border-neutral-800 shadow-xs flex flex-col justify-between p-6">
          <div>
            <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-4">
              Income vs Expenses (Last 6 Months)
            </h2>
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={historicalData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" className="dark:stroke-neutral-800" />
                  <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    formatter={(value: any) => [formatCurrency(value, currency)]}
                    contentStyle={{
                      backgroundColor: 'rgba(30, 30, 30, 0.95)',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '11px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="income" name="Inflow" fill="#34D399" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Outflow" fill="#F87171" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

        {/* Chart 2: Monthly Spending Trend (Line Chart) */}
        <Card className="border border-neutral-150/40 dark:border-neutral-800 shadow-xs flex flex-col justify-between p-6">
          <div>
            <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-4">
              Monthly Spending Trend (Last 6 Months)
            </h2>
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historicalData} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" className="dark:stroke-neutral-800" />
                  <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    formatter={(value: any) => [formatCurrency(value, currency)]}
                    contentStyle={{
                      backgroundColor: 'rgba(30, 30, 30, 0.95)',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '11px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Line
                    type="monotone"
                    dataKey="spending"
                    name="Spent Amount"
                    stroke="#A7B5FF"
                    strokeWidth={3}
                    activeDot={{ r: 6 }}
                    dot={{ stroke: '#A7B5FF', strokeWidth: 2, r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

        {/* Chart 3: Fund Balances Comparison (Bar Chart) */}
        <Card className="border border-neutral-150/40 dark:border-neutral-800 shadow-xs flex flex-col justify-between p-6">
          <div>
            <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-4">
              Fund Balances Comparison
            </h2>
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fundAllocationData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" className="dark:stroke-neutral-800" />
                  <XAxis dataKey="name" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    formatter={(value: any) => [formatCurrency(value, currency), 'Balance']}
                    contentStyle={{
                      backgroundColor: 'rgba(30, 30, 30, 0.95)',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '11px',
                    }}
                  />
                  <Bar dataKey="Balance" radius={[4, 4, 0, 0]}>
                    {fundAllocationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

        {/* Chart 4: Allocation Share Pie */}
        <Card className="border border-neutral-150/40 dark:border-neutral-800 shadow-xs flex flex-col items-center justify-between p-6">
          <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 self-start mb-4">
            Fund Allocation Distribution
          </h2>
          {pieData.length > 0 ? (
            <div className="w-full h-64 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    formatter={(value: any) => [formatCurrency(value, currency), 'Allocation']}
                    contentStyle={{
                      backgroundColor: 'rgba(30, 30, 30, 0.95)',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '11px',
                    }}
                  />
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Total</span>
                <span className="text-lg font-extrabold text-neutral-850 dark:text-white leading-tight mt-1">
                  {formatCurrency(
                    pieData.reduce((sum, d) => sum + d.value, 0),
                    currency
                  )}
                </span>
              </div>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-xs text-neutral-400 italic gap-1">
              <HelpCircle className="h-6 w-6 text-neutral-300" />
              No funds have positive balances.
            </div>
          )}
        </Card>
      </div>

      {/* Fund-wise Monthly Breakdown Table */}
      <Card className="border border-neutral-150/40 dark:border-neutral-800 shadow-xs">
        <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-4">
          Fund-wise Monthly Aggregates ({currentMonthLabel})
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-neutral-50 dark:bg-neutral-850/30 border-b border-neutral-100 dark:border-neutral-850 text-[10px] font-bold text-neutral-450 dark:text-neutral-400 uppercase tracking-wider">
                <th className="px-6 py-4.5">Fund Name</th>
                <th className="px-6 py-4.5">Monthly Credits / Inflows</th>
                <th className="px-6 py-4.5">Monthly Expenses / Outflows</th>
                <th className="px-6 py-4.5">Monthly Net Change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-850">
              {activeFunds.map((fund) => {
                const summary = fundMonthlySummaries[fund.id] || { income: 0, expenses: 0, net: 0 };
                return (
                  <tr key={fund.id} className="hover:bg-neutral-50/30 dark:hover:bg-neutral-900/10">
                    <td className="px-6 py-4 flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: fund.color }} />
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200">{fund.name}</span>
                    </td>
                    <td className="px-6 py-4 font-mono font-semibold text-emerald-600 dark:text-emerald-500">
                      {formatCurrency(summary.income, currency)}
                    </td>
                    <td className="px-6 py-4 font-mono font-semibold text-rose-500 dark:text-rose-400">
                      {formatCurrency(summary.expenses, currency)}
                    </td>
                    <td
                      className={`px-6 py-4 font-mono font-bold ${
                        summary.net >= 0
                          ? 'text-emerald-600 dark:text-emerald-500'
                          : 'text-rose-500 dark:text-rose-400'
                      }`}
                    >
                      {summary.net > 0 ? '+' : ''}
                      {formatCurrency(summary.net, currency)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
export default Analytics;
