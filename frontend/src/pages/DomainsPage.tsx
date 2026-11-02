import {
  type KeyboardEvent,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  ChevronRight,
  Globe2,
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
  useToast,
} from '../components/ui';

import {
  useAuth,
} from '../features/auth/useAuth';

import {
  domainApi,
} from '../features/domains/domain-api';

import type {
  DomainRecord,
  DomainStatus,
} from '../features/domains/types';

import {
  formatDate,
  formatDateTime,
} from '../lib/date-format';

import {
  ApiError,
} from '../services/api-client';

type StatusFilter =
  | 'ALL'
  | DomainStatus;

interface LoadError {
  message: string;
  requestId: string | null;
}

const statusLabels:
  Record<
    DomainStatus,
    string
  > = {
    ACTIVE: 'Ativo',
    EXPIRING: 'Expirando',
    EXPIRED: 'Expirado',
    UNKNOWN: 'Desconhecido',
  };

function getStatusTone(
  status: DomainStatus,
) {
  if (status === 'ACTIVE') {
    return 'success' as const;
  }

  if (status === 'EXPIRING') {
    return 'warning' as const;
  }

  if (status === 'EXPIRED') {
    return 'danger' as const;
  }

  return 'neutral' as const;
}

function getLoadError(
  error: unknown,
): LoadError {
  if (!(error instanceof ApiError)) {
    return {
      message:
        'Não foi possível carregar os domínios.',
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
        'Sua conta não possui permissão para visualizar domínios.',
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
      'Não foi possível carregar os domínios.',
    requestId:
      error.requestId,
  };
}

function getSyncError(
  error: unknown,
) {
  if (!(error instanceof ApiError)) {
    return 'Não foi possível sincronizar os domínios.';
  }

  if (error.statusCode === 0) {
    return 'Não foi possível conectar ao servidor.';
  }

  if (
    error.statusCode === 502 ||
    error.code ===
      'DOMAIN_PROVIDER_ERROR'
  ) {
    return 'O provedor de domínios não respondeu corretamente.';
  }

  if (error.statusCode === 403) {
    return 'Sua conta não possui permissão para sincronizar domínios.';
  }

  const supportCode =
    error.requestId
      ? ` Código de suporte: ${error.requestId}.`
      : '';

  return `${
    error.message ||
    'Não foi possível sincronizar os domínios.'
  }${supportCode}`;
}

function DomainsLoading() {
  return (
    <Card
      padding="none"
      className="domains-card"
    >
      <div className="domains-toolbar">
        <Skeleton
          width={320}
          height={40}
          radius={8}
        />

        <Skeleton
          width={180}
          height={40}
          radius={8}
        />
      </div>

      <div className="domains-loading">
        {Array.from(
          {
            length: 5,
          },
          (_, index) => (
            <div
              key={index}
              className="domains-loading__row"
            >
              <Skeleton
                width={180}
              />

              <Skeleton
                width={76}
                height={24}
                radius={999}
              />

              <Skeleton
                width={120}
              />

              <Skeleton
                width={90}
              />

              <Skeleton
                width={110}
              />
            </div>
          ),
        )}
      </div>
    </Card>
  );
}

export function DomainsPage() {
  const navigate =
    useNavigate();

  const {
    hasPermission,
  } = useAuth();

  const {
    toast,
  } = useToast();

  const [
    domains,
    setDomains,
  ] =
    useState<DomainRecord[]>([]);

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
    syncing,
    setSyncing,
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

  const canManage =
    hasPermission(
      'domains:manage',
    );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response =
          await domainApi.list();

        if (cancelled) {
          return;
        }

        setDomains(
          response.domains,
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

  const filteredDomains =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLocaleLowerCase(
            'pt-BR',
          );

      return domains.filter(
        (domain) => {
          const matchesStatus =
            statusFilter ===
              'ALL' ||
            domain.status ===
              statusFilter;

          if (!matchesStatus) {
            return false;
          }

          if (!query) {
            return true;
          }

          return [
            domain.name,
            domain.registrar ?? '',
            domain.provider,
          ].some((value) =>
            value
              .toLocaleLowerCase(
                'pt-BR',
              )
              .includes(query),
          );
        },
      );
    }, [
      domains,
      search,
      statusFilter,
    ]);

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredDomains.length /
          pageSize,
      ),
    );

  const safePage =
    Math.min(
      page,
      totalPages,
    );

  const visibleDomains =
    filteredDomains.slice(
      (
        safePage - 1
      ) * pageSize,
      safePage * pageSize,
    );

  function openDomain(
    domain: DomainRecord,
  ) {
    navigate(
      `/domains/${domain.id}`,
    );
  }

  function handleRowKeyDown(
    event:
      KeyboardEvent<HTMLTableRowElement>,
    domain: DomainRecord,
  ) {
    if (
      event.key === 'Enter' ||
      event.key === ' '
    ) {
      event.preventDefault();

      openDomain(domain);
    }
  }

  async function retryLoad() {
    setLoadStatus(
      'loading',
    );

    setLoadError(null);

    try {
      const response =
        await domainApi.list();

      setDomains(
        response.domains,
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

  async function handleSync() {
    setSyncing(true);

    try {
      const syncResponse =
        await domainApi.sync();

      const listResponse =
        await domainApi.list();

      setDomains(
        listResponse.domains,
      );

      toast({
        tone: 'success',
        title:
          'Domínios sincronizados',
        description:
          `${syncResponse.synchronized} ${
            syncResponse.synchronized === 1
              ? 'domínio foi sincronizado'
              : 'domínios foram sincronizados'
          } com ${syncResponse.provider}.`,
      });
    } catch (error) {
      toast({
        tone: 'error',
        title:
          'Não foi possível sincronizar',
        description:
          getSyncError(error),
      });
    } finally {
      setSyncing(false);
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
        title="Domínios"
        description="Consulte os domínios da organização e acompanhe status, expiração e registros DNS."
        action={
          canManage ? (
            <Button
              className="domains-sync-button"
              variant="secondary"
              loading={syncing}
              leadingIcon={
                <RefreshCw
                  size={16}
                  aria-hidden="true"
                />
              }
              onClick={() => {
                void handleSync();
              }}
            >
              Sincronizar domínios
            </Button>
          ) : undefined
        }
      />

      {loadStatus ===
      'error' ? (
        <ErrorState
          title="Não foi possível carregar os domínios"
          description={
            loadError?.message ??
            'Não foi possível carregar os domínios.'
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
        <DomainsLoading />
      ) : (
        <Card
          padding="none"
          className="domains-card"
        >
          <div className="domains-toolbar">
            <div className="domains-search">
              <Input
                label="Buscar domínios"
                value={search}
                placeholder="Buscar por domínio, registrador ou provedor..."
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

            <div className="domains-filter">
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

                <option value="ACTIVE">
                  Ativos
                </option>

                <option value="EXPIRING">
                  Expirando
                </option>

                <option value="EXPIRED">
                  Expirados
                </option>

                <option value="UNKNOWN">
                  Desconhecidos
                </option>
              </Select>
            </div>

            <span className="domains-count">
              {
                filteredDomains.length
              }{' '}
              {filteredDomains.length ===
              1
                ? 'domínio'
                : 'domínios'}
            </span>
          </div>

          {filteredDomains.length ===
          0 ? (
            domains.length ===
              0 ? (
              <EmptyState
                icon={
                  <Globe2
                    size={28}
                    aria-hidden="true"
                  />
                }
                title="Nenhum domínio disponível"
                description={
                  canManage
                    ? 'Sincronize os domínios para carregar os dados do provedor.'
                    : 'Nenhum domínio está disponível para esta organização.'
                }
                action={
                  canManage ? (
                    <Button
                      variant="secondary"
                      loading={
                        syncing
                      }
                      leadingIcon={
                        <RefreshCw
                          size={16}
                          aria-hidden="true"
                        />
                      }
                      onClick={() => {
                        void handleSync();
                      }}
                    >
                      Sincronizar domínios
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <EmptyState
                icon={
                  <Search
                    size={28}
                    aria-hidden="true"
                  />
                }
                title="Nenhum domínio encontrado"
                description="Nenhum domínio corresponde aos filtros informados."
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
              <div className="domains-desktop-table">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        Domínio
                      </TableHead>

                      <TableHead>
                        Status
                      </TableHead>

                      <TableHead>
                        Registrador
                      </TableHead>

                      <TableHead>
                        Expira em
                      </TableHead>

                      <TableHead>
                        Provedor
                      </TableHead>

                      <TableHead>
                        Atualizado
                      </TableHead>

                      <TableHead
                        aria-label="Abrir domínio"
                      />
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {visibleDomains.map(
                      (domain) => (
                        <TableRow
                          key={
                            domain.id
                          }
                          className="domains-table-row--interactive"
                          tabIndex={0}
                          aria-label={
                            `Abrir domínio ${domain.name}`
                          }
                          onClick={() => {
                            openDomain(
                              domain,
                            );
                          }}
                          onKeyDown={(
                            event,
                          ) => {
                            handleRowKeyDown(
                              event,
                              domain,
                            );
                          }}
                        >
                          <TableCell>
                            <strong className="domains-domain-name">
                              {
                                domain.name
                              }
                            </strong>
                          </TableCell>

                          <TableCell>
                            <Badge
                              tone={
                                getStatusTone(
                                  domain.status,
                                )
                              }
                            >
                              {
                                statusLabels[
                                  domain.status
                                ]
                              }
                            </Badge>
                          </TableCell>

                          <TableCell>
                            {
                              domain.registrar ??
                              '—'
                            }
                          </TableCell>

                          <TableCell>
                            {formatDate(
                              domain.expiresAt,
                            )}
                          </TableCell>

                          <TableCell>
                            {
                              domain.provider
                            }
                          </TableCell>

                          <TableCell>
                            {formatDateTime(
                              domain.updatedAt,
                            )}
                          </TableCell>

                          <TableCell>
                            <ChevronRight
                              className="domains-row-chevron"
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

              <div className="domains-mobile-list">
                {visibleDomains.map(
                  (domain) => (
                    <button
                      key={
                        domain.id
                      }
                      type="button"
                      className="domains-mobile-card"
                      onClick={() => {
                        openDomain(
                          domain,
                        );
                      }}
                    >
                      <div className="domains-mobile-card__content">
                        <div className="domains-mobile-card__header">
                          <strong>
                            {
                              domain.name
                            }
                          </strong>

                          <Badge
                            tone={
                              getStatusTone(
                                domain.status,
                              )
                            }
                          >
                            {
                              statusLabels[
                                domain.status
                              ]
                            }
                          </Badge>
                        </div>

                        <div className="domains-mobile-card__meta">
                          <span>
                            Registrador:{' '}
                            <strong>
                              {
                                domain.registrar ??
                                '—'
                              }
                            </strong>
                          </span>

                          <span>
                            Expira em:{' '}
                            <strong>
                              {formatDate(
                                domain.expiresAt,
                              )}
                            </strong>
                          </span>
                        </div>
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
                  filteredDomains.length
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
