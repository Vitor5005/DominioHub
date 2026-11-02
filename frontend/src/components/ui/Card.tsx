import type {
  HTMLAttributes,
  ReactNode,
} from 'react';

import { cn } from '../../lib/cn';

type CardPadding =
  | 'none'
  | 'sm'
  | 'md'
  | 'lg';

interface CardProps
  extends Omit<
    HTMLAttributes<HTMLDivElement>,
    'title'
  > {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  padding?: CardPadding;
}

export function Card({
  title,
  description,
  action,
  padding = 'md',
  className,
  children,
  ...props
}: CardProps) {
  return (
    <section
      {...props}
      className={cn(
        'ui-card',
        `ui-card--${padding}`,
        className,
      )}
    >
      {(title ||
        description ||
        action) && (
        <header className="ui-card__header">
          <div>
            {title && (
              <h2 className="ui-card__title">
                {title}
              </h2>
            )}

            {description && (
              <p className="ui-card__description">
                {description}
              </p>
            )}
          </div>

          {action && (
            <div className="ui-card__action">
              {action}
            </div>
          )}
        </header>
      )}

      {children}
    </section>
  );
}
