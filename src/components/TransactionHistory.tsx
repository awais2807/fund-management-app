import React, { useState, useMemo } from 'react';
import { useFinance, CATEGORIES } from '../context/FinanceContext';
import type { Transaction } from '../types';
import { formatCurrency } from '../utils/helpers';
import { Card, Button, Input, Select } from './ui/Common';
import Dialog from './ui/Dialog';
import {
  Filter,
  ArrowUpDown,
  Edit2,
  Trash2,
  X,
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeftRight,
  Scale,
  FileSpreadsheet,
  Printer,
} from 'lucide-react';

export const TransactionHistory: React.FC = () => {
  const {
    transactions,
    funds,
    currency,
    editTransaction,
    deleteTransaction,
  } = useFinance();

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFund, setSelectedFund] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Sorting States
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Edit Modal State
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editFundId, setEditFundId] = useState('');
  const [editToFundId, setEditToFundId] = useState('');
  const [editAdjustmentType, setEditAdjustmentType] = useState('Correction Entry');
  const [editCategory, setEditCategory] = useState('Other');

  const activeFunds = useMemo(() => funds.filter((f) => !f.archived), [funds]);

  const handleExportCSV = () => {
    // Generate CSV content
    const headers = ['Date', 'Type', 'Amount', 'Fund', 'To Fund (For Transfer)', 'Category', 'Notes'];
    const rows = processedTransactions.map(t => {
      const fundName = (t as any).fundId ? getFundName((t as any).fundId) : '';
      const toFundName = (t as any).toFundId ? getFundName((t as any).toFundId) : '';
      const typeLabel = t.type.toUpperCase();
      const amountSign = t.type === 'expense' ? `-${t.amount}` : `${t.amount}`;
      return [
        t.date,
        typeLabel,
        amountSign,
        fundName,
        toFundName,
        t.category || '',
        `"${t.notes.replace(/"/g, '""')}"`
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `finance_statement_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrintPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to generate print statements.');
      return;
    }

    const todayStr = new Date().toLocaleDateString();
    
    // Calculate statement totals
    let totalCredits = 0;
    let totalExpenses = 0;
    processedTransactions.forEach(t => {
      if (t.type === 'credit') totalCredits += t.amount;
      else if (t.type === 'expense') totalExpenses += t.amount;
      else if (t.type === 'adjustment') {
        if (t.amount > 0) totalCredits += t.amount;
        else totalExpenses += Math.abs(t.amount);
      }
    });

    // Render print HTML
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Financial Statement - ${todayStr}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #171717;
            padding: 40px;
            font-size: 13px;
            line-height: 1.5;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #e5e5e5;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .title {
            font-size: 20px;
            font-weight: 700;
            margin: 0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .subtitle {
            font-size: 11px;
            color: #737373;
            margin-top: 5px;
          }
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-bottom: 35px;
          }
          .summary-card {
            border: 1px solid #e5e5e5;
            border-radius: 8px;
            padding: 15px;
            background-color: #fafafa;
          }
          .summary-card-title {
            font-size: 9px;
            text-transform: uppercase;
            font-weight: bold;
            color: #737373;
            letter-spacing: 0.5px;
          }
          .summary-card-value {
            font-size: 18px;
            font-weight: 700;
            margin-top: 5px;
          }
          .credits { color: #16a34a; }
          .expenses { color: #dc2626; }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
          }
          th {
            border-bottom: 2px solid #171717;
            text-align: left;
            padding: 8px 12px;
            font-size: 10px;
            text-transform: uppercase;
            font-weight: bold;
            color: #171717;
          }
          td {
            border-bottom: 1px solid #e5e5e5;
            padding: 10px 12px;
            vertical-align: top;
          }
          .amount {
            font-weight: 600;
            text-align: right;
          }
          th.amount-header {
            text-align: right;
          }
          .badge {
            font-size: 9px;
            font-weight: bold;
            padding: 2px 6px;
            border-radius: 4px;
            text-transform: uppercase;
            border: 1px solid #e5e5e5;
            display: inline-block;
          }
          .notes {
            color: #525252;
            font-size: 12px;
          }
          @media print {
            body { padding: 0; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">Personal Treasury Statement</h1>
            <div class="subtitle">Generated on ${todayStr} • Filtered Audit Record</div>
          </div>
          <div style="text-align: right;">
            <div style="font-weight: bold; font-size: 14px;">Personal Finance</div>
            <div class="subtitle">Secure Offline Ledger</div>
          </div>
        </div>

        <div class="summary-grid">
          <div class="summary-card">
            <div class="summary-card-title">Total Credits</div>
            <div class="summary-card-value credits">+${currency}${totalCredits.toFixed(2)}</div>
          </div>
          <div class="summary-card">
            <div class="summary-card-title">Total Expenses</div>
            <div class="summary-card-value expenses">-${currency}${totalExpenses.toFixed(2)}</div>
          </div>
          <div class="summary-card">
            <div class="summary-card-title">Net Cash Flow</div>
            <div class="summary-card-value ${(totalCredits - totalExpenses) >= 0 ? 'credits' : 'expenses'}">
              ${(totalCredits - totalExpenses) >= 0 ? '+' : '-'}${currency}${Math.abs(totalCredits - totalExpenses).toFixed(2)}
            </div>
          </div>
        </div>

        <h3>Transaction Audit Log (${processedTransactions.length} records)</h3>
        <table>
          <thead>
            <tr>
              <th style="width: 12%;">Date</th>
              <th style="width: 10%;">Type</th>
              <th style="width: 15%;">Fund</th>
              <th style="width: 15%;">Category</th>
              <th style="width: 35%;">Notes / Details</th>
              <th style="width: 13%;" class="amount-header">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${processedTransactions.map(t => {
              const fundName = (t as any).fundId ? getFundName((t as any).fundId) : '';
              const toFundName = (t as any).toFundId ? ` → ${getFundName((t as any).toFundId)}` : '';
              const typeColor = t.type === 'credit' ? '#16a34a' : t.type === 'expense' ? '#dc2626' : '#2563eb';
              
              return `
                <tr>
                  <td style="font-family: monospace;">${t.date}</td>
                  <td>
                    <span class="badge" style="color: ${typeColor}; border-color: ${typeColor}20; background-color: ${typeColor}05">
                      ${t.type}
                    </span>
                  </td>
                  <td style="font-weight: 500;">${fundName}${toFundName}</td>
                  <td><span class="badge">${t.category || 'Other'}</span></td>
                  <td class="notes">${t.notes}</td>
                  <td class="amount ${t.type === 'credit' ? 'credits' : t.type === 'expense' ? 'expenses' : ''}">
                    ${t.type === 'credit' ? '+' : t.type === 'expense' ? '-' : ''}${currency}${t.amount.toFixed(2)}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 250);
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Handle Edit click
  const handleEditClick = (tx: Transaction) => {
    setEditingTx(tx);
    setEditAmount(tx.amount.toString());
    setEditDate(tx.date);
    setEditNotes(tx.notes);
    setEditFundId((tx as any).fundId || '');
    setEditToFundId((tx as any).toFundId || '');
    setEditAdjustmentType((tx as any).adjustmentType || 'Correction Entry');
    setEditCategory(tx.category || 'Other');
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx) return;

    const amountNum = parseFloat(editAmount);
    if (isNaN(amountNum) || amountNum <= 0 && editingTx.type !== 'adjustment') return; 
    // note: adjustment transactions can technically be negative or positive, so we handle that:
    const finalAmount = editingTx.type === 'adjustment' ? amountNum : Math.abs(amountNum);

    const updatedBase = {
      type: editingTx.type,
      amount: finalAmount,
      date: editDate,
      notes: editNotes,
    };

    let updatedTx: any = { ...updatedBase };

    if (editingTx.type === 'credit' || editingTx.type === 'expense') {
      updatedTx.fundId = editFundId;
      updatedTx.category = editCategory;
    } else if (editingTx.type === 'transfer') {
      updatedTx.fundId = editFundId;
      updatedTx.toFundId = editToFundId;
    } else if (editingTx.type === 'adjustment') {
      updatedTx.fundId = editFundId;
      updatedTx.adjustmentType = editAdjustmentType;
      updatedTx.category = editCategory;
    }

    editTransaction(editingTx.id, updatedTx);
    setEditingTx(null);
  };

  const handleDeleteClick = (id: string) => {
    if (window.confirm('Are you sure you want to delete this transaction? This will permanently recalculate all associated fund balances.')) {
      deleteTransaction(id);
    }
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedFund('all');
    setSelectedType('all');
    setSelectedCategory('all');
    setStartDate('');
    setEndDate('');
  };

  // Toggle sort order
  const handleSortToggle = (field: 'date' | 'amount') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  // Filter and Sort Transactions
  const processedTransactions = useMemo(() => {
    return transactions
      .filter((t) => {
        // 1. Search Query
        const matchQuery =
          t.notes.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.type.toLowerCase().includes(searchQuery.toLowerCase());

        // 2. Fund Filter (checks source or destination for transfers)
        let matchFund = true;
        if (selectedFund !== 'all') {
          if (t.type === 'transfer') {
            matchFund = t.fundId === selectedFund || t.toFundId === selectedFund;
          } else {
            matchFund = (t as any).fundId === selectedFund;
          }
        }

        // 3. Type Filter
        const matchType = selectedType === 'all' || t.type === selectedType;

        // 3b. Category Filter
        const matchCategory = selectedCategory === 'all' || t.category === selectedCategory;

        // 4. Date range filter
        let matchDate = true;
        if (startDate) {
          matchDate = matchDate && t.date >= startDate;
        }
        if (endDate) {
          matchDate = matchDate && t.date <= endDate;
        }

        return matchQuery && matchFund && matchType && matchCategory && matchDate;
      })
      .sort((a, b) => {
        // Sorting logic
        let compare = 0;
        if (sortBy === 'date') {
          compare = a.date.localeCompare(b.date);
        } else if (sortBy === 'amount') {
          compare = a.amount - b.amount;
        }

        return sortOrder === 'asc' ? compare : -compare;
      });
  }, [transactions, searchQuery, selectedFund, selectedType, selectedCategory, startDate, endDate, sortBy, sortOrder]);

  // Helper to get Fund name
  const getFundName = (fundId: string) => {
    const f = funds.find((fd) => fd.id === fundId);
    return f ? f.name : 'Deleted Fund';
  };

  // Render type badges
  const renderTypeBadge = (type: string) => {
    switch (type) {
      case 'credit':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 border border-emerald-100 dark:border-emerald-900/30">
            <ArrowUpRight className="h-3.5 w-3.5" />
            Credit
          </span>
        );
      case 'expense':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-50 dark:bg-rose-950/20 text-rose-500 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30">
            <ArrowDownRight className="h-3.5 w-3.5" />
            Expense
          </span>
        );
      case 'transfer':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 dark:bg-blue-950/20 text-blue-500 dark:text-blue-450 border border-blue-100 dark:border-blue-900/30">
            <ArrowLeftRight className="h-3.5 w-3.5" />
            Transfer
          </span>
        );
      case 'adjustment':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-450 border border-amber-100 dark:border-amber-900/30">
            <Scale className="h-3.5 w-3.5" />
            Adjustment
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-enter">
      {/* Title & Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Transaction History</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Search, filter, and audit every monetary transaction.</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExportCSV} 
            className="cursor-pointer text-neutral-700 dark:text-neutral-350 py-2 px-3 text-xs"
            disabled={processedTransactions.length === 0}
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export CSV
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handlePrintPDF} 
            className="cursor-pointer text-neutral-700 dark:text-neutral-350 py-2 px-3 text-xs"
            disabled={processedTransactions.length === 0}
          >
            <Printer className="h-4 w-4" />
            Print Statement
          </Button>
        </div>
      </div>

      {/* Filters Card */}
      <Card className="border border-neutral-100 dark:border-neutral-800 shadow-xs flex flex-col gap-4">
        <div className="flex items-center gap-2 pb-2 border-b border-neutral-100 dark:border-neutral-850">
          <Filter className="h-4 w-4 text-neutral-400" />
          <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Search and Filter</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          {/* Note Search */}
          <div className="md:col-span-2 relative">
            <Input
              label="Search Description"
              placeholder="Search by notes or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-[35px] text-neutral-400 hover:text-neutral-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Fund Filter */}
          <Select
            label="Filter by Fund"
            options={[
              { value: 'all', label: 'All Funds' },
              ...funds.map((f) => ({ value: f.id, label: `${f.name}${f.archived ? ' (Archived)' : ''}` })),
            ]}
            value={selectedFund}
            onChange={(e) => setSelectedFund(e.target.value)}
          />

          {/* Type Filter */}
          <Select
            label="Transaction Type"
            options={[
              { value: 'all', label: 'All Types' },
              { value: 'credit', label: 'Credits' },
              { value: 'expense', label: 'Expenses' },
              { value: 'transfer', label: 'Transfers' },
              { value: 'adjustment', label: 'Adjustments' },
            ]}
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          />

          {/* Category Filter */}
          <Select
            label="Filter by Category"
            options={[
              { value: 'all', label: 'All Categories' },
              ...CATEGORIES.map((cat) => ({ value: cat, label: cat })),
            ]}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          />

          {/* Date range filters */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                type="date"
                label="Start Date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <Input
                type="date"
                label="End Date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        {(searchQuery || selectedFund !== 'all' || selectedType !== 'all' || startDate || endDate) && (
          <div className="flex justify-end mt-2">
            <Button variant="ghost" size="sm" onClick={handleClearFilters} className="text-neutral-400 font-semibold cursor-pointer">
              Clear All Filters
            </Button>
          </div>
        )}
      </Card>

      {/* Transactions Table/List Card */}
      <Card className="border border-neutral-150/40 dark:border-neutral-800 shadow-xs overflow-hidden p-0">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-neutral-50 dark:bg-neutral-850/50 border-b border-neutral-100 dark:border-neutral-850 text-xs font-bold text-neutral-450 dark:text-neutral-400 uppercase tracking-wider select-none">
                <th
                  onClick={() => handleSortToggle('date')}
                  className="px-6 py-4 cursor-pointer hover:bg-neutral-100/50 dark:hover:bg-neutral-800/30 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    Date
                    {sortBy === 'date' && <ArrowUpDown className="h-3.5 w-3.5 text-neutral-600" />}
                  </div>
                </th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Fund Source/Destination</th>
                <th
                  onClick={() => handleSortToggle('amount')}
                  className="px-6 py-4 cursor-pointer hover:bg-neutral-100/50 dark:hover:bg-neutral-800/30 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    Amount
                    {sortBy === 'amount' && <ArrowUpDown className="h-3.5 w-3.5 text-neutral-600" />}
                  </div>
                </th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Notes / Remarks</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-850">
              {processedTransactions.length > 0 ? (
                processedTransactions.map((tx) => {
                  const isPositive =
                    tx.type === 'credit' || (tx.type === 'adjustment' && tx.amount > 0);
                  const isTransfer = tx.type === 'transfer';

                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-neutral-50/35 dark:hover:bg-neutral-900/10 transition-colors"
                    >
                      {/* Date */}
                      <td className="px-6 py-4 text-neutral-800 dark:text-neutral-200 whitespace-nowrap font-medium font-mono">
                        {tx.date}
                      </td>

                      {/* Type Badge */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {renderTypeBadge(tx.type)}
                      </td>

                      {/* Fund */}
                      <td className="px-6 py-4 text-neutral-800 dark:text-neutral-300 font-semibold whitespace-nowrap">
                        {isTransfer ? (
                          <div className="flex items-center gap-2 text-xs">
                            <span className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800">
                              {getFundName(tx.fundId)}
                            </span>
                            <span className="text-neutral-400">→</span>
                            <span className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800">
                              {getFundName((tx as any).toFundId)}
                            </span>
                          </div>
                        ) : (
                          <span>{getFundName((tx as any).fundId)}</span>
                        )}
                      </td>

                      {/* Amount */}
                      <td
                        className={`px-6 py-4 whitespace-nowrap font-bold font-mono ${
                          isTransfer
                            ? 'text-neutral-600 dark:text-neutral-400'
                            : isPositive
                            ? 'text-emerald-600 dark:text-emerald-500'
                            : 'text-rose-500 dark:text-rose-400'
                        }`}
                      >
                        {isTransfer ? '' : isPositive ? '+' : '-'}
                        {formatCurrency(Math.abs(tx.amount), currency)}
                      </td>

                      {/* Category */}
                      <td className="px-6 py-4 text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
                        {tx.category || '-'}
                      </td>

                      {/* Notes */}
                      <td className="px-6 py-4 text-neutral-500 dark:text-neutral-400 max-w-xs truncate">
                        {tx.notes || '-'}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-semibold">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEditClick(tx)}
                            className="p-1.5 rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-800 dark:hover:text-neutral-200 cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(tx.id)}
                            className="p-1.5 rounded-lg text-neutral-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-600 cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-neutral-400 italic">
                    No transactions match the selected criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile List View */}
        <div className="block md:hidden divide-y divide-neutral-100 dark:divide-neutral-850 animate-enter">
          {processedTransactions.length > 0 ? (
            processedTransactions.map((tx) => {
              const isPositive =
                tx.type === 'credit' || (tx.type === 'adjustment' && tx.amount > 0);
              const isTransfer = tx.type === 'transfer';

              return (
                <div key={tx.id} className="p-4 flex flex-col gap-2.5 hover:bg-neutral-50/20 dark:hover:bg-neutral-900/10 transition-colors">
                  {/* Row 1: Date & Type */}
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-neutral-500 dark:text-neutral-400 font-mono font-medium">
                      {tx.date}
                    </span>
                    {renderTypeBadge(tx.type)}
                  </div>

                  {/* Row 2: Fund Source/Dest & Amount */}
                  <div className="flex justify-between items-center gap-2">
                    <div className="text-sm text-neutral-850 dark:text-neutral-300 font-semibold truncate">
                      {isTransfer ? (
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800">
                            {getFundName(tx.fundId)}
                          </span>
                          <span className="text-neutral-400">→</span>
                          <span className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800">
                            {getFundName((tx as any).toFundId)}
                          </span>
                        </div>
                      ) : (
                        <span>{getFundName((tx as any).fundId)}</span>
                      )}
                    </div>
                    <div
                      className={`text-sm font-bold font-mono whitespace-nowrap ${
                        isTransfer
                          ? 'text-neutral-600 dark:text-neutral-400'
                          : isPositive
                          ? 'text-emerald-600 dark:text-emerald-500'
                          : 'text-rose-500 dark:text-rose-400'
                      }`}
                    >
                      {isTransfer ? '' : isPositive ? '+' : '-'}
                      {formatCurrency(Math.abs(tx.amount), currency)}
                    </div>
                  </div>

                  {/* Row 3: Remarks and Actions */}
                  <div className="flex justify-between items-center gap-4 border-t border-neutral-100/50 dark:border-neutral-850/30 pt-2">
                    <div className="flex flex-col gap-0.5 text-[11px] text-neutral-400 dark:text-neutral-450 truncate max-w-[70%]">
                      <span>Category: <strong className="text-neutral-650 dark:text-neutral-300 font-semibold">{tx.category || '-'}</strong></span>
                      <span className="truncate">{tx.notes || 'No notes'}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleEditClick(tx)}
                        className="p-1 rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-800 dark:hover:text-neutral-200 cursor-pointer"
                        title="Edit"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(tx.id)}
                        className="p-1 rounded-lg text-neutral-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-600 cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-xs text-neutral-400 italic">
              No transactions match the selected criteria.
            </div>
          )}
        </div>
      </Card>

      {/* Edit Transaction Modal */}
      {editingTx && (
        <Dialog
          isOpen={!!editingTx}
          onClose={() => setEditingTx(null)}
          title={`Edit ${editingTx.type.charAt(0).toUpperCase() + editingTx.type.slice(1)} Transaction`}
        >
          <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
            <Input
              type="number"
              step="any"
              label="Amount"
              placeholder="0.00"
              value={editAmount}
              onChange={(e) => setEditAmount(e.target.value)}
              required
            />

            <Input
              type="date"
              label="Date"
              value={editDate}
              onChange={(e) => setEditDate(e.target.value)}
              required
            />

            {/* Fund Selection based on Transaction Type */}
            {(editingTx.type === 'credit' ||
              editingTx.type === 'expense' ||
              editingTx.type === 'adjustment') && (
              <Select
                label="Fund"
                options={activeFunds.map((f) => ({ value: f.id, label: f.name }))}
                value={editFundId}
                onChange={(e) => setEditFundId(e.target.value)}
                required
              />
            )}

            {editingTx.type === 'transfer' && (
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Source Fund (From)"
                  options={activeFunds.map((f) => ({ value: f.id, label: f.name }))}
                  value={editFundId}
                  onChange={(e) => setEditFundId(e.target.value)}
                  required
                />
                <Select
                  label="Destination Fund (To)"
                  options={activeFunds.map((f) => ({ value: f.id, label: f.name }))}
                  value={editToFundId}
                  onChange={(e) => setEditToFundId(e.target.value)}
                  required
                />
              </div>
            )}

            {editingTx.type === 'adjustment' && (
              <Select
                label="Adjustment Reason"
                options={[
                  { value: 'Bank Charges', label: 'Bank Charges' },
                  { value: 'Interest Credit', label: 'Interest Credit' },
                  { value: 'Forgotten Expense', label: 'Forgotten Expense' },
                  { value: 'Correction Entry', label: 'Correction Entry' },
                  { value: 'Cash Deposit', label: 'Cash Deposit' },
                  { value: 'Other', label: 'Other' },
                ]}
                value={editAdjustmentType}
                onChange={(e) => setEditAdjustmentType(e.target.value)}
                required
              />
            )}

            {/* Category selection */}
            {(editingTx.type === 'credit' ||
              editingTx.type === 'expense' ||
              editingTx.type === 'adjustment') && (
              <Select
                label="Category"
                options={CATEGORIES.map((cat) => ({ value: cat, label: cat }))}
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                required
              />
            )}

            <Input
              label="Description / Notes"
              placeholder="Add details..."
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
            />

            <div className="flex justify-end gap-3 border-t border-neutral-100 dark:border-neutral-850/60 pt-4 mt-2">
              <Button type="button" variant="secondary" onClick={() => setEditingTx(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Save Changes
              </Button>
            </div>
          </form>
        </Dialog>
      )}
    </div>
  );
};
export default TransactionHistory;
