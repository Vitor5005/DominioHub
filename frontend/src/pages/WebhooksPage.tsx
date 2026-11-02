import {
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Copy,
  ExternalLink,
  Plus,
  RefreshCw,
  Search,
  Webhook as WebhookIcon,
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
  Drawer,
  EmptyState,
  ErrorState,
  Input,
  Modal,
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
  webhookApi,
} from '../features/webhooks/webhook-api';

import type {
  CreateWebhookEndpointResponse,
  UpdateWebhookEndpointInput,
  WebhookDelivery,
  WebhookDeliveryStatus,
  WebhookEndpoint,
} from '../features/webhooks/types';

import {
  formatDateTime,
} from '../lib/date-format';

import {
  ApiError,
} from '../services/api-client';

type WebhookTab =
  | 'endpoints'
  | 'deliveries';

type DeliveryStatusFilter =
  | 'ALL'
  | WebhookDeliveryStatus;

interface PageError {
  message: string;
  requestId: string | null;
}

interface MutationError {
  message: string;
  requestId: string | null;
}

const deliveryStatusLabels:
  Record<
    WebhookDeliveryStatus,
    string
  > = {
    PENDING: 'Pendente',
    SUCCESS: 'Sucesso',
    FAILED: 'Falhou',
  };

function getDeliveryTone(
  status: WebhookDeliveryStatus,
) {
  if (status === 'SUCCESS') {
    return 'success' as const;
  }

  if (status === 'FAILED') {
    return 'danger' as const;
  }

  return 'warning' as const;
}

function getPageError(
  error: unknown,
): PageError {
  if (!(error instanceof ApiError)) {
    return {
      message:
        'Não foi possível carregar os webhooks.',
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
        'Sua conta não possui permissão para visualizar webhooks.',
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
      'Não foi possível carregar os webhooks.',
    requestId:
      error.requestId,
  };
}

function getMutationError(
  error: unknown,
): MutationError {
  if (!(error instanceof ApiError)) {
    return {
      message:
        'Não foi possível concluir a operação.',
      requestId: null,
    };
  }

  if (error.statusCode === 0) {
    return {
      message:
        'Não foi possível conectar ao servidor.',
      requestId: null,
    };
  }

  if (
    error.code ===
      'WEBHOOK_URL_NOT_ALLOWED' ||
    (
      error.statusCode === 400 &&
      error.code ===
        'VALIDATION_ERROR'
    )
  ) {
    return {
      message:
        'Informe uma URL HTTP ou HTTPS pública e permitida para receber o webhook.',
      requestId:
        error.requestId,
    };
  }

  if (
    error.statusCode === 404 &&
    error.code ===
      'WEBHOOK_ENDPOINT_NOT_FOUND'
  ) {
    return {
      message:
        'O endpoint não foi encontrado. Atualize a página e tente novamente.',
      requestId:
        error.requestId,
    };
  }

  if (error.statusCode === 403) {
    return {
      message:
        'Sua conta não possui permissão para gerenciar webhooks.',
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
      'Não foi possível concluir a operação.',
    requestId:
      error.requestId,
  };
}

function validateWebhookUrl(
  value: string,
) {
  try {
    const url =
      new URL(value);

    return (
      url.protocol === 'http:' ||
      url.protocol === 'https:'
    );
  } catch {
    return false;
  }
}

function WebhooksLoading() {
  return (
    <Card
      padding="none"
      className="webhooks-card"
    >
      <div className="webhooks-loading-tabs">
        <Skeleton
          width={110}
          height={36}
          radius={8}
        />

        <Skeleton
          width={110}
          height={36}
          radius={8}
        />
      </div>

      <div className="webhooks-toolbar">
        <Skeleton
          width={340}
          height={40}
          radius={8}
        />

        <Skeleton
          width={90}
          height={14}
        />
      </div>

      <div className="webhooks-loading-list">
        {Array.from(
          {
            length: 5,
          },
          (_, index) => (
            <div
              key={index}
              className="webhooks-loading-row"
            >
              <Skeleton
                width="45%"
              />

              <Skeleton
                width={76}
                height={24}
                radius={999}
              />

              <Skeleton
                width={130}
              />

              <Skeleton
                width={120}
              />
            </div>
          ),
        )}
      </div>
    </Card>
  );
}

export function WebhooksPage() {
  const {
    hasPermission,
  } = useAuth();

  const {
    toast,
  } = useToast();

  const canManage =
    hasPermission(
      'webhooks:manage',
    );

  const [
    activeTab,
    setActiveTab,
  ] =
    useState<WebhookTab>(
      'endpoints',
    );

  const [
    endpoints,
    setEndpoints,
  ] =
    useState<WebhookEndpoint[]>(
      [],
    );

  const [
    deliveries,
    setDeliveries,
  ] =
    useState<
      WebhookDelivery[]
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
    pageError,
    setPageError,
  ] =
    useState<PageError | null>(
      null,
    );

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    endpointSearch,
    setEndpointSearch,
  ] = useState('');

  const [
    endpointPage,
    setEndpointPage,
  ] = useState(1);

  const [
    endpointPageSize,
    setEndpointPageSize,
  ] = useState(10);

  const [
    deliverySearch,
    setDeliverySearch,
  ] = useState('');

  const [
    deliveryStatus,
    setDeliveryStatus,
  ] =
    useState<DeliveryStatusFilter>(
      'ALL',
    );

  const [
    deliveryPage,
    setDeliveryPage,
  ] = useState(1);

  const [
    deliveryPageSize,
    setDeliveryPageSize,
  ] = useState(10);

  const [
    createOpen,
    setCreateOpen,
  ] = useState(false);

  const [
    createUrl,
    setCreateUrl,
  ] = useState('');

  const [
    createSubmitting,
    setCreateSubmitting,
  ] = useState(false);

  const [
    createError,
    setCreateError,
  ] =
    useState<MutationError | null>(
      null,
    );

  const [
    secretResult,
    setSecretResult,
  ] =
    useState<CreateWebhookEndpointResponse | null>(
      null,
    );

  const [
    secretAcknowledged,
    setSecretAcknowledged,
  ] = useState(false);

  const [
    selectedEndpoint,
    setSelectedEndpoint,
  ] =
    useState<WebhookEndpoint | null>(
      null,
    );

  const [
    editUrl,
    setEditUrl,
  ] = useState('');

  const [
    editActive,
    setEditActive,
  ] = useState(true);

  const [
    editSubmitting,
    setEditSubmitting,
  ] = useState(false);

  const [
    editError,
    setEditError,
  ] =
    useState<MutationError | null>(
      null,
    );

  const [
    selectedDelivery,
    setSelectedDelivery,
  ] =
    useState<WebhookDelivery | null>(
      null,
    );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [
          endpointResponse,
          deliveryResponse,
        ] =
          await Promise.all([
            webhookApi.listEndpoints(),
            webhookApi.listDeliveries(),
          ]);

        if (cancelled) {
          return;
        }

        setEndpoints(
          endpointResponse.endpoints,
        );

        setDeliveries(
          deliveryResponse.deliveries,
        );

        setPageError(null);
        setLoadStatus(
          'success',
        );
      } catch (error) {
        if (cancelled) {
          return;
        }

        setPageError(
          getPageError(error),
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

  const filteredEndpoints =
    useMemo(() => {
      const query =
        endpointSearch
          .trim()
          .toLocaleLowerCase(
            'pt-BR',
          );

      if (!query) {
        return endpoints;
      }

      return endpoints.filter(
        (endpoint) =>
          endpoint.url
            .toLocaleLowerCase(
              'pt-BR',
            )
            .includes(query),
      );
    }, [
      endpointSearch,
      endpoints,
    ]);

  const endpointTotalPages =
    Math.max(
      1,
      Math.ceil(
        filteredEndpoints.length /
          endpointPageSize,
      ),
    );

  const safeEndpointPage =
    Math.min(
      endpointPage,
      endpointTotalPages,
    );

  const visibleEndpoints =
    filteredEndpoints.slice(
      (
        safeEndpointPage - 1
      ) * endpointPageSize,
      safeEndpointPage *
        endpointPageSize,
    );

  const filteredDeliveries =
    useMemo(() => {
      const query =
        deliverySearch
          .trim()
          .toLocaleLowerCase(
            'pt-BR',
          );

      return deliveries.filter(
        (delivery) => {
          const matchesStatus =
            deliveryStatus ===
              'ALL' ||
            delivery.status ===
              deliveryStatus;

          if (!matchesStatus) {
            return false;
          }

          if (!query) {
            return true;
          }

          return [
            delivery.endpoint.url,
            delivery.event.type,
            delivery.event.externalId,
            String(
              delivery.httpStatus ??
                '',
            ),
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
      deliveries,
      deliverySearch,
      deliveryStatus,
    ]);

  const deliveryTotalPages =
    Math.max(
      1,
      Math.ceil(
        filteredDeliveries.length /
          deliveryPageSize,
      ),
    );

  const safeDeliveryPage =
    Math.min(
      deliveryPage,
      deliveryTotalPages,
    );

  const visibleDeliveries =
    filteredDeliveries.slice(
      (
        safeDeliveryPage - 1
      ) * deliveryPageSize,
      safeDeliveryPage *
        deliveryPageSize,
    );

  async function loadAll(
    showLoading: boolean,
  ) {
    if (showLoading) {
      setLoadStatus(
        'loading',
      );

      setPageError(null);
    }

    const [
      endpointResponse,
      deliveryResponse,
    ] =
      await Promise.all([
        webhookApi.listEndpoints(),
        webhookApi.listDeliveries(),
      ]);

    setEndpoints(
      endpointResponse.endpoints,
    );

    setDeliveries(
      deliveryResponse.deliveries,
    );

    setPageError(null);
    setLoadStatus(
      'success',
    );
  }

  async function retryLoad() {
    try {
      await loadAll(true);
    } catch (error) {
      setPageError(
        getPageError(error),
      );

      setLoadStatus(
        'error',
      );
    }
  }

  async function refreshAll() {
    setRefreshing(true);

    try {
      await loadAll(false);
    } catch (error) {
      toast({
        tone: 'error',
        title:
          'Não foi possível atualizar',
        description:
          getPageError(error)
            .message,
      });
    } finally {
      setRefreshing(false);
    }
  }

  function openCreateModal() {
    setCreateUrl('');
    setCreateError(null);
    setCreateOpen(true);
  }

  function closeCreateModal() {
    if (createSubmitting) {
      return;
    }

    setCreateOpen(false);
    setCreateError(null);
  }

  async function handleCreate(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const url =
      createUrl.trim();

    if (!validateWebhookUrl(url)) {
      setCreateError({
        message:
          'Informe uma URL HTTP ou HTTPS válida.',
        requestId: null,
      });

      return;
    }

    setCreateSubmitting(true);
    setCreateError(null);

    try {
      const result =
        await webhookApi.createEndpoint({
          url,
        });

      setEndpoints(
        (current) => [
          result.endpoint,
          ...current,
        ],
      );

      setCreateOpen(false);
      setCreateUrl('');

      setSecretAcknowledged(
        false,
      );

      setSecretResult(
        result,
      );
    } catch (error) {
      setCreateError(
        getMutationError(
          error,
        ),
      );
    } finally {
      setCreateSubmitting(
        false,
      );
    }
  }

  async function copySecret() {
    if (!secretResult) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        secretResult.secret,
      );

      toast({
        tone: 'success',
        title:
          'Segredo copiado',
        description:
          'Armazene-o em um local seguro.',
      });
    } catch {
      toast({
        tone: 'error',
        title:
          'Não foi possível copiar',
        description:
          'Selecione e copie o segredo manualmente.',
      });
    }
  }

  function closeSecretModal() {
    if (
      !secretAcknowledged
    ) {
      return;
    }

    setSecretResult(null);
    setSecretAcknowledged(
      false,
    );

    toast({
      tone: 'success',
      title:
        'Endpoint criado',
      description:
        'O webhook está pronto para receber entregas.',
    });
  }

  function openEditEndpoint(
    endpoint:
      WebhookEndpoint,
  ) {
    if (!canManage) {
      return;
    }

    setSelectedEndpoint(
      endpoint,
    );

    setEditUrl(
      endpoint.url,
    );

    setEditActive(
      endpoint.active,
    );

    setEditError(null);
  }

  function closeEditEndpoint() {
    if (editSubmitting) {
      return;
    }

    setSelectedEndpoint(
      null,
    );

    setEditError(null);
  }

  async function handleEdit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!selectedEndpoint) {
      return;
    }

    const url =
      editUrl.trim();

    if (!validateWebhookUrl(url)) {
      setEditError({
        message:
          'Informe uma URL HTTP ou HTTPS válida.',
        requestId: null,
      });

      return;
    }

    const input:
      UpdateWebhookEndpointInput = {};

    if (
      url !==
      selectedEndpoint.url
    ) {
      input.url = url;
    }

    if (
      editActive !==
      selectedEndpoint.active
    ) {
      input.active =
        editActive;
    }

    if (
      Object.keys(
        input,
      ).length === 0
    ) {
      return;
    }

    setEditSubmitting(true);
    setEditError(null);

    try {
      const response =
        await webhookApi.updateEndpoint(
          selectedEndpoint.id,
          input,
        );

      setEndpoints(
        (current) =>
          current.map(
            (endpoint) =>
              endpoint.id ===
              response.endpoint.id
                ? response.endpoint
                : endpoint,
          ),
      );

      setSelectedEndpoint(
        null,
      );

      toast({
        tone: 'success',
        title:
          'Endpoint atualizado',
        description:
          'As configurações do webhook foram salvas.',
      });
    } catch (error) {
      setEditError(
        getMutationError(
          error,
        ),
      );
    } finally {
      setEditSubmitting(false);
    }
  }

  const editHasChanges =
    selectedEndpoint
      ? (
          editUrl.trim() !==
            selectedEndpoint.url ||
          editActive !==
            selectedEndpoint.active
        )
      : false;

  function handleEndpointKeyDown(
    event:
      KeyboardEvent<HTMLTableRowElement>,
    endpoint:
      WebhookEndpoint,
  ) {
    if (!canManage) {
      return;
    }

    if (
      event.key === 'Enter' ||
      event.key === ' '
    ) {
      event.preventDefault();

      openEditEndpoint(
        endpoint,
      );
    }
  }

  function clearEndpointSearch() {
    setEndpointSearch('');
    setEndpointPage(1);
  }

  function clearDeliveryFilters() {
    setDeliverySearch('');
    setDeliveryStatus('ALL');
    setDeliveryPage(1);
  }

  return (
    <>
      <PageHeader
        title="Webhooks"
        description="Configure endpoints externos e acompanhe o histórico de entregas."
        action={
          <div className="webhooks-page-actions">
            <Button
              variant="secondary"
              loading={refreshing}
              leadingIcon={
                <RefreshCw
                  size={16}
                  aria-hidden="true"
                />
              }
              onClick={() => {
                void refreshAll();
              }}
            >
              Atualizar
            </Button>

            {canManage && (
              <Button
                leadingIcon={
                  <Plus
                    size={16}
                    aria-hidden="true"
                  />
                }
                onClick={
                  openCreateModal
                }
              >
                Novo endpoint
              </Button>
            )}
          </div>
        }
      />

      {loadStatus ===
      'error' ? (
        <ErrorState
          title="Não foi possível carregar os webhooks"
          description={
            pageError?.message ??
            'Não foi possível carregar os webhooks.'
          }
          requestId={
            pageError?.requestId
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
        <WebhooksLoading />
      ) : (
        <Card
          padding="none"
          className="webhooks-card"
        >
          <div
            className="webhooks-tabs"
            role="group"
            aria-label="Seções de webhooks"
          >
            <button
              type="button"
              aria-pressed={
                activeTab ===
                'endpoints'
              }
              className={
                `webhooks-tab${
                  activeTab ===
                  'endpoints'
                    ? ' webhooks-tab--active'
                    : ''
                }`
              }
              onClick={() => {
                setActiveTab(
                  'endpoints',
                );
              }}
            >
              Endpoints

              <span>
                {endpoints.length}
              </span>
            </button>

            <button
              type="button"
              aria-pressed={
                activeTab ===
                'deliveries'
              }
              className={
                `webhooks-tab${
                  activeTab ===
                  'deliveries'
                    ? ' webhooks-tab--active'
                    : ''
                }`
              }
              onClick={() => {
                setActiveTab(
                  'deliveries',
                );
              }}
            >
              Entregas

              <span>
                {
                  deliveries.length
                }
              </span>
            </button>
          </div>

          {activeTab ===
          'endpoints' ? (
            <>
              <div className="webhooks-toolbar">
                <div className="webhooks-search">
                  <Input
                    label="Buscar endpoints"
                    value={
                      endpointSearch
                    }
                    placeholder="Buscar por URL..."
                    leadingIcon={
                      <Search
                        size={16}
                        aria-hidden="true"
                      />
                    }
                    onChange={(event) => {
                      setEndpointSearch(
                        event.target
                          .value,
                      );

                      setEndpointPage(1);
                    }}
                  />
                </div>

                <span className="webhooks-count">
                  {
                    filteredEndpoints.length
                  }{' '}
                  {filteredEndpoints.length ===
                  1
                    ? 'endpoint'
                    : 'endpoints'}
                </span>
              </div>

              {filteredEndpoints.length ===
              0 ? (
                endpoints.length ===
                  0 ? (
                  <EmptyState
                    icon={
                      <WebhookIcon
                        size={28}
                        aria-hidden="true"
                      />
                    }
                    title="Nenhum endpoint configurado"
                    description="Cadastre um endpoint para receber eventos do DomínioHub."
                    action={
                      canManage ? (
                        <Button
                          leadingIcon={
                            <Plus
                              size={16}
                              aria-hidden="true"
                            />
                          }
                          onClick={
                            openCreateModal
                          }
                        >
                          Novo endpoint
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
                    title="Nenhum endpoint encontrado"
                    description="Nenhum endpoint corresponde à busca informada."
                    action={
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={
                          clearEndpointSearch
                        }
                      >
                        Limpar busca
                      </Button>
                    }
                  />
                )
              ) : (
                <>
                  <div className="webhooks-desktop-table">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>
                            Endpoint
                          </TableHead>

                          <TableHead>
                            Status
                          </TableHead>

                          <TableHead>
                            Criado
                          </TableHead>

                          <TableHead>
                            Atualizado
                          </TableHead>

                          <TableHead
                            aria-label="Editar endpoint"
                          />
                        </TableRow>
                      </TableHeader>

                      <TableBody>
                        {visibleEndpoints.map(
                          (endpoint) => (
                            <TableRow
                              key={
                                endpoint.id
                              }
                              className={
                                canManage
                                  ? 'webhooks-table-row--interactive'
                                  : undefined
                              }
                              tabIndex={
                                canManage
                                  ? 0
                                  : undefined
                              }
                              aria-label={
                                canManage
                                  ? `Editar endpoint ${endpoint.url}`
                                  : undefined
                              }
                              onClick={
                                canManage
                                  ? () => {
                                    openEditEndpoint(
                                      endpoint,
                                    );
                                  }
                                  : undefined
                              }
                              onKeyDown={
                                canManage
                                  ? (
                                    event,
                                  ) => {
                                    handleEndpointKeyDown(
                                      event,
                                      endpoint,
                                    );
                                  }
                                  : undefined
                              }
                            >
                              <TableCell>
                                <span className="webhooks-endpoint-url">
                                  {
                                    endpoint.url
                                  }
                                </span>
                              </TableCell>

                              <TableCell>
                                <Badge
                                  tone={
                                    endpoint.active
                                      ? 'success'
                                      : 'neutral'
                                  }
                                >
                                  {endpoint.active
                                    ? 'Ativo'
                                    : 'Inativo'}
                                </Badge>
                              </TableCell>

                              <TableCell>
                                {formatDateTime(
                                  endpoint.createdAt,
                                )}
                              </TableCell>

                              <TableCell>
                                {formatDateTime(
                                  endpoint.updatedAt,
                                )}
                              </TableCell>

                              <TableCell>
                                {canManage && (
                                  <ChevronRight
                                    className="webhooks-row-chevron"
                                    size={16}
                                    aria-hidden="true"
                                  />
                                )}
                              </TableCell>
                            </TableRow>
                          ),
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="webhooks-mobile-list">
                    {visibleEndpoints.map(
                      (endpoint) => (
                        <button
                          key={
                            endpoint.id
                          }
                          type="button"
                          className="webhooks-mobile-card"
                          disabled={
                            !canManage
                          }
                          onClick={() => {
                            openEditEndpoint(
                              endpoint,
                            );
                          }}
                        >
                          <div className="webhooks-mobile-card__content">
                            <strong>
                              {
                                endpoint.url
                              }
                            </strong>

                            <div className="webhooks-mobile-card__meta">
                              <Badge
                                tone={
                                  endpoint.active
                                    ? 'success'
                                    : 'neutral'
                                }
                              >
                                {endpoint.active
                                  ? 'Ativo'
                                  : 'Inativo'}
                              </Badge>

                              <span>
                                Atualizado{' '}
                                {formatDateTime(
                                  endpoint.updatedAt,
                                )}
                              </span>
                            </div>
                          </div>

                          {canManage && (
                            <ChevronRight
                              size={18}
                              aria-hidden="true"
                            />
                          )}
                        </button>
                      ),
                    )}
                  </div>

                  <Pagination
                    page={
                      safeEndpointPage
                    }
                    pageSize={
                      endpointPageSize
                    }
                    totalItems={
                      filteredEndpoints.length
                    }
                    onPageChange={
                      setEndpointPage
                    }
                    onPageSizeChange={(
                      nextPageSize,
                    ) => {
                      setEndpointPageSize(
                        nextPageSize,
                      );

                      setEndpointPage(1);
                    }}
                  />
                </>
              )}
            </>
          ) : (
            <>
              <div className="webhooks-toolbar webhooks-toolbar--deliveries">
                <div className="webhooks-search">
                  <Input
                    label="Buscar entregas"
                    value={
                      deliverySearch
                    }
                    placeholder="Buscar endpoint, evento ou ID externo..."
                    leadingIcon={
                      <Search
                        size={16}
                        aria-hidden="true"
                      />
                    }
                    onChange={(event) => {
                      setDeliverySearch(
                        event.target
                          .value,
                      );

                      setDeliveryPage(1);
                    }}
                  />
                </div>

                <div className="webhooks-filter">
                  <Select
                    label="Status"
                    value={
                      deliveryStatus
                    }
                    onChange={(event) => {
                      setDeliveryStatus(
                        event.target
                          .value as DeliveryStatusFilter,
                      );

                      setDeliveryPage(1);
                    }}
                  >
                    <option value="ALL">
                      Todos
                    </option>

                    <option value="PENDING">
                      Pendentes
                    </option>

                    <option value="SUCCESS">
                      Sucesso
                    </option>

                    <option value="FAILED">
                      Falhas
                    </option>
                  </Select>
                </div>

                <span className="webhooks-count">
                  {
                    filteredDeliveries.length
                  }{' '}
                  {filteredDeliveries.length ===
                  1
                    ? 'entrega'
                    : 'entregas'}
                </span>
              </div>

              {filteredDeliveries.length ===
              0 ? (
                deliveries.length ===
                  0 ? (
                  <EmptyState
                    icon={
                      <CheckCircle2
                        size={28}
                        aria-hidden="true"
                      />
                    }
                    title="Nenhuma entrega registrada"
                    description="As tentativas de entrega dos webhooks aparecerão aqui."
                  />
                ) : (
                  <EmptyState
                    icon={
                      <Search
                        size={28}
                        aria-hidden="true"
                      />
                    }
                    title="Nenhuma entrega encontrada"
                    description="Nenhuma entrega corresponde aos filtros informados."
                    action={
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={
                          clearDeliveryFilters
                        }
                      >
                        Limpar filtros
                      </Button>
                    }
                  />
                )
              ) : (
                <>
                  <div className="webhooks-desktop-table">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>
                            Status
                          </TableHead>

                          <TableHead>
                            Endpoint
                          </TableHead>

                          <TableHead>
                            Evento
                          </TableHead>

                          <TableHead>
                            Tentativa
                          </TableHead>

                          <TableHead>
                            HTTP
                          </TableHead>

                          <TableHead>
                            Data
                          </TableHead>

                          <TableHead
                            aria-label="Abrir entrega"
                          />
                        </TableRow>
                      </TableHeader>

                      <TableBody>
                        {visibleDeliveries.map(
                          (delivery) => (
                            <TableRow
                              key={
                                delivery.id
                              }
                              className="webhooks-table-row--interactive"
                              tabIndex={0}
                              aria-label={
                                `Abrir entrega do evento ${delivery.event.type}`
                              }
                              onClick={() => {
                                setSelectedDelivery(
                                  delivery,
                                );
                              }}
                              onKeyDown={(event) => {
                                if (
                                  event.key ===
                                    'Enter' ||
                                  event.key ===
                                    ' '
                                ) {
                                  event.preventDefault();

                                  setSelectedDelivery(
                                    delivery,
                                  );
                                }
                              }}
                            >
                              <TableCell>
                                <Badge
                                  tone={
                                    getDeliveryTone(
                                      delivery.status,
                                    )
                                  }
                                >
                                  {
                                    deliveryStatusLabels[
                                      delivery.status
                                    ]
                                  }
                                </Badge>
                              </TableCell>

                              <TableCell>
                                <span className="webhooks-delivery-url">
                                  {
                                    delivery.endpoint.url
                                  }
                                </span>
                              </TableCell>

                              <TableCell>
                                <div className="webhooks-event-cell">
                                  <strong>
                                    {
                                      delivery.event.type
                                    }
                                  </strong>

                                  <code>
                                    {
                                      delivery.event.externalId
                                    }
                                  </code>
                                </div>
                              </TableCell>

                              <TableCell>
                                #
                                {
                                  delivery.attempt
                                }
                              </TableCell>

                              <TableCell>
                                {
                                  delivery.httpStatus ??
                                  '—'
                                }
                              </TableCell>

                              <TableCell>
                                {formatDateTime(
                                  delivery.attemptedAt,
                                )}
                              </TableCell>

                              <TableCell>
                                <ChevronRight
                                  className="webhooks-row-chevron"
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

                  <div className="webhooks-mobile-list">
                    {visibleDeliveries.map(
                      (delivery) => (
                        <button
                          key={
                            delivery.id
                          }
                          type="button"
                          className="webhooks-mobile-card"
                          onClick={() => {
                            setSelectedDelivery(
                              delivery,
                            );
                          }}
                        >
                          <div className="webhooks-mobile-card__content">
                            <div className="webhooks-mobile-card__header">
                              <strong>
                                {
                                  delivery.event.type
                                }
                              </strong>

                              <Badge
                                tone={
                                  getDeliveryTone(
                                    delivery.status,
                                  )
                                }
                              >
                                {
                                  deliveryStatusLabels[
                                    delivery.status
                                  ]
                                }
                              </Badge>
                            </div>

                            <span>
                              {
                                delivery.endpoint.url
                              }
                            </span>

                            <div className="webhooks-mobile-card__meta">
                              <span>
                                Tentativa #
                                {
                                  delivery.attempt
                                }
                              </span>

                              <span>
                                HTTP{' '}
                                {
                                  delivery.httpStatus ??
                                  '—'
                                }
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
                    page={
                      safeDeliveryPage
                    }
                    pageSize={
                      deliveryPageSize
                    }
                    totalItems={
                      filteredDeliveries.length
                    }
                    onPageChange={
                      setDeliveryPage
                    }
                    onPageSizeChange={(
                      nextPageSize,
                    ) => {
                      setDeliveryPageSize(
                        nextPageSize,
                      );

                      setDeliveryPage(1);
                    }}
                  />
                </>
              )}
            </>
          )}
        </Card>
      )}

      <Modal
        open={createOpen}
        onClose={
          closeCreateModal
        }
        title="Novo endpoint"
        description="Informe a URL pública que receberá os eventos enviados pelo DomínioHub."
        footer={
          <>
            <Button
              variant="secondary"
              disabled={
                createSubmitting
              }
              onClick={
                closeCreateModal
              }
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              form="create-webhook-form"
              loading={
                createSubmitting
              }
            >
              Criar endpoint
            </Button>
          </>
        }
      >
        <form
          id="create-webhook-form"
          className="webhooks-form"
          onSubmit={(event) => {
            void handleCreate(
              event,
            );
          }}
          noValidate
        >
          <Input
            label="URL do endpoint"
            type="url"
            autoFocus
            required
            value={
              createUrl
            }
            placeholder="https://api.exemplo.com/webhooks"
            hint="A URL deve usar HTTP ou HTTPS e ser acessível publicamente."
            error={
              createError
                ? createError.message
                : undefined
            }
            onChange={(event) => {
              setCreateUrl(
                event.target.value,
              );

              setCreateError(null);
            }}
          />

          {createError?.requestId && (
            <span className="webhooks-support-code">
              Código de suporte:{' '}
              <code>
                {
                  createError.requestId
                }
              </code>
            </span>
          )}
        </form>
      </Modal>

      <Modal
        open={
          secretResult !== null
        }
        onClose={
          closeSecretModal
        }
        title="Salve o segredo do webhook"
        description="Este segredo é exibido somente agora e não poderá ser consultado novamente."
        size="md"
        footer={
          <Button
            disabled={
              !secretAcknowledged
            }
            onClick={
              closeSecretModal
            }
          >
            Concluir
          </Button>
        }
      >
        {secretResult && (
          <div className="webhooks-secret">
            <div className="webhooks-secret__warning">
              <CircleAlert
                size={20}
                aria-hidden="true"
              />

              <div>
                <strong>
                  Exibição única
                </strong>

                <p>
                  Armazene este segredo em um local seguro. Ele será usado para verificar a assinatura das entregas.
                </p>
              </div>
            </div>

            <div className="webhooks-secret__value">
              <code>
                {
                  secretResult.secret
                }
              </code>

              <Button
                variant="secondary"
                size="sm"
                leadingIcon={
                  <Copy
                    size={15}
                    aria-hidden="true"
                  />
                }
                onClick={() => {
                  void copySecret();
                }}
              >
                Copiar
              </Button>
            </div>

            <div className="webhooks-secret__endpoint">
              Endpoint:{' '}
              <strong>
                {
                  secretResult.endpoint.url
                }
              </strong>
            </div>

            <label className="webhooks-secret-confirm">
              <input
                type="checkbox"
                checked={
                  secretAcknowledged
                }
                onChange={(event) => {
                  setSecretAcknowledged(
                    event.target.checked,
                  );
                }}
              />

              <span>
                Já copiei ou armazenei o segredo com segurança.
              </span>
            </label>
          </div>
        )}
      </Modal>

      <Modal
        open={
          selectedEndpoint !== null
        }
        onClose={
          closeEditEndpoint
        }
        title="Editar endpoint"
        description="Atualize a URL ou altere o status do webhook."
        footer={
          <>
            <Button
              variant="secondary"
              disabled={
                editSubmitting
              }
              onClick={
                closeEditEndpoint
              }
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              form="edit-webhook-form"
              loading={
                editSubmitting
              }
              disabled={
                !editHasChanges
              }
            >
              Salvar alterações
            </Button>
          </>
        }
      >
        {selectedEndpoint && (
          <form
            id="edit-webhook-form"
            className="webhooks-form"
            onSubmit={(event) => {
              void handleEdit(
                event,
              );
            }}
            noValidate
          >
            <Input
              label="URL do endpoint"
              type="url"
              required
              value={
                editUrl
              }
              placeholder="https://api.exemplo.com/webhooks"
              error={
                editError
                  ? editError.message
                  : undefined
              }
              onChange={(event) => {
                setEditUrl(
                  event.target.value,
                );

                setEditError(null);
              }}
            />

            <label className="webhooks-toggle">
              <input
                type="checkbox"
                checked={
                  editActive
                }
                onChange={(event) => {
                  setEditActive(
                    event.target.checked,
                  );

                  setEditError(null);
                }}
              />

              <span
                className="webhooks-toggle__track"
                aria-hidden="true"
              />

              <span className="webhooks-toggle__content">
                <strong>
                  Endpoint ativo
                </strong>

                <span>
                  Endpoints inativos não recebem novas entregas.
                </span>
              </span>
            </label>

            {editError?.requestId && (
              <span className="webhooks-support-code">
                Código de suporte:{' '}
                <code>
                  {
                    editError.requestId
                  }
                </code>
              </span>
            )}
          </form>
        )}
      </Modal>

      <Drawer
        open={
          selectedDelivery !== null
        }
        onClose={() => {
          setSelectedDelivery(
            null,
          );
        }}
        title="Detalhes da entrega"
        description="Informações da tentativa de envio do webhook."
      >
        {selectedDelivery && (
          <div className="webhooks-delivery-detail">
            <div className="webhooks-delivery-detail__status">
              <Badge
                tone={
                  getDeliveryTone(
                    selectedDelivery.status,
                  )
                }
              >
                {
                  deliveryStatusLabels[
                    selectedDelivery.status
                  ]
                }
              </Badge>
            </div>

            <div className="webhooks-detail-grid">
              <div>
                <span>
                  Endpoint
                </span>

                <strong>
                  {
                    selectedDelivery.endpoint.url
                  }
                </strong>
              </div>

              <div>
                <span>
                  Evento
                </span>

                <strong>
                  {
                    selectedDelivery.event.type
                  }
                </strong>
              </div>

              <div>
                <span>
                  ID externo
                </span>

                <code>
                  {
                    selectedDelivery.event.externalId
                  }
                </code>
              </div>

              <div>
                <span>
                  Tentativa
                </span>

                <strong>
                  #
                  {
                    selectedDelivery.attempt
                  }
                </strong>
              </div>

              <div>
                <span>
                  HTTP
                </span>

                <strong>
                  {
                    selectedDelivery.httpStatus ??
                    '—'
                  }
                </strong>
              </div>

              <div>
                <span>
                  Data
                </span>

                <strong>
                  {formatDateTime(
                    selectedDelivery.attemptedAt,
                  )}
                </strong>
              </div>
            </div>

            <div className="webhooks-delivery-error">
              <span>
                Erro
              </span>

              <p>
                {
                  selectedDelivery.errorMessage ??
                  'Nenhum erro registrado.'
                }
              </p>
            </div>

            <Link
              to={
                `/events/${selectedDelivery.event.id}`
              }
              className="webhooks-event-link"
              onClick={() => {
                setSelectedDelivery(
                  null,
                );
              }}
            >
              Abrir evento

              <ExternalLink
                size={14}
                aria-hidden="true"
              />
            </Link>
          </div>
        )}
      </Drawer>
    </>
  );
}
