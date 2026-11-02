import {
  type InputHTMLAttributes,
  type ReactNode,
  useId,
} from 'react';

import { cn } from '../../lib/cn';

interface InputProps
  extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  leadingIcon?: ReactNode;
  trailingElement?: ReactNode;
}

export function Input({
  id,
  label,
  error,
  hint,
  leadingIcon,
  trailingElement,
  className,
  disabled,
  ...props
}: InputProps) {
  const generatedId = useId();

  const inputId =
    id ?? generatedId;

  const errorId =
    `${inputId}-error`;

  const hintId =
    `${inputId}-hint`;

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
      htmlFor={inputId}
    >
      <span className="ui-field__label">
        {label}
      </span>

      <span
        className={cn(
          'ui-input-shell',
          error &&
            'ui-input-shell--error',
          disabled &&
            'ui-input-shell--disabled',
        )}
      >
        {leadingIcon && (
          <span className="ui-input-shell__icon">
            {leadingIcon}
          </span>
        )}

        <input
          {...props}
          id={inputId}
          disabled={disabled}
          aria-invalid={
            Boolean(error) ||
            undefined
          }
          aria-describedby={
            describedBy
          }
          className={cn(
            'ui-input',
            Boolean(leadingIcon) &&
            'ui-input--leading',
            Boolean(trailingElement) &&
            'ui-input--trailing',
            className,
          )}
        />

        {trailingElement && (
          <span className="ui-input-shell__trailing">
            {trailingElement}
          </span>
        )}
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
