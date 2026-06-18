import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
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

  const activeFunds = useMemo(() => funds.filter((f) => !f.archived), [funds]);

  // Handle Edit click
  const handleEditClick = (tx: Transaction) => {
    setEditingTx(tx);
    setEditAmount(tx.amount.toString());
    setEditDate(tx.date);
    setEditNotes(tx.notes);
    setEditFundId((tx as any).fundId || '');
    setEditToFundId((tx as any).toFundId || '');
    setEditAdjustmentType((tx as any).adjustmentType || 'Correction Entry');
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
    } else if (editingTx.type === 'transfer') {
      updatedTx.fundId = editFundId;
      updatedTx.toFundId = editToFundId;
    } else if (editingTx.type === 'adjustment') {
      updatedTx.fundId = editFundId;
      updatedTx.adjustmentType = editAdjustmentType;
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

        // 4. Date range filter
        let matchDate = true;
        if (startDate) {
          matchDate = matchDate && t.date >= startDate;
        }
        if (endDate) {
          matchDate = matchDate && t.date <= endDate;
        }

        return matchQuery && matchFund && matchType && matchDate;
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
  }, [transactions, searchQuery, selectedFund, selectedType, startDate, endDate, sortBy, sortOrder]);

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
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Transaction History</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Search, filter, and audit every monetary transaction.</p>
      </div>

      {/* Filters Card */}
      <Card className="border border-neutral-100 dark:border-neutral-800 shadow-xs flex flex-col gap-4">
        <div className="flex items-center gap-2 pb-2 border-b border-neutral-100 dark:border-neutral-850">
          <Filter className="h-4 w-4 text-neutral-400" />
          <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Search and Filter</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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

      {/* Transactions Table Card */}
      <Card className="border border-neutral-150/40 dark:border-neutral-800 shadow-xs overflow-hidden p-0">
        <div className="overflow-x-auto">
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
