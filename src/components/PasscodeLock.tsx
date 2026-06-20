import React, { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Lock, Delete, AlertTriangle } from 'lucide-react';
import { Button, Input } from './ui/Common';
import Dialog from './ui/Dialog';

export const PasscodeLock: React.FC = () => {
  const { unlockApp, resetData } = useFinance();
  const [pin, setPin] = useState<string>('');
  const [wobble, setWobble] = useState<boolean>(false);
  const [isResetOpen, setIsResetOpen] = useState<boolean>(false);
  const [resetConfirm, setResetConfirm] = useState<string>('');

  // Handle number input
  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
    }
  };

  // Handle backspace
  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  // Check PIN when it reaches 4 digits
  useEffect(() => {
    if (pin.length === 4) {
      const success = unlockApp(pin);
      if (!success) {
        // Trigger wobble animation and clear
        setWobble(true);
        const timer = setTimeout(() => {
          setWobble(false);
          setPin('');
        }, 600);
        return () => clearTimeout(timer);
      }
    }
  }, [pin, unlockApp]);

  const handleSelfDestruct = (e: React.FormEvent) => {
    e.preventDefault();
    if (resetConfirm === 'RESET') {
      resetData();
      setIsResetOpen(false);
      setResetConfirm('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-neutral-950 text-neutral-50 px-6 select-none animate-fade-in">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        
        {/* Title & Icon Header */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="h-14 w-14 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 shadow-md">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">App Lock Active</h1>
          <p className="text-xs text-neutral-500 max-w-[250px] leading-relaxed">
            Please enter your 4-digit security PIN to access your personal treasury.
          </p>
        </div>

        {/* 4 PIN Dots Indicator */}
        <div 
          className={`flex gap-5 justify-center py-4 ${
            wobble ? 'animate-shake text-rose-500' : ''
          }`}
        >
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className={`h-4.5 w-4.5 rounded-full border-2 transition-all duration-150 ${
                wobble 
                  ? 'border-rose-500 bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                  : index < pin.length
                    ? 'bg-neutral-100 border-neutral-100 shadow-[0_0_8px_rgba(255,255,255,0.4)] scale-110'
                    : 'border-neutral-800 bg-transparent'
              }`}
            />
          ))}
        </div>

        {/* 3x4 Numeric Keypad */}
        <div className="grid grid-cols-3 gap-y-4 gap-x-6 w-full px-6">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleKeyPress(num)}
              className="h-16 w-16 rounded-full border border-neutral-900 bg-neutral-900/60 hover:bg-neutral-900 active:bg-neutral-850 text-xl font-semibold flex items-center justify-center cursor-pointer transition-all duration-150 active:scale-95 focus:outline-none"
            >
              {num}
            </button>
          ))}
          
          {/* Bottom row of keypad */}
          <button
            type="button"
            onClick={() => setIsResetOpen(true)}
            className="h-16 w-16 text-[10px] font-bold text-rose-500 hover:text-rose-400 active:scale-95 flex items-center justify-center cursor-pointer focus:outline-none capitalize text-center leading-tight"
          >
            Reset App
          </button>
          
          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="h-16 w-16 rounded-full border border-neutral-900 bg-neutral-900/60 hover:bg-neutral-900 active:bg-neutral-850 text-xl font-semibold flex items-center justify-center cursor-pointer transition-all duration-150 active:scale-95 focus:outline-none"
          >
            0
          </button>
          
          <button
            type="button"
            onClick={handleBackspace}
            disabled={pin.length === 0}
            className="h-16 w-16 rounded-full border border-transparent bg-transparent hover:bg-neutral-900/40 text-neutral-400 disabled:opacity-20 flex items-center justify-center cursor-pointer transition-all duration-150 active:scale-95 focus:outline-none"
          >
            <Delete className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Shake Keyframe animations embedded via style */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
        .animate-fade-in {
          animation: fadeIn 0.25s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>

      {/* PIN Forgotten Reset Dialog */}
      <Dialog 
        isOpen={isResetOpen} 
        onClose={() => setIsResetOpen(false)} 
        title="Destroy & Reset Workspace"
      >
        <form onSubmit={handleSelfDestruct} className="flex flex-col gap-4">
          <div className="p-4 rounded-xl border border-rose-900/30 bg-rose-955/15 flex gap-3 text-rose-450">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="text-xs leading-normal">
              <strong>Forgotten PIN?</strong> The security passcode prevents unauthorized access. To bypass it, you must wipe all your local files, transaction logs, and settings. This action is permanent.
            </div>
          </div>

          <Input
            label='To confirm self-destruct, type "RESET" in capitals'
            placeholder="Type RESET"
            value={resetConfirm}
            onChange={(e) => setResetConfirm(e.target.value)}
            required
            className="bg-neutral-900 text-neutral-100 border-neutral-800"
          />

          <div className="flex justify-end gap-3 border-t border-neutral-800/80 pt-4 mt-2">
            <Button type="button" variant="secondary" onClick={() => setIsResetOpen(false)} className="bg-neutral-900 text-neutral-300 hover:bg-neutral-800 border-neutral-800">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              disabled={resetConfirm !== 'RESET'}
            >
              Destroy Data
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};

export default PasscodeLock;
