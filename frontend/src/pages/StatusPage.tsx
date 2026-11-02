import { Link } from 'react-router-dom';

interface StatusPageProps {
  code: string;
  title: string;
  description: string;
}

export function StatusPage({
  code,
  title,
  description,
}: StatusPageProps) {
  return (
    <main className="status-page">
      <div className="status-page__content">
        <span className="status-page__code">
          {code}
        </span>

        <h1>{title}</h1>

        <p>{description}</p>

        <Link
          className="ui-button ui-button--primary ui-button--md status-page__action"
          to="/"
        >
          Voltar à visão geral
        </Link>
      </div>
    </main>
  );
}
