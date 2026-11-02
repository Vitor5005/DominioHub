import type {
  ButtonHTMLAttributes,
  ReactNode,
} from 'react';

import { cn } from '../../lib/cn';

type IconButtonVariant =
  | 'default'
  | 'ghost'
  | 'danger';

interface IconButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  variant?: IconButtonVariant;
  'aria-label': string;
}

export function IconButton({
  icon,
  variant = 'default',
  className,
  type = 'button',
  ...props
}: IconButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={cn(
        'ui-icon-button',
        `ui-icon-button--${variant}`,
        className,
      )}
    >
      {icon}
    </button>
  );
}
