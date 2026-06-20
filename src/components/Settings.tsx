import React, { useState, useMemo } from 'react';
import { useFinance, CATEGORIES } from '../context/FinanceContext';
import type { Fund } from '../types';
import { defaultPastelColors, fundIcons, getPastelStyles } from '../utils/helpers';
import { Card, Button, Input, Select } from './ui/Common';
import Dialog from './ui/Dialog';
import {
  Settings as SettingsIcon,
  Plus,
  Archive,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  Download,
  Upload,
  Edit,
  Palette,
  LayoutGrid,
  AlertTriangle,
  FileCheck,
  Trash2,
  RefreshCw,
  Shield,
  Lock,
} from 'lucide-react';

export const Settings: React.FC = () => {
  const {
    funds,
    currency,
    theme,
    addFund,
    updateFund,
    archiveFund,
    restoreFund,
    reorderFunds,
    updateCurrency,
    updateTheme,
    resetData,
    exportData,
    importData,
    recurringTransactions,
    addRecurringTransaction,
    deleteRecurringTransaction,
    toggleRecurringTransaction,
    passcode,
    setPasscode,
  } = useFinance();

  // Active vs Archived funds
  const activeFunds = useMemo(() => {
    return funds.filter((f) => !f.archived).sort((a, b) => a.order - b.order);
  }, [funds]);

  const archivedFunds = useMemo(() => {
    return funds.filter((f) => f.archived);
  }, [funds]);

  // Add Fund Form State
  const [newFundName, setNewFundName] = useState('');
  const [newFundColor, setNewFundColor] = useState(defaultPastelColors[0]);
  const [newFundIcon, setNewFundIcon] = useState('Briefcase');
  const [newFundBudget, setNewFundBudget] = useState('');

  // Edit Fund Modal State
  const [editingFund, setEditingFund] = useState<Fund | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [editBudget, setEditBudget] = useState('');

  // Import State
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState(false);

  // Reset State
  const [resetConfirmationText, setResetConfirmationText] = useState('');
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Recurring Transactions States
  const [recTitle, setRecTitle] = useState('');
  const [recAmount, setRecAmount] = useState('');
  const [recType, setRecType] = useState<'credit' | 'expense'>('expense');
  const [recFundId, setRecFundId] = useState('');
  const [recCategory, setRecCategory] = useState('Food & Dining');
  const [recFrequency, setRecFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [recStartDate, setRecStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [recNotes, setRecNotes] = useState('');

  // Security Lock screen states
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinConfirmInput, setPinConfirmInput] = useState('');
  const [pinError, setPinError] = useState('');

  const [isDisableLockOpen, setIsDisableLockOpen] = useState(false);
  const [disablePinInput, setDisablePinInput] = useState('');
  const [disablePinError, setDisablePinError] = useState('');

  // Prefill default fund for recurring form
  React.useEffect(() => {
    if (activeFunds.length > 0) {
      setRecFundId(activeFunds[0].id);
    }
  }, [activeFunds]);

  const handleAddRecurringSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(recAmount);
    if (!recTitle.trim() || isNaN(amt) || amt <= 0 || !recFundId || !recStartDate) return;

    addRecurringTransaction({
      title: recTitle.trim(),
      amount: amt,
      type: recType,
      fundId: recFundId,
      category: recCategory,
      frequency: recFrequency,
      startDate: recStartDate,
      notes: recNotes.trim(),
    });

    setRecTitle('');
    setRecAmount('');
    setRecNotes('');
  };

  // Currency States
  const currencyOptions = [
    { value: '₹', label: 'INR (₹)' },
    { value: '$', label: 'USD ($)' },
    { value: '€', label: 'EUR (€)' },
    { value: '£', label: 'GBP (£)' },
    { value: '¥', label: 'JPY/CNY (¥)' },
    { value: '₪', label: 'ILS (₪)' },
    { value: '₩', label: 'KRW (₩)' },
  ];

  // 1. Add Fund Submit
  const handleAddFundSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFundName.trim()) return;
    const budgetNum = parseFloat(newFundBudget);
    addFund(
      newFundName.trim(),
      newFundColor,
      newFundIcon,
      !isNaN(budgetNum) && budgetNum > 0 ? budgetNum : undefined
    );
    setNewFundName('');
    setNewFundBudget('');
    // Pick next default color preset
    const nextColorIndex = (activeFunds.length + 1) % defaultPastelColors.length;
    setNewFundColor(defaultPastelColors[nextColorIndex]);
  };

  // 2. Edit Fund Modal Open
  const handleOpenEditModal = (fund: Fund) => {
    setEditingFund(fund);
    setEditName(fund.name);
    setEditColor(fund.color);
    setEditIcon(fund.icon);
    setEditBudget(fund.budget ? fund.budget.toString() : '');
  };

  // 3. Edit Fund Submit
  const handleEditFundSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFund || !editName.trim()) return;
    const budgetNum = parseFloat(editBudget);
    updateFund(editingFund.id, {
      name: editName.trim(),
      color: editColor,
      icon: editIcon,
      budget: !isNaN(budgetNum) && budgetNum > 0 ? budgetNum : undefined,
    });
    setEditingFund(null);
  };

  // 4. Archive Fund
  const handleArchiveFund = (id: string) => {
    const success = archiveFund(id);
    if (!success) {
      alert('Cannot archive this fund. At least one active fund must always exist to maintain account integrity.');
    }
  };

  // 5. Reordering
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const reordered = [...activeFunds];
    const temp = reordered[index];
    reordered[index] = reordered[index - 1];
    reordered[index - 1] = temp;
    reorderFunds(reordered);
  };

  const handleMoveDown = (index: number) => {
    if (index === activeFunds.length - 1) return;
    const reordered = [...activeFunds];
    const temp = reordered[index];
    reordered[index] = reordered[index + 1];
    reordered[index + 1] = temp;
    reorderFunds(reordered);
  };

  // 6. JSON Export
  const handleExportData = () => {
    const jsonString = exportData();
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `personal_finance_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // 7. JSON Import
  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setImportFile(files[0]);
      setImportError('');
      setImportSuccess(false);
    }
  };

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const resultString = event.target?.result as string;
      const res = importData(resultString);
      if (res.success) {
        setImportSuccess(true);
        setImportFile(null);
        // Clear input file
        const fileInput = document.getElementById('import-file-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        setImportError(res.error || 'Invalid backup file');
      }
    };
    reader.readAsText(importFile);
  };

  const handleSetPasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');

    if (pinInput.length !== 4 || !/^\d{4}$/.test(pinInput)) {
      setPinError('Passcode must be exactly 4 digits.');
      return;
    }

    if (pinInput !== pinConfirmInput) {
      setPinError('Passcodes do not match.');
      return;
    }

    setPasscode(pinInput);
    setIsSecurityModalOpen(false);
    setPinInput('');
    setPinConfirmInput('');
  };

  const handleDisablePasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDisablePinError('');

    if (disablePinInput !== passcode) {
      setDisablePinError('Incorrect passcode.');
      return;
    }

    setPasscode(null);
    setIsDisableLockOpen(false);
    setDisablePinInput('');
  };

  // 8. Reset Data Submit
  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (resetConfirmationText !== 'RESET') return;
    resetData();
    setIsResetConfirmOpen(false);
    setResetConfirmationText('');
  };

  return (
    <div className="flex flex-col gap-6 animate-enter">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Settings</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Configure your treasury, themes, and manage data.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left/Middle section: Fund Manager */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Active Funds List Card */}
          <Card className="border border-neutral-100 dark:border-neutral-800 shadow-xs">
            <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-4 flex items-center gap-2">
              <LayoutGrid className="h-4 w-4" /> Fund Manager
            </h2>

            <div className="flex flex-col gap-3">
              {activeFunds.map((fund, index) => {
                const IconComponent = fundIcons[fund.icon] || LayoutGrid;
                const pastelStyle = getPastelStyles(fund.color);

                return (
                  <div
                    key={fund.id}
                    className="p-4 rounded-xl border border-neutral-150/80 dark:border-neutral-850 flex items-center justify-between gap-4 bg-neutral-50/25 dark:bg-neutral-900/30 transition-all duration-150"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="h-10 w-10 rounded-xl flex items-center justify-center border"
                        style={pastelStyle}
                      >
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="font-semibold text-sm text-neutral-800 dark:text-neutral-200">{fund.name}</span>
                        <span className="text-[9px] text-neutral-500 dark:text-neutral-400 block uppercase font-mono mt-0.5">
                          Order Index: {index}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {/* Move Up */}
                      <button
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        className="p-1.5 rounded-lg text-neutral-450 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                        title="Move Up"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>

                      {/* Move Down */}
                      <button
                        onClick={() => handleMoveDown(index)}
                        disabled={index === activeFunds.length - 1}
                        className="p-1.5 rounded-lg text-neutral-450 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                        title="Move Down"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => handleOpenEditModal(fund)}
                        className="p-1.5 rounded-lg text-neutral-450 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-800 dark:hover:text-neutral-200 cursor-pointer"
                        title="Customize Fund"
                      >
                        <Edit className="h-4 w-4" />
                      </button>

                      {/* Archive */}
                      <button
                        onClick={() => handleArchiveFund(fund.id)}
                        disabled={activeFunds.length <= 1}
                        className="p-1.5 rounded-lg text-neutral-450 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-500 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                        title="Archive Fund"
                      >
                        <Archive className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Add New Fund Form Card */}
          <Card className="border border-neutral-150/40 dark:border-neutral-800 shadow-xs">
            <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-4 flex items-center gap-2">
              <Plus className="h-4.5 w-4.5" /> Add New Active Fund
            </h2>

            <form onSubmit={handleAddFundSubmit} className="flex flex-col gap-4">
              <Input
                label="Fund Name"
                placeholder="e.g. Vacation Fund, Retirement Fund"
                value={newFundName}
                onChange={(e) => setNewFundName(e.target.value)}
                required
              />

              {/* Color Presets */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                  <Palette className="h-3.5 w-3.5" /> Select Fund Theme Color
                </span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {defaultPastelColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewFundColor(color)}
                      className={`h-7 w-7 rounded-full border transition-transform cursor-pointer hover:scale-110 shrink-0 ${
                        newFundColor === color ? 'border-neutral-900 scale-105 shadow-md dark:border-neutral-100' : 'border-neutral-200 dark:border-neutral-800'
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                  {/* Custom Color Input Pick */}
                  <div className="relative h-7 w-7 rounded-full border border-neutral-200 dark:border-neutral-800 overflow-hidden cursor-pointer hover:scale-110 shrink-0">
                    <input
                      type="color"
                      value={newFundColor}
                      onChange={(e) => setNewFundColor(e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer h-full w-full"
                    />
                    <div className="h-full w-full flex items-center justify-center text-[9px] font-bold text-neutral-500 dark:text-neutral-400 uppercase leading-none bg-neutral-100 dark:bg-neutral-800">
                      +
                    </div>
                  </div>
                </div>
              </div>

              {/* Icon Picker Grid */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                  Select Fund Icon
                </span>
                <div className="grid grid-cols-6 sm:grid-cols-9 gap-2 mt-1 p-3 bg-neutral-50 dark:bg-neutral-900/40 rounded-xl border border-neutral-150/50 dark:border-neutral-850">
                  {Object.keys(fundIcons).map((iconKey) => {
                    const Icon = fundIcons[iconKey];
                    const isSelected = newFundIcon === iconKey;
                    return (
                      <button
                        key={iconKey}
                        type="button"
                        onClick={() => setNewFundIcon(iconKey)}
                        className={`p-2 rounded-lg border flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer ${
                          isSelected
                            ? 'border-neutral-900 bg-neutral-100 dark:border-neutral-100 dark:bg-neutral-800'
                            : 'border-transparent text-neutral-500'
                        }`}
                        title={iconKey}
                      >
                        <Icon className="h-4 w-4" />
                      </button>
                    );
                  })}
                </div>
              </div>

              <Input
                type="number"
                step="any"
                label="Monthly Spending Budget Limit (Optional)"
                placeholder="e.g. 1000.00"
                value={newFundBudget}
                onChange={(e) => setNewFundBudget(e.target.value)}
              />

              <Button type="submit" variant="primary" className="py-2.5 mt-2 justify-center">
                Create Fund
              </Button>
            </form>
          </Card>

          {/* Archived Funds Restore Card */}
          {archivedFunds.length > 0 && (
            <Card className="border border-neutral-150/40 dark:border-neutral-800 shadow-xs">
              <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-4 flex items-center gap-2">
                <Archive className="h-4.5 w-4.5" /> Archived Funds ({archivedFunds.length})
              </h2>
              <div className="flex flex-col gap-3">
                {archivedFunds.map((fund) => {
                  const Icon = fundIcons[fund.icon] || LayoutGrid;
                  return (
                    <div
                      key={fund.id}
                      className="p-3 rounded-xl border border-neutral-100 dark:border-neutral-850 flex items-center justify-between gap-4 bg-neutral-100/10"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="h-8 w-8 rounded-lg flex items-center justify-center text-xs border"
                          style={{
                            backgroundColor: `${fund.color}15`,
                            color: fund.color,
                            borderColor: `${fund.color}30`,
                          }}
                        >
                          <Icon className="h-4.5 w-4.5" />
                        </div>
                        <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 line-through">
                          {fund.name}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => restoreFund(fund.id)}
                        className="py-1 px-3 text-xs"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Restore
                      </Button>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Recurring Transactions Manager Card */}
          <Card className="border border-neutral-100 dark:border-neutral-800 shadow-xs">
            <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-4 flex items-center gap-2">
              <RefreshCw className="h-4.5 w-4.5 text-neutral-500 dark:text-neutral-400" />
              Recurring Transactions ({recurringTransactions.length})
            </h2>

            <div className="flex flex-col gap-5">
              {/* Add Recurring Transaction Form */}
              <form onSubmit={handleAddRecurringSubmit} className="p-4 rounded-xl border border-neutral-150/60 dark:border-neutral-850/80 bg-neutral-50/10 dark:bg-neutral-900/10 flex flex-col gap-4">
                <h3 className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">Schedule New Transaction</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Transaction Title"
                    placeholder="e.g. Netflix Subscription"
                    value={recTitle}
                    onChange={(e) => setRecTitle(e.target.value)}
                    required
                  />
                  <Input
                    type="number"
                    step="any"
                    label="Amount"
                    placeholder="0.00"
                    value={recAmount}
                    onChange={(e) => setRecAmount(e.target.value)}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Select
                    label="Transaction Type"
                    value={recType}
                    options={[
                      { value: 'expense', label: 'Expense (Debit)' },
                      { value: 'credit', label: 'Income (Credit)' },
                    ]}
                    onChange={(e) => setRecType(e.target.value as 'credit' | 'expense')}
                  />
                  <Select
                    label="Target Fund"
                    value={recFundId}
                    options={activeFunds.map((f) => ({ value: f.id, label: f.name }))}
                    onChange={(e) => setRecFundId(e.target.value)}
                  />
                  <Select
                    label="Category"
                    value={recCategory}
                    options={CATEGORIES.map((c) => ({ value: c, label: c }))}
                    onChange={(e) => setRecCategory(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Frequency"
                    value={recFrequency}
                    options={[
                      { value: 'daily', label: 'Daily' },
                      { value: 'weekly', label: 'Weekly' },
                      { value: 'monthly', label: 'Monthly' },
                      { value: 'yearly', label: 'Yearly' },
                    ]}
                    onChange={(e) => setRecFrequency(e.target.value as any)}
                  />
                  <Input
                    type="date"
                    label="Start Date"
                    value={recStartDate}
                    onChange={(e) => setRecStartDate(e.target.value)}
                    required
                  />
                </div>
                <Input
                  label="Notes (Optional)"
                  placeholder="e.g. Charged on 15th of every month"
                  value={recNotes}
                  onChange={(e) => setRecNotes(e.target.value)}
                />
                <Button type="submit" variant="primary" className="py-2.5 mt-1 justify-center">
                  <Plus className="h-4 w-4" /> Schedule Transaction
                </Button>
              </form>

              {/* List of Schedules */}
              <div className="flex flex-col gap-3">
                {recurringTransactions.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl bg-neutral-50/30 dark:bg-neutral-900/10">
                    <span className="text-xs text-neutral-450 dark:text-neutral-500 font-medium">No recurring transactions scheduled yet.</span>
                  </div>
                ) : (
                  recurringTransactions.map((rec) => {
                    const associatedFund = funds.find((f) => f.id === rec.fundId);
                    const fundColor = associatedFund?.color || '#cbd5e1';
                    const fundName = associatedFund?.name || 'Unknown Fund';

                    return (
                      <div
                        key={rec.id}
                        className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                          rec.active
                            ? 'border-neutral-150/70 dark:border-neutral-800/80 bg-neutral-50/20 dark:bg-neutral-900/10'
                            : 'border-neutral-100 dark:border-neutral-850 bg-neutral-100/5 dark:bg-neutral-950/5 opacity-60'
                        }`}
                      >
                        <div className="flex flex-col gap-1.5 min-w-0">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="font-semibold text-sm text-neutral-800 dark:text-neutral-200 truncate">
                              {rec.title}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                              rec.type === 'credit'
                                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-100/30'
                                : 'bg-rose-50 text-rose-600 dark:bg-rose-955/20 dark:text-rose-400 border border-rose-100/30'
                            }`}>
                              {rec.type === 'credit' ? '+' : '-'}{currency}{rec.amount.toFixed(2)}
                            </span>
                            <span className="text-[10px] font-bold text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full border border-neutral-200/20 capitalize shrink-0">
                              {rec.frequency}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-neutral-450 dark:text-neutral-555 flex-wrap">
                            <span className="flex items-center gap-1.5">
                              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: fundColor }} />
                              {fundName}
                            </span>
                            <span className="text-[11px] font-medium px-1.5 py-0.25 bg-neutral-100 dark:bg-neutral-850 rounded text-neutral-500 dark:text-neutral-400">
                              {rec.category}
                            </span>
                            <span className="font-mono text-[11px]">
                              Next run: {rec.nextDate}
                            </span>
                          </div>
                          {rec.notes && (
                            <span className="text-xs text-neutral-450 italic mt-0.5 truncate">{rec.notes}</span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                          <button
                            type="button"
                            onClick={() => toggleRecurringTransaction(rec.id)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                              rec.active
                                ? 'bg-emerald-50/10 text-emerald-600 border-emerald-200/50 hover:bg-emerald-50/20 dark:text-emerald-400 dark:border-emerald-900/30'
                                : 'bg-neutral-100/30 text-neutral-500 border-neutral-200 dark:bg-neutral-800/30 dark:text-neutral-400 dark:border-neutral-800 hover:bg-neutral-100/50'
                            }`}
                          >
                            {rec.active ? 'Active' : 'Paused'}
                          </button>
                          <Button
                            size="sm"
                            type="button"
                            variant="ghost"
                            onClick={() => deleteRecurringTransaction(rec.id)}
                            className="text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-955/20 hover:text-rose-600 p-2 rounded-lg"
                            title="Delete Schedule"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Right Section: System Preference and Backup & Restore */}
        <div className="flex flex-col gap-6">
          {/* Preferences Card */}
          <Card className="border border-neutral-150/40 dark:border-neutral-800 shadow-xs">
            <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-4 flex items-center gap-2">
              <SettingsIcon className="h-4.5 w-4.5" /> Preferences
            </h2>

            <div className="flex flex-col gap-4">
              <Select
                label="Currency Symbol"
                options={currencyOptions}
                value={currencyOptions.some((o) => o.value === currency) ? currency : '₹'}
                onChange={(e) => updateCurrency(e.target.value)}
              />

              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">Color Theme Mode</span>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {(['light', 'dark', 'system'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => updateTheme(t)}
                      className={`py-2 px-3 text-xs font-semibold rounded-xl capitalize border transition-all cursor-pointer text-center ${
                        theme === t
                          ? 'border-neutral-900 bg-neutral-900 text-neutral-50 dark:border-neutral-100 dark:bg-neutral-50 dark:text-neutral-950 font-bold'
                          : 'border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Security Passcode Card */}
          <Card className="border border-neutral-150/40 dark:border-neutral-800 shadow-xs">
            <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-4 flex items-center gap-2">
              <Shield className="h-4.5 w-4.5 text-neutral-500" /> Security
            </h2>
            
            <div className="flex flex-col gap-3">
              <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                Protect your account data with a local 4-digit PIN lock.
              </span>
              
              {passcode ? (
                <div className="flex flex-col gap-2 mt-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                    <Lock className="h-4 w-4 shrink-0" />
                    PIN protection is currently active.
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <Button 
                      type="button"
                      variant="outline" 
                      onClick={() => {
                        setPinInput('');
                        setPinConfirmInput('');
                        setPinError('');
                        setIsSecurityModalOpen(true);
                      }}
                      className="py-2.5 text-xs justify-center"
                    >
                      Change PIN
                    </Button>
                    <Button 
                      type="button"
                      variant="secondary" 
                      onClick={() => {
                        setDisablePinInput('');
                        setDisablePinError('');
                        setIsDisableLockOpen(true);
                      }}
                      className="py-2.5 text-xs text-rose-500 hover:text-rose-600 dark:text-rose-450 dark:hover:text-rose-400 justify-center"
                    >
                      Disable PIN
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2 mt-1">
                  <div className="text-xs text-neutral-400 dark:text-neutral-500 italic bg-neutral-50 dark:bg-neutral-900/50 p-2.5 rounded-xl border border-neutral-100 dark:border-neutral-850">
                    PIN protection is currently disabled.
                  </div>
                  <Button 
                    type="button"
                    variant="primary" 
                    onClick={() => {
                      setPinInput('');
                      setPinConfirmInput('');
                      setPinError('');
                      setIsSecurityModalOpen(true);
                    }}
                    className="w-full py-2.5 text-xs justify-center mt-1"
                  >
                    Enable PIN Lock
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Backup & Restore Data Card */}
          <Card className="border border-neutral-150/40 dark:border-neutral-800 shadow-xs flex flex-col gap-4">
            <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
              <Download className="h-4.5 w-4.5" /> Data Backup & Restore
            </h2>

            {/* Export */}
            <div className="flex flex-col gap-2">
              <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Export workspace data to JSON backup</span>
              <Button onClick={handleExportData} variant="outline" className="w-full justify-center py-2.5">
                <Download className="h-4 w-4" /> Export Backup JSON
              </Button>
            </div>

            {/* Import */}
            <div className="flex flex-col gap-2 mt-2 pt-4 border-t border-neutral-100 dark:border-neutral-850/60">
              <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Restore workspace data from backup</span>
              
              <form onSubmit={handleImportSubmit} className="flex flex-col gap-3">
                <input
                  id="import-file-input"
                  type="file"
                  accept=".json"
                  onChange={handleImportFileChange}
                  className="w-full text-xs text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-neutral-100 file:text-neutral-700 dark:file:bg-neutral-800 dark:file:text-neutral-200 hover:file:bg-neutral-200 dark:hover:file:bg-neutral-700 cursor-pointer"
                />

                {importError && (
                  <span className="text-xs text-rose-500 font-medium bg-rose-50 dark:bg-rose-950/20 p-2.5 rounded-lg border border-rose-100 dark:border-rose-900/30">
                    {importError}
                  </span>
                )}

                {importSuccess && (
                  <span className="text-xs text-emerald-600 dark:text-emerald-500 font-medium bg-emerald-50 dark:bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-100 dark:border-emerald-900/30 flex items-center gap-1.5">
                    <FileCheck className="h-4 w-4" /> Data restored successfully!
                  </span>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  disabled={!importFile}
                  className="w-full justify-center py-2"
                >
                  <Upload className="h-4 w-4" /> Import and Restore
                </Button>
              </form>
            </div>
          </Card>

          {/* Reset All Data Card */}
          <Card className="border border-rose-200/50 dark:border-rose-950/40 bg-rose-50/10 dark:bg-rose-950/5 p-6 shadow-xs flex flex-col gap-4">
            <h2 className="text-sm font-semibold text-rose-600 dark:text-rose-500 flex items-center gap-2">
              <AlertTriangle className="h-4.5 w-4.5" /> Danger Zone
            </h2>

            <div className="flex flex-col gap-2">
              <span className="text-xs text-neutral-500 dark:text-neutral-400 leading-normal">
                Resetting deletes all funds, transactions, reminders, notes, and resets configurations. This cannot be undone.
              </span>
              <Button
                onClick={() => setIsResetConfirmOpen(true)}
                variant="danger"
                className="w-full py-2.5 justify-center mt-1"
              >
                Reset All Data
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* ========================================== */}
      {/* DIALOGS / MODALS SECTION                    */}
      {/* ========================================== */}

      {/* 1. Edit Fund Modal */}
      {editingFund && (
        <Dialog
          isOpen={!!editingFund}
          onClose={() => setEditingFund(null)}
          title={`Customize Fund: ${editingFund.name}`}
        >
          <form onSubmit={handleEditFundSubmit} className="flex flex-col gap-4">
            <Input
              label="Rename Fund"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
            />

            {/* Colors */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-neutral-450 dark:text-neutral-450">
                Change Color Theme
              </span>
              <div className="flex flex-wrap gap-2 mt-1">
                {defaultPastelColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setEditColor(color)}
                    className={`h-7 w-7 rounded-full border transition-transform cursor-pointer hover:scale-110 shrink-0 ${
                      editColor === color ? 'border-neutral-900 scale-105 shadow-md dark:border-neutral-100' : 'border-neutral-200 dark:border-neutral-800'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
                {/* Color input */}
                <div className="relative h-7 w-7 rounded-full border border-neutral-200 dark:border-neutral-800 overflow-hidden cursor-pointer hover:scale-110 shrink-0">
                  <input
                    type="color"
                    value={editColor}
                    onChange={(e) => setEditColor(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer h-full w-full"
                  />
                  <div className="h-full w-full flex items-center justify-center text-[9px] font-bold text-neutral-450 bg-neutral-150 dark:bg-neutral-800 leading-none">
                    +
                  </div>
                </div>
              </div>
            </div>

            {/* Icons */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-neutral-450 dark:text-neutral-450">
                Change Icon
              </span>
              <div className="grid grid-cols-6 gap-2 mt-1 p-3 bg-neutral-50 dark:bg-neutral-900/40 rounded-xl border border-neutral-150/50 dark:border-neutral-850">
                {Object.keys(fundIcons).map((iconKey) => {
                  const Icon = fundIcons[iconKey];
                  const isSelected = editIcon === iconKey;
                  return (
                    <button
                      key={iconKey}
                      type="button"
                      onClick={() => setEditIcon(iconKey)}
                      className={`p-2 rounded-lg border flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer ${
                        isSelected
                          ? 'border-neutral-900 bg-neutral-100 dark:border-neutral-100 dark:bg-neutral-800'
                          : 'border-transparent text-neutral-500'
                      }`}
                      title={iconKey}
                    >
                      <Icon className="h-4.5 w-4.5" />
                    </button>
                  );
                })}
              </div>
            </div>

            <Input
              type="number"
              step="any"
              label="Monthly Spending Budget Limit (Optional)"
              placeholder="e.g. 500.00 (leave blank for no budget)"
              value={editBudget}
              onChange={(e) => setEditBudget(e.target.value)}
            />

            <div className="flex justify-end gap-3 border-t border-neutral-100 dark:border-neutral-850/60 pt-4 mt-2">
              <Button type="button" variant="secondary" onClick={() => setEditingFund(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Save Changes
              </Button>
            </div>
          </form>
        </Dialog>
      )}

      {/* 2. Reset Confirmation Modal */}
      <Dialog isOpen={isResetConfirmOpen} onClose={() => setIsResetConfirmOpen(false)} title="Destroy Workspace Data">
        <form onSubmit={handleResetSubmit} className="flex flex-col gap-4">
          <div className="p-4 rounded-xl border border-rose-100 dark:border-rose-900/25 bg-rose-50/20 dark:bg-rose-955/10 flex gap-3">
            <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-800 dark:text-rose-400 leading-normal">
              This will permanently delete all records including fund logs, transactions, reconciliations, reminders, and currency notes.
            </div>
          </div>

          <Input
            label='To confirm this operation, type "RESET" in capitals'
            placeholder="Type RESET"
            value={resetConfirmationText}
            onChange={(e) => setResetConfirmationText(e.target.value)}
            required
          />

          <div className="flex justify-end gap-3 border-t border-neutral-100 dark:border-neutral-850/60 pt-4 mt-2">
            <Button type="button" variant="secondary" onClick={() => setIsResetConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              disabled={resetConfirmationText !== 'RESET'}
            >
              Destroy Data
            </Button>
          </div>
        </form>
      </Dialog>

      {/* 3. Enable/Change Passcode Dialog */}
      <Dialog isOpen={isSecurityModalOpen} onClose={() => setIsSecurityModalOpen(false)} title={passcode ? "Change Passcode Lock" : "Enable Passcode Lock"}>
        <form onSubmit={handleSetPasscodeSubmit} className="flex flex-col gap-4">
          <div className="text-xs text-neutral-500 dark:text-neutral-400 leading-normal">
            Enter a 4-digit numeric code to protect your personal finance dashboard.
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              type="password"
              pattern="[0-9]*"
              inputMode="numeric"
              maxLength={4}
              label="Enter 4-Digit PIN"
              placeholder="e.g. 1234"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
              required
            />
            <Input
              type="password"
              pattern="[0-9]*"
              inputMode="numeric"
              maxLength={4}
              label="Confirm 4-Digit PIN"
              placeholder="e.g. 1234"
              value={pinConfirmInput}
              onChange={(e) => setPinConfirmInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
              required
            />
          </div>

          {pinError && (
            <span className="text-xs text-rose-500 font-medium bg-rose-50 dark:bg-rose-955/15 p-2 rounded-lg border border-rose-100 dark:border-rose-900/30">
              {pinError}
            </span>
          )}

          <div className="flex justify-end gap-3 border-t border-neutral-100 dark:border-neutral-850/60 pt-4 mt-2">
            <Button type="button" variant="secondary" onClick={() => setIsSecurityModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={pinInput.length !== 4 || pinConfirmInput.length !== 4}
            >
              Save Passcode
            </Button>
          </div>
        </form>
      </Dialog>

      {/* 4. Disable Passcode Dialog */}
      <Dialog isOpen={isDisableLockOpen} onClose={() => setIsDisableLockOpen(false)} title="Disable Passcode Lock">
        <form onSubmit={handleDisablePasscodeSubmit} className="flex flex-col gap-4">
          <div className="text-xs text-neutral-500 dark:text-neutral-400 leading-normal">
            To disable PIN protection, please verify your current 4-digit passcode.
          </div>

          <Input
            type="password"
            pattern="[0-9]*"
            inputMode="numeric"
            maxLength={4}
            label="Enter Current PIN"
            placeholder="e.g. 1234"
            value={disablePinInput}
            onChange={(e) => setDisablePinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
            required
          />

          {disablePinError && (
            <span className="text-xs text-rose-500 font-medium bg-rose-50 dark:bg-rose-955/15 p-2 rounded-lg border border-rose-100 dark:border-rose-900/30">
              {disablePinError}
            </span>
          )}

          <div className="flex justify-end gap-3 border-t border-neutral-100 dark:border-neutral-850/60 pt-4 mt-2">
            <Button type="button" variant="secondary" onClick={() => setIsDisableLockOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              disabled={disablePinInput.length !== 4}
            >
              Deactivate Protection
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
export default Settings;
