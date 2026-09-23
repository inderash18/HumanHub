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
    <div className="w-full space-y-1 text-left">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-medium text-[var(--text-secondary)]">
          {label} {required && <span className="text-[#ED4956]">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {Icon && (
          <Icon className="absolute left-3 w-4 h-4 text-[var(--text-tertiary)] pointer-events-none" />
        )}

        <input
          id={inputId}
          ref={ref}
          className={`
            w-full bg-[var(--surface-elevated)] border text-[var(--text-primary)] text-xs rounded-lg px-3 py-2 outline-none transition-all duration-150
            ${Icon ? 'pl-9' : ''}
            ${endAction ? 'pr-9' : ''}
            ${error ? 'border-[#ED4956] focus:border-[#ED4956]' : 'border-[var(--border)] focus:border-[var(--text-secondary)]'}
            placeholder:text-[var(--text-tertiary)]
            disabled:opacity-50 disabled:cursor-not-allowed
            ${className}
          `}
          {...props}
        />

        {endAction && (
          <div className="absolute right-3 flex items-center">
            {endAction}
          </div>
        )}
      </div>

      {error ? (
        <p className="text-[11px] text-[#ED4956] font-normal">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-[var(--text-tertiary)]">{helperText}</p>
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
    <div className="w-full space-y-1 text-left">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-medium text-[var(--text-secondary)]">
          {label} {required && <span className="text-[#ED4956]">*</span>}
        </label>
      )}

      <textarea
        id={inputId}
        ref={ref}
        rows={rows}
        className={`
          w-full bg-[var(--surface-elevated)] border text-[var(--text-primary)] text-xs rounded-lg p-3 outline-none transition-all duration-150 resize-none
          ${error ? 'border-[#ED4956] focus:border-[#ED4956]' : 'border-[var(--border)] focus:border-[var(--text-secondary)]'}
          placeholder:text-[var(--text-tertiary)]
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
        {...props}
      />

      {error ? (
        <p className="text-[11px] text-[#ED4956] font-normal">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-[var(--text-tertiary)]">{helperText}</p>
      ) : null}
    </div>
  );
});

export default Input;
