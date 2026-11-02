import {
  type KeyboardEvent,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Activity,
  ChevronRight,
  RefreshCw,
  Search,
} from 'lucide-react';

import {
  useNavigate,
} from 'react-router-dom';

import {
  PageHeader,
} from '../components/layout/PageHeader';

import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  Pagination,
  Select,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
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

type StatusFilter =
  | 'ALL'
  | EventStatus;

interface LoadError {
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

function getLoadError(
  error: unknown,
): LoadError {
  if (!(error instanceof ApiError)) {
    return {
      message:
        'Não foi possível carregar os eventos.',
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

  if (error.statusCode === 403) {
    return {
      message:
        'Sua conta não possui permissão para visualizar eventos.',
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
      'Não foi possível carregar os eventos.',
    requestId:
      error.requestId,
  };
}

function EventsLoading() {
  return (
    <Card
      padding="none"
      className="events-card"
    >
      <div className="events-toolbar">
        <Skeleton
          width={340}
          height={40}
          radius={8}
        />

        <Skeleton
          width={180}
          height={40}
          radius={8}
        />
      </div>

      <div className="events-loading">
        {Array.from(
          {
            length: 6,
          },
          (_, index) => (
            <div
              key={index}
              className="events-loading__row"
            >
              <Skeleton
                width={150}
              />

              <Skeleton
                width={170}
              />

              <Skeleton
                width={90}
                height={24}
                radius={999}
              />

              <Skeleton
                width={130}
              />

              <Skeleton
                width={130}
              />
            </div>
          ),
        )}
      </div>
    </Card>
  );
}

export function EventsPage() {
  const navigate =
    useNavigate();

  const [
    events,
    setEvents,
  ] =
    useState<
      OperationalEvent[]
    >([]);

  const [
    loadStatus,
    setLoadStatus,
  ] =
    useState<
      'loading' |
      'success' |
      'error'
    >('loading');

  const [
    loadError,
    setLoadError,
  ] =
    useState<LoadError | null>(
      null,
    );

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    search,
    setSearch,
  ] = useState('');

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<StatusFilter>(
      'ALL',
    );

  const [
    page,
    setPage,
  ] = useState(1);

  const [
    pageSize,
    setPageSize,
  ] = useState(10);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response =
          await eventApi.list();

        if (cancelled) {
          return;
        }

        setEvents(
          response.events,
        );

        setLoadError(null);
        setLoadStatus(
          'success',
        );
      } catch (error) {
        if (cancelled) {
          return;
        }

        setLoadError(
          getLoadError(error),
        );

        setLoadStatus(
          'error',
        );
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredEvents =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLocaleLowerCase(
            'pt-BR',
          );

      return events.filter(
        (event) => {
          const matchesStatus =
            statusFilter ===
              'ALL' ||
            event.status ===
              statusFilter;

          if (!matchesStatus) {
            return false;
          }

          if (!query) {
            return true;
          }

          return (
            event.type
              .toLocaleLowerCase(
                'pt-BR',
              )
              .includes(query) ||
            event.externalId
              .toLocaleLowerCase(
                'pt-BR',
              )
              .includes(query)
          );
        },
      );
    }, [
      events,
      search,
      statusFilter,
    ]);

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredEvents.length /
          pageSize,
      ),
    );

  const safePage =
    Math.min(
      page,
      totalPages,
    );

  const visibleEvents =
    filteredEvents.slice(
      (
        safePage - 1
      ) * pageSize,
      safePage * pageSize,
    );

  function openEvent(
    event: OperationalEvent,
  ) {
    navigate(
      `/events/${event.id}`,
    );
  }

  function handleRowKeyDown(
    keyboardEvent:
      KeyboardEvent<HTMLTableRowElement>,
    event: OperationalEvent,
  ) {
    if (
      keyboardEvent.key ===
        'Enter' ||
      keyboardEvent.key === ' '
    ) {
      keyboardEvent.preventDefault();

      openEvent(event);
    }
  }

  async function refreshEvents() {
    setRefreshing(true);

    try {
      const response =
        await eventApi.list();

      setEvents(
        response.events,
      );

      setLoadError(null);
      setLoadStatus(
        'success',
      );
    } catch (error) {
      setLoadError(
        getLoadError(error),
      );

      setLoadStatus(
        'error',
      );
    } finally {
      setRefreshing(false);
    }
  }

  async function retryLoad() {
    setLoadStatus(
      'loading',
    );

    setLoadError(null);

    try {
      const response =
        await eventApi.list();

      setEvents(
        response.events,
      );

      setLoadStatus(
        'success',
      );
    } catch (error) {
      setLoadError(
        getLoadError(error),
      );

      setLoadStatus(
        'error',
      );
    }
  }

  function clearFilters() {
    setSearch('');
    setStatusFilter('ALL');
    setPage(1);
  }

  return (
    <>
      <PageHeader
        title="Eventos"
        description="Acompanhe os eventos recebidos e o estado do processamento."
        action={
          <Button
            className="events-refresh-button"
            variant="secondary"
            loading={refreshing}
            leadingIcon={
              <RefreshCw
                size={16}
                aria-hidden="true"
              />
            }
            onClick={() => {
              void refreshEvents();
            }}
          >
            Atualizar
          </Button>
        }
      />

      {loadStatus ===
      'error' ? (
        <ErrorState
          title="Não foi possível carregar os eventos"
          description={
            loadError?.message ??
            'Não foi possível carregar os eventos.'
          }
          requestId={
            loadError?.requestId
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
      ) : loadStatus ===
        'loading' ? (
        <EventsLoading />
      ) : (
        <Card
          padding="none"
          className="events-card"
        >
          <div className="events-toolbar">
            <div className="events-search">
              <Input
                label="Buscar eventos"
                value={search}
                placeholder="Buscar por tipo ou ID externo..."
                leadingIcon={
                  <Search
                    size={16}
                    aria-hidden="true"
                  />
                }
                onChange={(event) => {
                  setSearch(
                    event.target
                      .value,
                  );

                  setPage(1);
                }}
              />
            </div>

            <div className="events-filter">
              <Select
                label="Status"
                value={
                  statusFilter
                }
                onChange={(event) => {
                  setStatusFilter(
                    event.target
                      .value as StatusFilter,
                  );

                  setPage(1);
                }}
              >
                <option value="ALL">
                  Todos
                </option>

                <option value="PENDING">
                  Pendentes
                </option>

                <option value="PROCESSING">
                  Processando
                </option>

                <option value="PROCESSED">
                  Processados
                </option>

                <option value="FAILED">
                  Falhos
                </option>
              </Select>
            </div>

            <span className="events-count">
              {
                filteredEvents.length
              }{' '}
              {filteredEvents.length ===
              1
                ? 'evento'
                : 'eventos'}
            </span>
          </div>

          {filteredEvents.length ===
          0 ? (
            events.length ===
              0 ? (
              <EmptyState
                icon={
                  <Activity
                    size={28}
                    aria-hidden="true"
                  />
                }
                title="Nenhum evento recebido"
                description="Os eventos recebidos pela organização aparecerão aqui."
              />
            ) : (
              <EmptyState
                icon={
                  <Search
                    size={28}
                    aria-hidden="true"
                  />
                }
                title="Nenhum evento encontrado"
                description="Nenhum evento corresponde aos filtros informados."
                action={
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={
                      clearFilters
                    }
                  >
                    Limpar filtros
                  </Button>
                }
              />
            )
          ) : (
            <>
              <div className="events-desktop-table">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        Tipo
                      </TableHead>

                      <TableHead>
                        ID externo
                      </TableHead>

                      <TableHead>
                        Status
                      </TableHead>

                      <TableHead>
                        Recebido
                      </TableHead>

                      <TableHead>
                        Processado
                      </TableHead>

                      <TableHead
                        aria-label="Abrir evento"
                      />
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {visibleEvents.map(
                      (event) => (
                        <TableRow
                          key={
                            event.id
                          }
                          className="events-table-row--interactive"
                          tabIndex={0}
                          aria-label={
                            `Abrir evento ${event.type}`
                          }
                          onClick={() => {
                            openEvent(
                              event,
                            );
                          }}
                          onKeyDown={(
                            keyboardEvent,
                          ) => {
                            handleRowKeyDown(
                              keyboardEvent,
                              event,
                            );
                          }}
                        >
                          <TableCell>
                            <strong className="events-type">
                              {
                                event.type
                              }
                            </strong>
                          </TableCell>

                          <TableCell>
                            <code className="events-external-id">
                              {
                                event.externalId
                              }
                            </code>
                          </TableCell>

                          <TableCell>
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
                          </TableCell>

                          <TableCell>
                            {formatDateTime(
                              event.receivedAt,
                            )}
                          </TableCell>

                          <TableCell>
                            {formatDateTime(
                              event.processedAt,
                            )}
                          </TableCell>

                          <TableCell>
                            <ChevronRight
                              className="events-row-chevron"
                              size={16}
                              aria-hidden="true"
                            />
                          </TableCell>
                        </TableRow>
                      ),
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="events-mobile-list">
                {visibleEvents.map(
                  (event) => (
                    <button
                      key={
                        event.id
                      }
                      type="button"
                      className="events-mobile-card"
                      onClick={() => {
                        openEvent(
                          event,
                        );
                      }}
                    >
                      <div className="events-mobile-card__content">
                        <div className="events-mobile-card__header">
                          <strong>
                            {
                              event.type
                            }
                          </strong>

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
                        </div>

                        <code>
                          {
                            event.externalId
                          }
                        </code>

                        <span>
                          Recebido em{' '}
                          {formatDateTime(
                            event.receivedAt,
                          )}
                        </span>
                      </div>

                      <ChevronRight
                        size={18}
                        aria-hidden="true"
                      />
                    </button>
                  ),
                )}
              </div>

              <Pagination
                page={safePage}
                pageSize={
                  pageSize
                }
                totalItems={
                  filteredEvents.length
                }
                onPageChange={
                  setPage
                }
                onPageSizeChange={(
                  nextPageSize,
                ) => {
                  setPageSize(
                    nextPageSize,
                  );

                  setPage(1);
                }}
              />
            </>
          )}
        </Card>
      )}
    </>
  );
}
