import React, { forwardRef } from 'react';

export const Input = forwardRef(function Input({
  label,
  helperText,
  error,
  icon: Icon,
  endAction,
  className = '',
  id,
  required,
  ...props
}, ref) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5 text-left">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-hub-text-secondary">
          {label} {required && <span className="text-hub-accent">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {Icon && (
          <Icon className="absolute left-3.5 w-4 h-4 text-hub-text-tertiary pointer-events-none" />
        )}

        <input
          id={inputId}
          ref={ref}
          className={`
            w-full bg-hub-surface-elevated border text-hub-text-primary text-xs rounded-xl px-3.5 py-2.5 outline-none transition-all
            ${Icon ? 'pl-10' : ''}
            ${endAction ? 'pr-10' : ''}
            ${error ? 'border-hub-danger focus:border-hub-danger' : 'border-hub-border focus:border-hub-trust focus:ring-1 focus:ring-hub-trust'}
            placeholder:text-hub-text-tertiary
            disabled:opacity-50 disabled:cursor-not-allowed
            ${className}
          `}
          {...props}
        />

        {endAction && (
          <div className="absolute right-3.5 flex items-center">
            {endAction}
          </div>
        )}
      </div>

      {error ? (
        <p className="text-[11px] text-hub-danger font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-hub-text-tertiary">{helperText}</p>
      ) : null}
    </div>
  );
});

export const Textarea = forwardRef(function Textarea({
  label,
  helperText,
  error,
  className = '',
  id,
  required,
  rows = 3,
  ...props
}, ref) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5 text-left">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-hub-text-secondary">
          {label} {required && <span className="text-hub-accent">*</span>}
        </label>
      )}

      <textarea
        id={inputId}
        ref={ref}
        rows={rows}
        className={`
          w-full bg-hub-surface-elevated border text-hub-text-primary text-xs rounded-2xl p-3.5 outline-none transition-all resize-none
          ${error ? 'border-hub-danger focus:border-hub-danger' : 'border-hub-border focus:border-hub-trust focus:ring-1 focus:ring-hub-trust'}
          placeholder:text-hub-text-tertiary
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
        {...props}
      />

      {error ? (
        <p className="text-[11px] text-hub-danger font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-hub-text-tertiary">{helperText}</p>
      ) : null}
    </div>
  );
});
