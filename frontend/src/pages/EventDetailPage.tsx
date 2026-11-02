import {
  type ReactNode,
  useEffect,
  useState,
} from 'react';

import {
  ArrowLeft,
  Braces,
  RefreshCw,
} from 'lucide-react';

import {
  Link,
  useParams,
} from 'react-router-dom';

import {
  PageHeader,
} from '../components/layout/PageHeader';

import {
  Badge,
  Button,
  Card,
  ErrorState,
  Skeleton,
} from '../components/ui';

import {
  eventApi,
} from '../features/events/event-api';

import type {
  EventStatus,
  OperationalEvent,
} from '../features/events/types';

import {
  formatDateTime,
} from '../lib/date-format';

import {
  ApiError,
} from '../services/api-client';

interface DetailError {
  message: string;
  requestId: string | null;
}

const statusLabels:
  Record<
    EventStatus,
    string
  > = {
    PENDING: 'Pendente',
    PROCESSING: 'Processando',
    PROCESSED: 'Processado',
    FAILED: 'Falhou',
  };

function getStatusTone(
  status: EventStatus,
) {
  if (status === 'PROCESSED') {
    return 'success' as const;
  }

  if (status === 'PROCESSING') {
    return 'info' as const;
  }

  if (status === 'FAILED') {
    return 'danger' as const;
  }

  return 'warning' as const;
}

function getDetailError(
  error: unknown,
): DetailError {
  if (!(error instanceof ApiError)) {
    return {
      message:
        'Não foi possível carregar este evento.',
      requestId: null,
    };
  }

  if (error.statusCode === 0) {
    return {
      message:
        'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.',
      requestId: null,
    };
  }

  if (
    error.statusCode === 404 ||
    error.code ===
      'EVENT_NOT_FOUND'
  ) {
    return {
      message:
        'O evento não foi encontrado ou não pertence à sua organização.',
      requestId:
        error.requestId,
    };
  }

  if (error.statusCode >= 500) {
    return {
      message:
        'O DomínioHub está temporariamente indisponível. Tente novamente em instantes.',
      requestId:
        error.requestId,
    };
  }

  return {
    message:
      error.message ||
      'Não foi possível carregar este evento.',
    requestId:
      error.requestId,
  };
}

function DetailItem({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="event-detail-item">
      <span>
        {label}
      </span>

      <div>
        {children}
      </div>
    </div>
  );
}

function serializePayload(
  payload: unknown,
) {
  const serialized =
    JSON.stringify(
      payload,
      null,
      2,
    );

  return (
    serialized ??
    String(payload)
  );
}

function EventDetailLoading() {
  return (
    <div className="event-detail-layout">
      <Card>
        <div className="event-detail-loading-grid">
          {Array.from(
            {
              length: 6,
            },
            (_, index) => (
              <div
                key={index}
                className="event-detail-loading-item"
              >
                <Skeleton
                  width={90}
                  height={12}
                />

                <Skeleton
                  width={160}
                  height={18}
                />
              </div>
            ),
          )}
        </div>
      </Card>

      <Card>
        <Skeleton
          width={130}
          height={18}
        />

        <Skeleton
          className="event-payload-loading"
          height={240}
        />
      </Card>
    </div>
  );
}

export function EventDetailPage() {
  const {
    eventId,
  } =
    useParams<{
      eventId: string;
    }>();

  const [
    event,
    setEvent,
  ] =
    useState<OperationalEvent | null>(
      null,
    );

  const [
    status,
    setStatus,
  ] =
    useState<
      'loading' |
      'success' |
      'error'
    >('loading');

  const [
    error,
    setError,
  ] =
    useState<DetailError | null>(
      null,
    );

  useEffect(() => {
    if (!eventId) {
      return;
    }

    const currentEventId =
      eventId;

    let cancelled = false;

    async function load() {
      try {
        const response =
          await eventApi.getById(
            currentEventId,
          );

        if (cancelled) {
          return;
        }

        setEvent(
          response.event,
        );

        setError(null);
        setStatus(
          'success',
        );
      } catch (caughtError) {
        if (cancelled) {
          return;
        }

        setError(
          getDetailError(
            caughtError,
          ),
        );

        setStatus(
          'error',
        );
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [
    eventId,
  ]);

  async function retryLoad() {
    if (!eventId) {
      return;
    }

    setStatus(
      'loading',
    );

    setError(null);

    try {
      const response =
        await eventApi.getById(
          eventId,
        );

      setEvent(
        response.event,
      );

      setStatus(
        'success',
      );
    } catch (caughtError) {
      setError(
        getDetailError(
          caughtError,
        ),
      );

      setStatus(
        'error',
      );
    }
  }

  if (!eventId) {
    return (
      <ErrorState
        title="Evento inválido"
        description="Não foi possível identificar o evento solicitado."
        action={
          <Link
            to="/events"
            className="events-back-link"
          >
            <ArrowLeft
              size={15}
              aria-hidden="true"
            />

            Voltar para eventos
          </Link>
        }
      />
    );
  }

  return (
    <>
      <Link
        to="/events"
        className="events-back-link"
      >
        <ArrowLeft
          size={15}
          aria-hidden="true"
        />

        Voltar para eventos
      </Link>

      <PageHeader
        title={
          event?.type ??
          'Detalhes do evento'
        }
        description={
          event
            ? `ID externo: ${event.externalId}`
            : 'Informações operacionais e payload do evento.'
        }
      />

      {status ===
      'error' ? (
        <ErrorState
          title="Não foi possível carregar o evento"
          description={
            error?.message ??
            'Não foi possível carregar o evento.'
          }
          requestId={
            error?.requestId
          }
          action={
            <Button
              variant="secondary"
              leadingIcon={
                <RefreshCw
                  size={16}
                  aria-hidden="true"
                />
              }
              onClick={() => {
                void retryLoad();
              }}
            >
              Tentar novamente
            </Button>
          }
        />
      ) : status ===
          'loading' ||
        !event ? (
        <EventDetailLoading />
      ) : (
        <div className="event-detail-layout">
          <Card
            title="Informações do evento"
            description="Dados de recebimento e processamento."
          >
            <div className="event-detail-grid">
              <DetailItem label="Status">
                <Badge
                  tone={
                    getStatusTone(
                      event.status,
                    )
                  }
                >
                  {
                    statusLabels[
                      event.status
                    ]
                  }
                </Badge>
              </DetailItem>

              <DetailItem label="Tipo">
                {
                  event.type
                }
              </DetailItem>

              <DetailItem label="Recebido em">
                {formatDateTime(
                  event.receivedAt,
                )}
              </DetailItem>

              <DetailItem label="Processado em">
                {formatDateTime(
                  event.processedAt,
                )}
              </DetailItem>

              <DetailItem label="ID externo">
                <code className="event-detail-code">
                  {
                    event.externalId
                  }
                </code>
              </DetailItem>

              <DetailItem label="ID do evento">
                <code className="event-detail-code">
                  {
                    event.id
                  }
                </code>
              </DetailItem>
            </div>
          </Card>

          <Card
            title="Payload"
            description="Conteúdo JSON recebido com o evento."
            action={
              <Braces
                className="event-payload-icon"
                size={18}
                aria-hidden="true"
              />
            }
          >
            <pre className="event-payload">
              <code>
                {serializePayload(
                  event.payload,
                )}
              </code>
            </pre>
          </Card>
        </div>
      )}
    </>
  );
}
