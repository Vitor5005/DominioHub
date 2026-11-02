import {
  type FormEvent,
  useMemo,
  useState,
} from 'react';

import {
  CircleAlert,
  Eye,
  EyeOff,
} from 'lucide-react';

import {
  Navigate,
  useLocation,
  useNavigate,
} from 'react-router-dom';

import loginIllustration from '../assets/brand/login-illustration.jpg';

import {
  Brand,
} from '../components/brand/Brand';

import {
  Button,
  IconButton,
  Input,
  Spinner,
} from '../components/ui';

import {
  useAuth,
} from '../features/auth/useAuth';

import {
  ApiError,
} from '../services/api-client';

interface LoginLocationState {
  from?: string;
}

interface LoginErrorState {
  message: string;
  requestId?: string | null;
}

function getLoginError(
  error: unknown,
): LoginErrorState {
  if (!(error instanceof ApiError)) {
    return {
      message:
        'Não foi possível acessar sua conta. Tente novamente.',
    };
  }

  if (error.statusCode === 0) {
    return {
      message:
        'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.',
    };
  }

  if (error.statusCode === 401) {
    return {
      message:
        'E-mail ou senha incorretos.',
    };
  }

  if (error.statusCode === 429) {
    return {
      message:
        'Muitas tentativas de acesso foram realizadas. Aguarde alguns minutos e tente novamente.',
    };
  }

  if (
    error.statusCode >= 500
  ) {
    return {
      message:
        'O DomínioHub está temporariamente indisponível. Tente novamente em instantes.',
      requestId: error.requestId,
    };
  }

  return {
    message:
      error.message ||
      'Não foi possível concluir o login.',
    requestId: error.requestId,
  };
}

function isSafeInternalPath(
  value: unknown,
): value is string {
  if (
    typeof value !== 'string'
  ) {
    return false;
  }

  return (
    value.startsWith('/') &&
    !value.startsWith('//')
  );
}

export function LoginPage() {
  const {
    login,
    status,
  } = useAuth();

  const navigate =
    useNavigate();

  const location =
    useLocation();

  const [
    email,
    setEmail,
  ] = useState('');

  const [
    password,
    setPassword,
  ] = useState('');

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    loginError,
    setLoginError,
  ] =
    useState<LoginErrorState | null>(
      null,
    );

  const destination =
    useMemo(() => {
      const locationState =
        location.state as
          | LoginLocationState
          | null;

      if (
        isSafeInternalPath(
          locationState?.from,
        )
      ) {
        return locationState.from;
      }

      return '/';
    }, [location.state]);

  const canSubmit =
    email.trim().length > 0 &&
    password.length > 0 &&
    !submitting;

  if (
    status === 'authenticated'
  ) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    setLoginError(null);
    setSubmitting(true);

    try {
      await login({
        email: email.trim(),
        password,
      });

      navigate(
        destination,
        {
          replace: true,
        },
      );
    } catch (error) {
      setLoginError(
        getLoginError(error),
      );
    } finally {
      setSubmitting(false);
    }
  }

  function clearError() {
    if (loginError) {
      setLoginError(null);
    }
  }

  return (
    <main className="auth-login">
      <section
        className="auth-login__visual"
        aria-hidden="true"
      >
        <img
          className="auth-login__illustration"
          src={loginIllustration}
          alt=""
        />

        <div className="auth-login__visual-overlay" />
      </section>

      <section className="auth-login__panel">
        <div className="auth-login__content">
          <div className="auth-login__brand">
            <Brand />
          </div>

          {status === 'loading' ? (
            <div
              className="auth-login__session-loading"
              role="status"
            >
              <Spinner
                size="md"
                label="Verificando sua sessão"
              />

              <span>
                Verificando sua sessão...
              </span>
            </div>
          ) : (
            <>
              <header className="auth-login__heading">
                <h1>
                  Bem-vindo de volta
                </h1>

                <p>
                  Acesse sua conta para
                  continuar no DomínioHub.
                </p>
              </header>

              <form
                className="auth-login__form"
                onSubmit={handleSubmit}
                noValidate
              >
                <Input
                  label="E-mail"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  autoFocus
                  required
                  value={email}
                  placeholder="voce@empresa.com"
                  onChange={(event) => {
                    setEmail(
                      event.target.value,
                    );

                    clearError();
                  }}
                />

                <Input
                  label="Senha"
                  type={
                    showPassword
                      ? 'text'
                      : 'password'
                  }
                  autoComplete="current-password"
                  required
                  maxLength={128}
                  value={password}
                  placeholder="Digite sua senha"
                  onChange={(event) => {
                    setPassword(
                      event.target.value,
                    );

                    clearError();
                  }}
                  trailingElement={
                    <IconButton
                      className="auth-login__password-toggle"
                      variant="ghost"
                      aria-label={
                        showPassword
                          ? 'Ocultar senha'
                          : 'Mostrar senha'
                      }
                      title={
                        showPassword
                          ? 'Ocultar senha'
                          : 'Mostrar senha'
                      }
                      icon={
                        showPassword ? (
                          <EyeOff
                            size={18}
                            aria-hidden="true"
                          />
                        ) : (
                          <Eye
                            size={18}
                            aria-hidden="true"
                          />
                        )
                      }
                      onClick={() => {
                        setShowPassword(
                          (current) =>
                            !current,
                        );
                      }}
                    />
                  }
                />

                {loginError && (
                  <div
                    className="auth-login__error"
                    role="alert"
                    aria-live="assertive"
                  >
                    <CircleAlert
                      size={18}
                      aria-hidden="true"
                    />

                    <div>
                      <p>
                        {
                          loginError.message
                        }
                      </p>

                      {loginError.requestId && (
                        <span>
                          Código de suporte:{' '}
                          <code>
                            {
                              loginError.requestId
                            }
                          </code>
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <Button
                  className="auth-login__submit"
                  type="submit"
                  loading={submitting}
                  disabled={!canSubmit}
                >
                  Entrar
                </Button>
              </form>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
