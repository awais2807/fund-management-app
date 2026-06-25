import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | 'max';
}

export const Dialog: React.FC<DialogProps> = ({ isOpen, onClose, title, children, size }) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-neutral-900/30 backdrop-blur-xs transition-opacity duration-200 dark:bg-neutral-950/50"
        onClick={onClose}
      />
      
      {/* Content Container */}
      <div className={`relative z-10 w-full ${
        size === 'sm' ? 'max-w-sm' :
        size === 'md' ? 'max-w-md' :
        size === 'lg' ? 'max-w-lg' :
        size === 'xl' ? 'max-w-xl' :
        size === '2xl' ? 'max-w-2xl' :
        size === '3xl' ? 'max-w-3xl' :
        size === '4xl' ? 'max-w-4xl' :
        size === 'max' ? 'max-w-6xl' : 'max-w-lg'
      } transform rounded-2xl bg-white p-6 shadow-2xl dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 animate-enter max-h-[90vh] flex flex-col`}>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800 shrink-0">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{title}</h3>
          <button 
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Body */}
        <div className="overflow-y-auto mt-4 pr-1 flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};
export default Dialog;
