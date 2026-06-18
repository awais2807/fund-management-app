import React, { useState, useEffect, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import type { TransactionType } from '../types';
import { Dialog } from './ui/Dialog';
import { Button, Input, Select } from './ui/Common';
import { Scale, ArrowUpRight, ArrowDownRight, ArrowLeftRight } from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: TransactionType;
  initialFundId?: string;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  initialType = 'credit',
  initialFundId,
}) => {
  const { funds, addTransaction } = useFinance();

  // Selected tab state
  const [activeTab, setActiveTab] = useState<TransactionType>('credit');
  
  // Form States
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  
  // Fund selection
  const [fundId, setFundId] = useState('');
  const [toFundId, setToFundId] = useState('');
  const [adjustmentType, setAdjustmentType] = useState('Correction Entry');

  const activeFunds = useMemo(() => {
    return funds.filter((f) => !f.archived).sort((a, b) => a.order - b.order);
  }, [funds]);

  // Sync initial parameters when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialType);
      
      // Select prefilled fund or default to first active fund
      if (initialFundId) {
        setFundId(initialFundId);
      } else if (activeFunds.length > 0) {
        setFundId(activeFunds[0].id);
      }

      // Default destination to second active fund for transfers
      if (activeFunds.length > 1) {
        // If initial fund matches first, pick second. Else pick first.
        const firstId = activeFunds[0].id;
        const secondId = activeFunds[1].id;
        setToFundId(initialFundId === firstId ? secondId : firstId);
      } else if (activeFunds.length > 0) {
        setToFundId(activeFunds[0].id);
      }

      // Reset form variables
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setNotes('');
      setAdjustmentType('Correction Entry');
    }
  }, [isOpen, initialType, initialFundId, activeFunds]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount)) return;

    // Check boundaries (except adjustments which can be negative)
    if (parsedAmount <= 0 && activeTab !== 'adjustment') {
      alert('Please enter a positive amount greater than zero.');
      return;
    }

    if (activeTab === 'transfer' && fundId === toFundId) {
      alert('Source and destination funds must be different.');
      return;
    }

    const baseTx = {
      type: activeTab,
      amount: activeTab === 'adjustment' ? parsedAmount : Math.abs(parsedAmount),
      date,
      notes: notes.trim(),
    };

    let finalTx: any = { ...baseTx };

    if (activeTab === 'credit' || activeTab === 'expense') {
      finalTx.fundId = fundId;
    } else if (activeTab === 'transfer') {
      finalTx.fundId = fundId;
      finalTx.toFundId = toFundId;
    } else if (activeTab === 'adjustment') {
      finalTx.fundId = fundId;
      finalTx.adjustmentType = adjustmentType;
    }

    addTransaction(finalTx);
    onClose();
  };

  const tabs = [
    { id: 'credit', label: 'Credit', icon: ArrowUpRight, color: 'text-emerald-600 dark:text-emerald-500' },
    { id: 'expense', label: 'Expense', icon: ArrowDownRight, color: 'text-rose-500 dark:text-rose-400' },
    { id: 'transfer', label: 'Transfer', icon: ArrowLeftRight, color: 'text-blue-500 dark:text-blue-450' },
    { id: 'adjustment', label: 'Adjustment', icon: Scale, color: 'text-amber-500 dark:text-amber-450' },
  ] as const;

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Add New Transaction">
      <div className="flex flex-col gap-4">
        {/* Tab Headers */}
        <div className="grid grid-cols-4 bg-neutral-100 dark:bg-neutral-850 p-1 rounded-xl border border-neutral-150/40 dark:border-neutral-800 shrink-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`py-1.5 flex flex-col sm:flex-row items-center justify-center gap-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white text-neutral-950 shadow-xs dark:bg-neutral-900 dark:text-white'
                    : 'text-neutral-450 hover:text-neutral-700 dark:hover:text-neutral-300'
                }`}
              >
                <Icon className={`h-4 w-4 ${tab.color}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Amount input */}
          <Input
            type="number"
            step="any"
            label={activeTab === 'adjustment' ? 'Adjustment Amount (use - for negative)' : 'Amount'}
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />

          {/* Date input */}
          <Input
            type="date"
            label="Transaction Date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />

          {/* Credit / Expense / Adjustment layout: Single Fund selector */}
          {(activeTab === 'credit' || activeTab === 'expense' || activeTab === 'adjustment') && (
            <Select
              label="Target Fund"
              options={activeFunds.map((f) => ({ value: f.id, label: f.name }))}
              value={fundId}
              onChange={(e) => setFundId(e.target.value)}
              required
            />
          )}

          {/* Transfer layout: Source and Destination Fund selector */}
          {activeTab === 'transfer' && (
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Source Fund (From)"
                options={activeFunds.map((f) => ({ value: f.id, label: f.name }))}
                value={fundId}
                onChange={(e) => setFundId(e.target.value)}
                required
              />
              <Select
                label="Destination Fund (To)"
                options={activeFunds.map((f) => ({ value: f.id, label: f.name }))}
                value={toFundId}
                onChange={(e) => setToFundId(e.target.value)}
                required
              />
            </div>
          )}

          {/* Adjustment Reason dropdown */}
          {activeTab === 'adjustment' && (
            <Select
              label="Adjustment Category"
              options={[
                { value: 'Correction Entry', label: 'Correction Entry' },
                { value: 'Bank Charges', label: 'Bank Charges' },
                { value: 'Interest Credit', label: 'Interest Credit' },
                { value: 'Forgotten Expense', label: 'Forgotten Expense' },
                { value: 'Cash Deposit', label: 'Cash Deposit' },
                { value: 'Other', label: 'Other' },
              ]}
              value={adjustmentType}
              onChange={(e) => setAdjustmentType(e.target.value)}
              required
            />
          )}

          {/* Notes description */}
          <Input
            label="Description / Notes"
            placeholder={
              activeTab === 'transfer'
                ? 'e.g. Funding home expenses, project cash'
                : activeTab === 'adjustment'
                ? 'Reason for discrepancy'
                : 'e.g. Grocery shopping, side contract income'
            }
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="flex justify-end gap-3 border-t border-neutral-100 dark:border-neutral-850/60 pt-4 mt-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="px-5">
              Record Transaction
            </Button>
          </div>
        </form>
      </div>
    </Dialog>
  );
};
export default TransactionModal;
