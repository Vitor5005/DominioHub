import type {
  ReactNode,
} from 'react';

import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CircleX,
  Globe2,
  RefreshCw,
} from 'lucide-react';

import {
  Link,
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
} from '../components/ui';

import {
  useDashboardData,
} from '../features/dashboard/useDashboardData';

import type {
  DomainRecord,
  DomainStatus,
} from '../features/domains/types';

import type {
  EventStatus,
  OperationalEvent,
} from '../features/events/types';

import {
  formatDate,
  formatDateTime,
} from '../lib/date-format';

function getDomainStatusLabel(
  status: DomainStatus,
) {
  const labels: Record<
    DomainStatus,
    string
  > = {
    ACTIVE: 'Ativo',
    EXPIRING: 'Expirando',
    EXPIRED: 'Expirado',
    UNKNOWN: 'Desconhecido',
  };

  return labels[status];
}

function getEventStatusLabel(
  status: EventStatus,
) {
  const labels: Record<
    EventStatus,
    string
  > = {
    PENDING: 'Pendente',
    PROCESSING: 'Processando',
    PROCESSED: 'Processado',
    FAILED: 'Falhou',
  };

  return labels[status];
}

function getEventBadgeTone(
  status: EventStatus,
) {
  if (
    status === 'PROCESSED'
  ) {
    return 'success' as const;
  }

  if (
    status === 'PROCESSING'
  ) {
    return 'info' as const;
  }

  if (
    status === 'FAILED'
  ) {
    return 'danger' as const;
  }

  return 'neutral' as const;
}

function sortAttentionDomains(
  domains: DomainRecord[],
) {
  const priority:
    Record<
      DomainStatus,
      number
    > = {
      EXPIRED: 0,
      EXPIRING: 1,
      UNKNOWN: 2,
      ACTIVE: 3,
    };

  return [...domains].sort(
    (left, right) => {
      const priorityDifference =
        priority[left.status] -
        priority[right.status];

      if (
        priorityDifference !== 0
      ) {
        return priorityDifference;
      }

      if (
        !left.expiresAt &&
        !right.expiresAt
      ) {
        return left.name.localeCompare(
          right.name,
        );
      }

      if (!left.expiresAt) {
        return 1;
      }

      if (!right.expiresAt) {
        return -1;
      }

      return (
        new Date(
          left.expiresAt,
        ).getTime() -
        new Date(
          right.expiresAt,
        ).getTime()
      );
    },
  );
}

interface MetricCardProps {
  label: string;
  value: number;
  icon: ReactNode;
  tone?:
    | 'default'
    | 'warning'
    | 'danger';
}

function MetricCard({
  label,
  value,
  icon,
  tone = 'default',
}: MetricCardProps) {
  return (
    <Card
      className={
        `dashboard-metric dashboard-metric--${tone}`
      }
    >
      <div className="dashboard-metric__header">
        <span>
          {label}
        </span>

        <span className="dashboard-metric__icon">
          {icon}
        </span>
      </div>

      <strong className="dashboard-metric__value">
        {value}
      </strong>
    </Card>
  );
}

function DashboardLoading() {
  return (
    <>
      <div className="dashboard-metrics">
        {Array.from(
          {
            length: 4,
          },
          (_, index) => (
            <Card
              key={index}
              className="dashboard-metric"
            >
              <div className="dashboard-loading-card">
                <Skeleton
                  width="58%"
                />

                <Skeleton
                  width={58}
                  height={34}
                />
              </div>
            </Card>
          ),
        )}
      </div>

      <div className="dashboard-content-grid">
        {Array.from(
          {
            length: 2,
          },
          (_, cardIndex) => (
            <Card
              key={cardIndex}
              title={
                <Skeleton
                  width={150}
                  height={18}
                />
              }
            >
              <div className="dashboard-loading-list">
                {Array.from(
                  {
                    length: 4,
                  },
                  (_, rowIndex) => (
                    <div
                      key={rowIndex}
                      className="dashboard-loading-row"
                    >
                      <div>
                        <Skeleton
                          width={180}
                        />

                        <Skeleton
                          width={120}
                          height={12}
                        />
                      </div>

                      <Skeleton
                        width={74}
                        height={24}
                        radius={999}
                      />
                    </div>
                  ),
                )}
              </div>
            </Card>
          ),
        )}
      </div>
    </>
  );
}

function AttentionDomains({
  domains,
}: {
  domains: DomainRecord[];
}) {
  if (
    domains.length === 0
  ) {
    return (
      <EmptyState
        icon={
          <CheckCircle2
            size={28}
            aria-hidden="true"
          />
        }
        title="Nenhum domínio exige atenção"
        description="Não há domínios expirados ou próximos da expiração."
      />
    );
  }

  return (
    <div className="dashboard-list">
      {domains.map(
        (domain) => (
          <Link
            key={domain.id}
            to={
              `/domains/${domain.id}`
            }
            className="dashboard-list-item"
          >
            <div className="dashboard-list-item__content">
              <strong>
                {domain.name}
              </strong>

              <span>
                {domain.expiresAt
                  ? `Expira em ${formatDate(
                      domain.expiresAt,
                    )}`
                  : 'Data de expiração indisponível'}
              </span>
            </div>

            <Badge
              tone={
                domain.status ===
                'EXPIRED'
                  ? 'danger'
                  : 'warning'
              }
            >
              {getDomainStatusLabel(
                domain.status,
              )}
            </Badge>
          </Link>
        ),
      )}
    </div>
  );
}

function RecentEvents({
  events,
}: {
  events: OperationalEvent[];
}) {
  if (
    events.length === 0
  ) {
    return (
      <EmptyState
        icon={
          <Activity
            size={28}
            aria-hidden="true"
          />
        }
        title="Nenhum evento recebido"
        description="Os eventos operacionais mais recentes aparecerão aqui."
      />
    );
  }

  return (
    <div className="dashboard-list">
      {events.map(
        (event) => (
          <Link
            key={event.id}
            to={
              `/events/${event.id}`
            }
            className="dashboard-list-item"
          >
            <div className="dashboard-list-item__content">
              <strong>
                {event.type}
              </strong>

              <span>
                {event.externalId}
                {' · '}
                {formatDateTime(
                  event.receivedAt,
                )}
              </span>
            </div>

            <Badge
              tone={
                getEventBadgeTone(
                  event.status,
                )
              }
            >
              {getEventStatusLabel(
                event.status,
              )}
            </Badge>
          </Link>
        ),
      )}
    </div>
  );
}

export function DashboardPage() {
  const {
    data,
    status,
    error,
    refresh,
  } =
    useDashboardData();

  const loading =
    status === 'loading';

  const attentionDomains =
    data
      ? sortAttentionDomains(
          data.domains.filter(
            (domain) =>
              domain.status ===
                'EXPIRING' ||
              domain.status ===
                'EXPIRED',
          ),
        ).slice(0, 5)
      : [];

  const recentEvents =
    data
      ? data.events.slice(
          0,
          5,
        )
      : [];

  const failedDeliveries =
    data
      ? data.deliveries.filter(
          (delivery) =>
            delivery.status ===
            'FAILED',
        ).length
      : 0;

  return (
    <>
      <PageHeader
        title="Visão geral"
        description="Acompanhe a situação operacional dos seus domínios, eventos e integrações."
        action={
          <Button
            className="dashboard-refresh"
            variant="secondary"
            loading={loading}
            leadingIcon={
              <RefreshCw
                size={16}
                aria-hidden="true"
              />
            }
            onClick={() => {
              void refresh();
            }}
          >
            Atualizar
          </Button>
        }
      />

      {status === 'error' ? (
        <ErrorState
          title="Não foi possível carregar a visão geral"
          description={
            error?.message ??
            'Não foi possível carregar a visão geral.'
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
                void refresh();
              }}
            >
              Tentar novamente
            </Button>
          }
        />
      ) : loading || !data ? (
        <DashboardLoading />
      ) : (
        <>
          <section
            className="dashboard-metrics"
            aria-label="Resumo operacional"
          >
            <MetricCard
              label="Domínios"
              value={
                data.domains.length
              }
              icon={
                <Globe2
                  size={20}
                  aria-hidden="true"
                />
              }
            />

            <MetricCard
              label="Exigem atenção"
              value={
                data.domains.filter(
                  (domain) =>
                    domain.status ===
                      'EXPIRING' ||
                    domain.status ===
                      'EXPIRED',
                ).length
              }
              tone="warning"
              icon={
                <AlertTriangle
                  size={20}
                  aria-hidden="true"
                />
              }
            />

            <MetricCard
              label="Eventos"
              value={
                data.events.length
              }
              icon={
                <Activity
                  size={20}
                  aria-hidden="true"
                />
              }
            />

            <MetricCard
              label="Falhas de entrega"
              value={
                failedDeliveries
              }
              tone={
                failedDeliveries > 0
                  ? 'danger'
                  : 'default'
              }
              icon={
                <CircleX
                  size={20}
                  aria-hidden="true"
                />
              }
            />
          </section>

          <section className="dashboard-content-grid">
            <Card
              title="Requer atenção"
              description="Domínios expirados ou próximos da expiração."
              action={
                <Link
                  to="/domains"
                  className="dashboard-card-link"
                >
                  Ver domínios

                  <ArrowRight
                    size={14}
                    aria-hidden="true"
                  />
                </Link>
              }
            >
              <AttentionDomains
                domains={
                  attentionDomains
                }
              />
            </Card>

            <Card
              title="Eventos recentes"
              description="Últimos eventos recebidos pela organização."
              action={
                <Link
                  to="/events"
                  className="dashboard-card-link"
                >
                  Ver eventos

                  <ArrowRight
                    size={14}
                    aria-hidden="true"
                  />
                </Link>
              }
            >
              <RecentEvents
                events={
                  recentEvents
                }
              />
            </Card>
          </section>
        </>
      )}
    </>
  );
}
