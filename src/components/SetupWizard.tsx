import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Card, Button, Input, Select } from './ui/Common';
import { Wallet, Sparkles } from 'lucide-react';

export const SetupWizard: React.FC = () => {
  const { setupApp } = useFinance();
  
  const [currencySymbol, setCurrencySymbol] = useState('₹');
  const [customCurrency, setCustomCurrency] = useState('');
  const [isCustomCurrency, setIsCustomCurrency] = useState(false);
  
  const [projectBalance, setProjectBalance] = useState('0');
  const [homeBalance, setHomeBalance] = useState('0');
  const [personalBalance, setPersonalBalance] = useState('0');

  const currencyOptions = [
    { value: '₹', label: 'INR (₹)' },
    { value: '$', label: 'USD ($)' },
    { value: '€', label: 'EUR (€)' },
    { value: '£', label: 'GBP (£)' },
    { value: '¥', label: 'JPY/CNY (¥)' },
    { value: 'custom', label: 'Other (Custom...)' },
  ];

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'custom') {
      setIsCustomCurrency(true);
      setCurrencySymbol('');
    } else {
      setIsCustomCurrency(false);
      setCurrencySymbol(val);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalCurrency = isCustomCurrency ? customCurrency.trim() || '₹' : currencySymbol;
    
    const balances = {
      project: parseFloat(projectBalance) || 0,
      home: parseFloat(homeBalance) || 0,
      personal: parseFloat(personalBalance) || 0,
    };

    setupApp(finalCurrency, balances);
  };

  return (
    <div className="h-full w-full overflow-y-auto flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 p-4 transition-colors duration-250">
      <div className="w-full max-w-lg animate-enter">
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="h-14 w-14 rounded-2xl bg-neutral-900 dark:bg-neutral-100 flex items-center justify-center text-white dark:text-neutral-950 mb-3 shadow-lg">
            <Wallet className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            Personal Finance <Sparkles className="h-5 w-5 text-amber-500 fill-amber-500" />
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 max-w-sm">
            Set up your custom personal finance workspace in less than a minute.
          </p>
        </div>

        <Card className="border border-neutral-150/60 dark:border-neutral-800/80 shadow-xl">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <h2 className="text-base font-semibold text-neutral-800 dark:text-neutral-250 pb-2 border-b border-neutral-100 dark:border-neutral-850">
              Initial Workspace Setup
            </h2>

            {/* Currency configuration */}
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Select
                  label="Primary Currency"
                  options={currencyOptions}
                  onChange={handleCurrencyChange}
                  value={isCustomCurrency ? 'custom' : currencySymbol}
                />
              </div>
              {isCustomCurrency && (
                <div className="flex-1">
                  <Input
                    label="Custom Symbol"
                    placeholder="e.g. AUD, ₪"
                    value={customCurrency}
                    onChange={(e) => setCustomCurrency(e.target.value)}
                    required
                  />
                </div>
              )}
            </div>

            {/* Opening Balances */}
            <div className="flex flex-col gap-4">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-450 dark:text-neutral-500">
                Opening Fund Balances
              </label>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="p-4 rounded-xl border border-neutral-150/80 dark:border-neutral-800 bg-[#BAD7E9]/10 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-[#6A9AB0] dark:text-[#BAD7E9]">Project Fund</span>
                    <span className="text-xs text-neutral-400">Freelance, business, or side projects</span>
                  </div>
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    value={projectBalance}
                    onChange={(e) => setProjectBalance(e.target.value)}
                    placeholder="0.00"
                    className="bg-white/80 dark:bg-neutral-900/85"
                  />
                </div>

                <div className="p-4 rounded-xl border border-neutral-150/80 dark:border-neutral-800 bg-[#C1E1C1]/10 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-[#7E997E] dark:text-[#C1E1C1]">Home Fund</span>
                    <span className="text-xs text-neutral-400">Rent, groceries, utilities, home improvement</span>
                  </div>
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    value={homeBalance}
                    onChange={(e) => setHomeBalance(e.target.value)}
                    placeholder="0.00"
                    className="bg-white/80 dark:bg-neutral-900/85"
                  />
                </div>

                <div className="p-4 rounded-xl border border-neutral-150/80 dark:border-neutral-800 bg-[#FFD1B3]/10 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-[#C59275] dark:text-[#FFD1B3]">Personal Fund</span>
                    <span className="text-xs text-neutral-400">Discretionary money, hobbies, entertainment</span>
                  </div>
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    value={personalBalance}
                    onChange={(e) => setPersonalBalance(e.target.value)}
                    placeholder="0.00"
                    className="bg-white/80 dark:bg-neutral-900/85"
                  />
                </div>
              </div>
            </div>

            <Button type="submit" variant="primary" className="w-full py-2.5 mt-2 justify-center">
              Let's Go!
            </Button>
          </form>
        </Card>
        
        <p className="text-center text-xs text-neutral-400 mt-4">
          All fund balances are calculated dynamically from transaction history. We will create initial "Opening Balance" credits to represent these numbers.
        </p>
      </div>
    </div>
  );
};
export default SetupWizard;
