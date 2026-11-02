import {
  type ReactNode,
  type SelectHTMLAttributes,
  useId,
} from 'react';

import { ChevronDown } from 'lucide-react';

import { cn } from '../../lib/cn';

interface SelectProps
  extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}

export function Select({
  id,
  label,
  error,
  hint,
  children,
  className,
  disabled,
  ...props
}: SelectProps) {
  const generatedId = useId();

  const selectId =
    id ?? generatedId;

  const errorId =
    `${selectId}-error`;

  const hintId =
    `${selectId}-hint`;

  const describedBy = [
    hint ? hintId : null,
    error ? errorId : null,
  ]
    .filter(Boolean)
    .join(' ') || undefined;

  return (
    <label
      className={cn(
        'ui-field',
        disabled &&
          'ui-field--disabled',
      )}
      htmlFor={selectId}
    >
      <span className="ui-field__label">
        {label}
      </span>

      <span
        className={cn(
          'ui-select-shell',
          error &&
            'ui-select-shell--error',
          disabled &&
            'ui-select-shell--disabled',
        )}
      >
        <select
          {...props}
          id={selectId}
          disabled={disabled}
          aria-invalid={
            Boolean(error) ||
            undefined
          }
          aria-describedby={
            describedBy
          }
          className={cn(
            'ui-select',
            className,
          )}
        >
          {children}
        </select>

        <ChevronDown
          size={16}
          aria-hidden="true"
        />
      </span>

      {hint && !error && (
        <span
          id={hintId}
          className="ui-field__hint"
        >
          {hint}
        </span>
      )}

      {error && (
        <span
          id={errorId}
          className="ui-field__error"
        >
          {error}
        </span>
      )}
    </label>
  );
}
