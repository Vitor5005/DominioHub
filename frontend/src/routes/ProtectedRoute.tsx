import {
  Navigate,
  Outlet,
  useLocation,
} from 'react-router-dom';

import {
  Button,
  ErrorState,
  Spinner,
} from '../components/ui';

import { useAuth } from '../features/auth/useAuth';

export function ProtectedRoute() {
  const {
    status,
    refreshSession,
  } = useAuth();

  const location = useLocation();

  if (status === 'loading') {
    return (
      <main className="auth-state">
        <div className="auth-state__content">
          <Spinner
            size="lg"
            label="Verificando sessão"
          />

          <p>
            Verificando sua sessão...
          </p>
        </div>
      </main>
    );
  }

  if (status === 'error') {
    return (
      <main className="auth-state">
        <ErrorState
          title="Não foi possível acessar o servidor"
          description="Verifique sua conexão e tente novamente."
          action={
            <Button
              onClick={() => {
                void refreshSession();
              }}
            >
              Tentar novamente
            </Button>
          }
        />
      </main>
    );
  }

  if (status === 'anonymous') {
    const from =
      `${location.pathname}${location.search}`;

    return (
      <Navigate
        to="/login"
        replace
        state={{ from }}
      />
    );
  }

  return <Outlet />;
}
