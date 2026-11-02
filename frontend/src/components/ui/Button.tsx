import type {
  ButtonHTMLAttributes,
  ReactNode,
} from 'react';

import { cn } from '../../lib/cn';

import { Spinner } from './Spinner';

type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'danger';

type ButtonSize =
  | 'sm'
  | 'md';

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  leadingIcon,
  trailingIcon,
  className,
  disabled,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      disabled={disabled || loading}
      aria-busy={
        loading || undefined
      }
      className={cn(
        'ui-button',
        `ui-button--${variant}`,
        `ui-button--${size}`,
        className,
      )}
    >
      {loading ? (
        <Spinner
          size="sm"
          label="Carregando"
        />
      ) : (
        leadingIcon
      )}

      <span className="ui-button__label">
        {children}
      </span>

      {!loading && trailingIcon}
    </button>
  );
}
