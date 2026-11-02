import type {
  ReactNode,
} from 'react';

import {
  CircleAlert,
} from 'lucide-react';

import {
  cn,
} from '../../lib/cn';

interface ErrorStateProps {
  title: string;
  description: string;
  requestId?: string | null;
  action?: ReactNode;
  className?: string;
}

export function ErrorState({
  title,
  description,
  requestId,
  action,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'ui-error-state',
        className,
      )}
      role="alert"
    >
      <div className="ui-error-state__icon">
        <CircleAlert
          size={22}
          aria-hidden="true"
        />
      </div>

      <div className="ui-error-state__content">
        <h3>
          {title}
        </h3>

        <p>
          {description}
        </p>

        {requestId && (
          <span className="ui-error-state__request">
            Código de suporte:{' '}
            <code>
              {requestId}
            </code>
          </span>
        )}

        {action && (
          <div className="ui-error-state__action">
            {action}
          </div>
        )}
      </div>
    </div>
  );
}
