import type {
  ReactNode,
} from 'react';

import { cn } from '../../lib/cn';

export type BadgeTone =
  | 'neutral'
  | 'indigo'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger';

interface BadgeProps {
  tone?: BadgeTone;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Badge({
  tone = 'neutral',
  icon,
  children,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'ui-badge',
        `ui-badge--${tone}`,
        className,
      )}
    >
      {icon && (
        <span className="ui-badge__icon">
          {icon}
        </span>
      )}

      {children}
    </span>
  );
}
