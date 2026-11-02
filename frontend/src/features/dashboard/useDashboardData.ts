import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  ApiError,
} from '../../services/api-client';

import {
  domainApi,
} from '../domains/domain-api';

import type {
  DomainRecord,
} from '../domains/types';

import {
  eventApi,
} from '../events/event-api';

import type {
  OperationalEvent,
} from '../events/types';

import {
  webhookApi,
} from '../webhooks/webhook-api';

import type {
  WebhookDelivery,
} from '../webhooks/types';

export interface DashboardData {
  domains: DomainRecord[];
  events: OperationalEvent[];
  deliveries: WebhookDelivery[];
}

interface DashboardError {
  message: string;
  requestId: string | null;
}

type DashboardStatus =
  | 'loading'
  | 'success'
  | 'error';

function getDashboardError(
  error: unknown,
): DashboardError {
  if (!(error instanceof ApiError)) {
    return {
      message:
        'Não foi possível carregar a visão geral.',
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
        'Sua conta não possui permissão para carregar todos os dados da visão geral.',
      requestId:
        error.requestId,
    };
  }

  if (
    error.statusCode >= 500
  ) {
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
      'Não foi possível carregar a visão geral.',
    requestId:
      error.requestId,
  };
}

async function fetchDashboardData(): Promise<DashboardData> {
  const [
    domainResponse,
    eventResponse,
    deliveryResponse,
  ] = await Promise.all([
    domainApi.list(),
    eventApi.list(),
    webhookApi.listDeliveries(),
  ]);

  return {
    domains:
      domainResponse.domains,

    events:
      eventResponse.events,

    deliveries:
      deliveryResponse.deliveries,
  };
}

export function useDashboardData() {
  const [
    data,
    setData,
  ] =
    useState<DashboardData | null>(
      null,
    );

  const [
    status,
    setStatus,
  ] =
    useState<DashboardStatus>(
      'loading',
    );

  const [
    error,
    setError,
  ] =
    useState<DashboardError | null>(
      null,
    );

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const result =
          await fetchDashboardData();

        if (cancelled) {
          return;
        }

        setData(result);
        setError(null);
        setStatus('success');
      } catch (caughtError) {
        if (cancelled) {
          return;
        }

        setError(
          getDashboardError(
            caughtError,
          ),
        );

        setStatus('error');
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  const refresh =
    useCallback(async () => {
      setStatus('loading');
      setError(null);

      try {
        const result =
          await fetchDashboardData();

        setData(result);
        setStatus('success');
      } catch (caughtError) {
        setError(
          getDashboardError(
            caughtError,
          ),
        );

        setStatus('error');
      }
    }, []);

  return {
    data,
    status,
    error,
    refresh,
  };
}
