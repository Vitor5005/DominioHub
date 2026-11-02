import {
  type ReactNode,
  useEffect,
  useState,
} from 'react';

import {
  ArrowLeft,
  Globe2,
  RefreshCw,
  Server,
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
  EmptyState,
  ErrorState,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui';

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

interface DetailError {
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

function getDetailError(
  error: unknown,
): DetailError {
  if (!(error instanceof ApiError)) {
    return {
      message:
        'Não foi possível carregar este domínio.',
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
      'DOMAIN_NOT_FOUND'
  ) {
    return {
      message:
        'O domínio não foi encontrado ou não pertence à sua organização.',
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
      'Não foi possível carregar este domínio.',
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
    <div className="domain-detail-item">
      <span>
        {label}
      </span>

      <div>
        {children}
      </div>
    </div>
  );
}

function DomainDetailLoading() {
  return (
    <>
      <Card>
        <div className="domain-detail-loading-grid">
          {Array.from(
            {
              length: 6,
            },
            (_, index) => (
              <div
                key={index}
                className="domain-detail-loading-item"
              >
                <Skeleton
                  width={80}
                  height={12}
                />

                <Skeleton
                  width={150}
                  height={18}
                />
              </div>
            ),
          )}
        </div>
      </Card>

      <Card>
        <Skeleton
          width={150}
          height={18}
        />

        <div className="domain-dns-loading">
          {Array.from(
            {
              length: 3,
            },
            (_, index) => (
              <Skeleton
                key={index}
                height={54}
              />
            ),
          )}
        </div>
      </Card>
    </>
  );
}

export function DomainDetailPage() {
  const {
    domainId,
  } =
    useParams<{
      domainId: string;
    }>();

  const [
    domain,
    setDomain,
  ] =
    useState<DomainRecord | null>(
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
    if (!domainId) {
      return;
    }

    const currentDomainId =
      domainId;

    let cancelled = false;

    async function load() {
      try {
        const response =
          await domainApi.getById(
            currentDomainId,
          );

        if (cancelled) {
          return;
        }

        setDomain(
          response.domain,
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
    domainId,
  ]);

  async function retryLoad() {
    if (!domainId) {
      return;
    }

    setStatus(
      'loading',
    );

    setError(null);

    try {
      const response =
        await domainApi.getById(
          domainId,
        );

      setDomain(
        response.domain,
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

  if (!domainId) {
    return (
      <ErrorState
        title="Domínio inválido"
        description="Não foi possível identificar o domínio solicitado."
        action={
          <Link
            to="/domains"
            className="domains-back-link"
          >
            <ArrowLeft
              size={15}
              aria-hidden="true"
            />

            Voltar para domínios
          </Link>
        }
      />
    );
  }

  const dnsRecords =
    Array.isArray(domain?.dns)
      ? domain.dns
      : [];

  return (
    <>
      <Link
        to="/domains"
        className="domains-back-link"
      >
        <ArrowLeft
          size={15}
          aria-hidden="true"
        />

        Voltar para domínios
      </Link>

      <PageHeader
        title={
          domain?.name ??
          'Detalhes do domínio'
        }
        description="Informações do domínio e registros DNS."
      />

      {status ===
      'error' ? (
        <ErrorState
          title="Não foi possível carregar o domínio"
          description={
            error?.message ??
            'Não foi possível carregar o domínio.'
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
        !domain ? (
        <DomainDetailLoading />
      ) : (
        <div className="domain-detail-layout">
          <Card
            title="Informações do domínio"
            description="Dados atualmente armazenados no DomínioHub."
          >
            <div className="domain-detail-grid">
              <DetailItem label="Status">
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
              </DetailItem>

              <DetailItem label="Registrador">
                {
                  domain.registrar ??
                  '—'
                }
              </DetailItem>

              <DetailItem label="Provedor">
                {
                  domain.provider
                }
              </DetailItem>

              <DetailItem label="Expira em">
                {formatDate(
                  domain.expiresAt,
                )}
              </DetailItem>

              <DetailItem label="Última atualização">
                {formatDateTime(
                  domain.updatedAt,
                )}
              </DetailItem>

              <DetailItem label="ID externo">
                <span className="domain-detail-external-id">
                  {
                    domain.externalId ??
                    '—'
                  }
                </span>
              </DetailItem>
            </div>
          </Card>

          <Card
            title="Registros DNS"
            description={
              dnsRecords.length === 1
                ? '1 registro DNS armazenado.'
                : `${dnsRecords.length} registros DNS armazenados.`
            }
          >
            {dnsRecords.length ===
            0 ? (
              <EmptyState
                icon={
                  <Globe2
                    size={28}
                    aria-hidden="true"
                  />
                }
                title="Nenhum registro DNS"
                description="Este domínio não possui registros DNS armazenados."
              />
            ) : (
              <>
                <div className="domain-dns-desktop-table">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          Tipo
                        </TableHead>

                        <TableHead>
                          Host
                        </TableHead>

                        <TableHead>
                          Valor
                        </TableHead>

                        <TableHead>
                          TTL
                        </TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {dnsRecords.map(
                        (
                          record,
                          index,
                        ) => (
                          <TableRow
                            key={
                              `${record.type}-${record.host}-${record.value}-${index}`
                            }
                          >
                            <TableCell>
                              <Badge tone="info">
                                {
                                  record.type
                                }
                              </Badge>
                            </TableCell>

                            <TableCell>
                              <code className="domain-dns-code">
                                {
                                  record.host
                                }
                              </code>
                            </TableCell>

                            <TableCell>
                              <span className="domain-dns-value">
                                {
                                  record.value
                                }
                              </span>
                            </TableCell>

                            <TableCell>
                              {
                                record.ttl
                              }
                              s
                            </TableCell>
                          </TableRow>
                        ),
                      )}
                    </TableBody>
                  </Table>
                </div>

                <div className="domain-dns-mobile-list">
                  {dnsRecords.map(
                    (
                      record,
                      index,
                    ) => (
                      <div
                        key={
                          `${record.type}-${record.host}-${record.value}-${index}`
                        }
                        className="domain-dns-mobile-card"
                      >
                        <div className="domain-dns-mobile-card__header">
                          <Badge tone="info">
                            {
                              record.type
                            }
                          </Badge>

                          <span>
                            TTL{' '}
                            {
                              record.ttl
                            }
                            s
                          </span>
                        </div>

                        <div>
                          <span>
                            Host
                          </span>

                          <code>
                            {
                              record.host
                            }
                          </code>
                        </div>

                        <div>
                          <span>
                            Valor
                          </span>

                          <strong>
                            {
                              record.value
                            }
                          </strong>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </>
            )}
          </Card>

          <div
            className="domain-detail-provider-note"
            aria-label="Informação do provedor"
          >
            <Server
              size={17}
              aria-hidden="true"
            />

            <span>
              Dados fornecidos por{' '}
              <strong>
                {
                  domain.provider
                }
              </strong>
              .
            </span>
          </div>
        </div>
      )}
    </>
  );
}
