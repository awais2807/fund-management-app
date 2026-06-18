import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
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

  // Edit Fund Modal State
  const [editingFund, setEditingFund] = useState<Fund | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editIcon, setEditIcon] = useState('');

  // Import State
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState(false);

  // Reset State
  const [resetConfirmationText, setResetConfirmationText] = useState('');
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

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
    addFund(newFundName.trim(), newFundColor, newFundIcon);
    setNewFundName('');
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
  };

  // 3. Edit Fund Submit
  const handleEditFundSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFund || !editName.trim()) return;
    updateFund(editingFund.id, {
      name: editName.trim(),
      color: editColor,
      icon: editIcon,
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
    </div>
  );
};
export default Settings;
