import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'max-w-lg',
  className = ''
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none animate-fade-in">
      <div className={`relative w-full ${maxWidth} bg-hub-surface border border-hub-border rounded-[28px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col ${className}`}>
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-hub-border flex items-center justify-between bg-hub-surface-elevated/40">
          <div>
            {title && (
              <h3 className="font-display text-base sm:text-lg font-bold text-hub-text-primary">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-xs text-hub-text-secondary mt-0.5">
                {description}
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-hub-text-tertiary hover:text-hub-text-primary hover:bg-hub-surface-elevated transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}
