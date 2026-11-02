import type {
  ReactNode,
} from 'react';

interface PageHeaderProps {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}

export function PageHeader({
  title,
  description,
  action,
}: PageHeaderProps) {
  return (
    <header className="page-header">
      <div className="page-header__content">
        <h1>{title}</h1>

        {description ? (
          <p>{description}</p>
        ) : null}
      </div>

      {action ? (
        <div className="page-header__action">
          {action}
        </div>
      ) : null}
    </header>
  );
}

