import { createHash } from 'node:crypto';

import * as argon2 from 'argon2';

import { prisma } from '../src/infrastructure/database/prisma.js';
import { webhookCryptoService } from '../src/modules/webhooks/webhook-crypto.service.js';

type DemoRole = 'ADMIN' | 'OPERATOR' | 'SUPPORT';
type DemoDomainStatus = 'ACTIVE' | 'EXPIRING' | 'EXPIRED' | 'UNKNOWN';
type DemoEventStatus = 'PROCESSED' | 'PENDING' | 'PROCESSING' | 'FAILED';
type DemoEndpointKind = 'crm' | 'marketing' | 'legacy';

type DemoOrganization = {
  name: string;
  slug: string;
  eventKey: string;
  eventPrefix: string;
  uuidPrefix: string;
  users: {
    name: string;
    email: string;
    role: DemoRole;
    active: boolean;
  }[];
  domains: {
    name: string;
    externalId: string;
    provider?: string;
    registrar?: string;
    status: DemoDomainStatus;
    expiresAt: string | null;
    address: string;
  }[];
};

/*
 * Constantes exclusivamente de demonstração.
 * Senha compartilhada: demo1234.
 * Apenas hashes da senha e das event ingest keys são persistidos.
 */
const demoPassword = 'demo1234';

const demoOrganizations: DemoOrganization[] = [
  {
    name: 'DomínioHub Demo',
    slug: 'dominiohub-demo',
    eventKey: 'dh-demo-events-K7m2Q9x4R8v1P6t3N5z0',
    eventPrefix: 'demo-a',
    uuidPrefix: '11111111',
    users: [
      { name: 'Mariana Souza', email: 'admin@dominiohub.com', role: 'ADMIN', active: true },
      { name: 'Lucas Almeida', email: 'operator@dominiohub.com', role: 'OPERATOR', active: true },
      { name: 'Beatriz Costa', email: 'support@dominiohub.com', role: 'SUPPORT', active: true },
      { name: 'Carlos Mendes', email: 'carlos.mendes@dominiohub.com', role: 'OPERATOR', active: true },
      { name: 'Fernanda Rocha', email: 'fernanda.rocha@dominiohub.com', role: 'SUPPORT', active: true },
      { name: 'Paulo Santos', email: 'paulo.santos@dominiohub.com', role: 'SUPPORT', active: false },
    ],
    domains: [
      {
        name: 'agencia-demo.com.br',
        externalId: 'mock-domain-001',
        provider: 'mock-namecheap',
        registrar: 'Namecheap Mock',
        status: 'ACTIVE',
        expiresAt: '2027-10-01',
        address: '192.0.2.10',
      },
      {
        name: 'cliente-demo.com.br',
        externalId: 'mock-domain-002',
        provider: 'mock-namecheap',
        registrar: 'Namecheap Mock',
        status: 'EXPIRING',
        expiresAt: '2026-12-10',
        address: '198.51.100.10',
      },
      {
        name: 'portfolio-digital.com',
        externalId: 'mock-domain-003',
        provider: 'mock-namecheap',
        registrar: 'Namecheap Mock',
        status: 'ACTIVE',
        expiresAt: '2028-03-15',
        address: '203.0.113.10',
      },
      {
        name: 'projeto-legado.com.br',
        externalId: 'demo-a-expired',
        status: 'EXPIRED',
        expiresAt: '2026-09-15',
        address: '192.0.2.11',
      },
      {
        name: 'dominio-em-analise.com.br',
        externalId: 'demo-a-unknown',
        status: 'UNKNOWN',
        expiresAt: null,
        address: '198.51.100.11',
      },
    ],
  },
  {
    name: 'Agência Norte',
    slug: 'agencia-norte',
    eventKey: 'dh-norte-events-T4p8X1q7M9r3V6k2Z5n0',
    eventPrefix: 'demo-b',
    uuidPrefix: '22222222',
    users: [
      { name: 'Helena Nogueira', email: 'admin@agencianorte.com', role: 'ADMIN', active: true },
      { name: 'Gustavo Freire', email: 'operator@agencianorte.com', role: 'OPERATOR', active: true },
      { name: 'Larissa Melo', email: 'support@agencianorte.com', role: 'SUPPORT', active: true },
      { name: 'Renato Silva', email: 'renato.silva@agencianorte.com', role: 'OPERATOR', active: true },
      { name: 'Aline Costa', email: 'aline.costa@agencianorte.com', role: 'SUPPORT', active: true },
      { name: 'Marcos Lima', email: 'marcos.lima@agencianorte.com', role: 'OPERATOR', active: false },
    ],
    domains: [
      {
        name: 'empresa-acre.com.br',
        externalId: 'norte-active-001',
        status: 'ACTIVE',
        expiresAt: '2027-08-20',
        address: '198.51.100.20',
      },
      {
        name: 'loja-norte.com.br',
        externalId: 'norte-active-002',
        status: 'ACTIVE',
        expiresAt: '2027-06-12',
        address: '203.0.113.20',
      },
      {
        name: 'campanha-norte.com.br',
        externalId: 'norte-expiring-001',
        status: 'EXPIRING',
        expiresAt: '2026-12-05',
        address: '192.0.2.20',
      },
      {
        name: 'cliente-antigo.com.br',
        externalId: 'norte-expired-001',
        status: 'EXPIRED',
        expiresAt: '2026-08-17',
        address: '198.51.100.21',
      },
      {
        name: 'dominio-pendente.net',
        externalId: 'norte-unknown-001',
        status: 'UNKNOWN',
        expiresAt: null,
        address: '203.0.113.21',
      },
    ],
  },
  {
    name: 'Agência Horizonte',
    slug: 'agencia-horizonte',
    eventKey: 'dh-horizonte-events-H8m3Q7v2R5p9T4x1Z6n0',
    eventPrefix: 'demo-c',
    uuidPrefix: '33333333',
    users: [
      { name: 'Sofia Barros', email: 'admin@agenciahorizonte.com', role: 'ADMIN', active: true },
      { name: 'Matheus Ribeiro', email: 'operator@agenciahorizonte.com', role: 'OPERATOR', active: true },
      { name: 'Isabela Fernandes', email: 'support@agenciahorizonte.com', role: 'SUPPORT', active: true },
      { name: 'Daniel Moura', email: 'daniel.moura@agenciahorizonte.com', role: 'OPERATOR', active: true },
      { name: 'Laura Teixeira', email: 'laura.teixeira@agenciahorizonte.com', role: 'SUPPORT', active: true },
      { name: 'Vinícius Azevedo', email: 'vinicius.azevedo@agenciahorizonte.com', role: 'SUPPORT', active: false },
    ],
    domains: [
      {
        name: 'agencia-horizonte.com.br',
        externalId: 'horizonte-active-001',
        status: 'ACTIVE',
        expiresAt: '2028-01-20',
        address: '203.0.113.30',
      },
      {
        name: 'cliente-horizonte.com.br',
        externalId: 'horizonte-active-002',
        status: 'ACTIVE',
        expiresAt: '2027-09-18',
        address: '192.0.2.30',
      },
      {
        name: 'campanha-verao.com.br',
        externalId: 'horizonte-expiring-001',
        status: 'EXPIRING',
        expiresAt: '2026-12-18',
        address: '198.51.100.30',
      },
      {
        name: 'projeto-encerrado.com.br',
        externalId: 'horizonte-expired-001',
        status: 'EXPIRED',
        expiresAt: '2026-07-30',
        address: '203.0.113.31',
      },
      {
        name: 'dominio-sem-status.com',
        externalId: 'horizonte-unknown-001',
        status: 'UNKNOWN',
        expiresAt: null,
        address: '192.0.2.31',
      },
    ],
  },
];

const demoEventDefinitions = [
  {
    number: '001',
    type: 'domain.synced',
    status: 'PROCESSED',
    domainStatus: 'ACTIVE',
    receivedAt: '2026-11-02T12:00:00.000Z',
    processedAt: '2026-11-02T12:00:05.000Z',
    previousStatus: 'UNKNOWN',
    currentStatus: 'ACTIVE',
    message: 'Sincronização do domínio concluída.',
  },
  {
    number: '002',
    type: 'domain.expiring',
    status: 'PENDING',
    domainStatus: 'EXPIRING',
    receivedAt: '2026-11-02T11:30:00.000Z',
    processedAt: null,
    previousStatus: 'ACTIVE',
    currentStatus: 'EXPIRING',
    message: 'Aviso de vencimento aguardando processamento.',
  },
  {
    number: '003',
    type: 'dns.updated',
    status: 'PROCESSING',
    domainStatus: 'ACTIVE',
    receivedAt: '2026-11-02T11:00:00.000Z',
    processedAt: null,
    previousStatus: 'ACTIVE',
    currentStatus: 'ACTIVE',
    message: 'Atualização de registros DNS em processamento.',
  },
  {
    number: '004',
    type: 'webhook.processing_failed',
    status: 'FAILED',
    domainStatus: 'EXPIRED',
    receivedAt: '2026-11-02T10:30:00.000Z',
    processedAt: null,
    previousStatus: 'EXPIRED',
    currentStatus: 'EXPIRED',
    message: 'Falha no processamento da notificação externa.',
  },
] as const;

const demoEndpointDefinitions = [
  { kind: 'crm', name: 'Integração CRM', active: true },
  { kind: 'marketing', name: 'Automação de Marketing', active: true },
  { kind: 'legacy', name: 'Endpoint Legado', active: false },
] as const;

const demoDeliveryDefinitions = [
  {
    eventStatus: 'PROCESSED',
    endpointKind: 'crm',
    attempt: 1,
    status: 'SUCCESS',
    httpStatus: 204,
    errorMessage: null,
    attemptedAt: '2026-11-02T12:00:10.000Z',
  },
  {
    eventStatus: 'FAILED',
    endpointKind: 'marketing',
    attempt: 1,
    status: 'FAILED',
    httpStatus: 500,
    errorMessage: 'Servidor remoto retornou HTTP 500.',
    attemptedAt: '2026-11-02T10:30:10.000Z',
  },
  {
    eventStatus: 'FAILED',
    endpointKind: 'marketing',
    attempt: 2,
    status: 'FAILED',
    httpStatus: null,
    errorMessage: 'Falha de conexão com o endpoint remoto.',
    attemptedAt: '2026-11-02T10:31:10.000Z',
  },
  {
    eventStatus: 'PENDING',
    endpointKind: 'crm',
    attempt: 1,
    status: 'PENDING',
    httpStatus: null,
    errorMessage: null,
    attemptedAt: '2026-11-02T11:30:10.000Z',
  },
] as const;

const demoConversationDefinitions = [
  {
    role: 'ADMIN',
    title: 'Resumo operacional da agência',
    createdAt: '2026-11-02T09:00:00.000Z',
    messages: [
      'Quais pontos devo acompanhar no painel da agência?',
      'Acompanhe principalmente os domínios próximos do vencimento, eventos com falha e entregas de webhook que precisam de atenção.',
      'E como priorizo os problemas?',
      'Comece por domínios expirados ou próximos do vencimento e, em seguida, verifique eventos e webhooks com falha.',
    ],
  },
  {
    role: 'OPERATOR',
    title: 'Organização de domínios',
    createdAt: '2026-11-02T08:00:00.000Z',
    messages: [
      'Como posso organizar a revisão dos domínios?',
      'Priorize domínios expirados, depois os que estão próximos do vencimento e revise os registros DNS das propriedades mais críticas.',
      'Também devo acompanhar os eventos?',
      'Sim. Os eventos ajudam a identificar sincronizações, alterações de DNS e falhas que exigem acompanhamento.',
    ],
  },
  {
    role: 'SUPPORT',
    title: 'Análise de eventos e webhooks',
    createdAt: '2026-11-02T07:00:00.000Z',
    messages: [
      'O que significa um evento com status de falha?',
      'Significa que o processamento não foi concluído corretamente e o detalhe do evento deve ser consultado para identificar o contexto.',
      'E uma entrega de webhook com falha?',
      'Ela indica que o endpoint externo não confirmou a entrega. Consulte o histórico para verificar tentativas, código HTTP e mensagem de erro.',
    ],
  },
] as const;

function hashEventIngestKey(key: string): string {
  return createHash('sha256')
    .update(key)
    .digest('hex');
}

function demoUuid(
  organizationPrefix: string,
  kind: '1000' | '2000' | '3000',
  record: number,
): string {
  return `${organizationPrefix}-${kind}-4000-8000-${String(record).padStart(12, '0')}`;
}

function demoDns(name: string, address: string) {
  return [
    { type: 'A', host: '@', value: address, ttl: 1800 },
    { type: 'CNAME', host: 'www', value: name, ttl: 1800 },
    { type: 'MX', host: '@', value: `mail.${name}`, ttl: 1800 },
    { type: 'TXT', host: '@', value: 'v=spf1 mx -all', ttl: 3600 },
  ];
}

async function main() {
  /*
   * Organizações
   */
  const organizations = [];

  for (const demo of demoOrganizations) {
    const organization = await prisma.organization.upsert({
      where: { slug: demo.slug },
      update: {
        name: demo.name,
        eventIngestKeyHash: hashEventIngestKey(demo.eventKey),
      },
      create: {
        name: demo.name,
        slug: demo.slug,
        eventIngestKeyHash: hashEventIngestKey(demo.eventKey),
      },
    });

    organizations.push({
      organization,
      demo,
      principalUserIds: new Map<DemoRole, string>(),
      eventIds: new Map<DemoEventStatus, string>(),
      endpointIds: new Map<DemoEndpointKind, string>(),
    });
  }

  /*
   * Senha: um único hash Argon2 por execução.
   */
  const demoPasswordHash = await argon2.hash(demoPassword);

  /*
   * Usuários
   */
  for (const entry of organizations) {
    for (const demoUser of entry.demo.users) {
      const data = {
        organizationId: entry.organization.id,
        name: demoUser.name,
        role: demoUser.role,
        active: demoUser.active,
        passwordHash: demoPasswordHash,
      };

      const user = await prisma.user.upsert({
        where: { email: demoUser.email },
        update: data,
        create: { ...data, email: demoUser.email },
      });

      // Os primeiros usuários de cada role são as contas principais.
      if (!entry.principalUserIds.has(demoUser.role)) {
        entry.principalUserIds.set(demoUser.role, user.id);
      }
    }
  }

  /*
   * Domínios: DNS fictícios, com IPs reservados para documentação.
   */
  for (const entry of organizations) {
    for (const domain of entry.demo.domains) {
      const data = {
        externalId: domain.externalId,
        provider: domain.provider ?? 'mock',
        registrar: domain.registrar ?? 'Mock Registrar',
        status: domain.status,
        expiresAt: domain.expiresAt
          ? new Date(`${domain.expiresAt}T00:00:00.000Z`)
          : null,
        dns: demoDns(domain.name, domain.address),
      };

      await prisma.domain.upsert({
        where: {
          organizationId_name: {
            organizationId: entry.organization.id,
            name: domain.name,
          },
        },
        update: data,
        create: {
          ...data,
          organizationId: entry.organization.id,
          name: domain.name,
        },
      });
    }
  }

  /*
   * Eventos: registros visuais, sem envio para filas.
   */
  for (const entry of organizations) {
    for (const definition of demoEventDefinitions) {
      const domain = entry.demo.domains.find(
        (candidate) => candidate.status === definition.domainStatus,
      );

      if (!domain) {
        throw new Error('Domínio de demonstração não encontrado.');
      }

      const externalId = `${entry.demo.eventPrefix}-event-${definition.number}`;
      const data = {
        type: definition.type,
        status: definition.status,
        receivedAt: new Date(definition.receivedAt),
        processedAt: definition.processedAt
          ? new Date(definition.processedAt)
          : null,
        payload: {
          domain: domain.name,
          previousStatus: definition.previousStatus,
          currentStatus: definition.currentStatus,
          changedRecords: definition.type === 'dns.updated'
            ? demoDns(domain.name, domain.address)
            : [],
          source: 'demo-seed',
          message: definition.message,
        },
      };

      const event = await prisma.event.upsert({
        where: {
          organizationId_externalId: {
            organizationId: entry.organization.id,
            externalId,
          },
        },
        update: data,
        create: {
          ...data,
          organizationId: entry.organization.id,
          externalId,
        },
      });

      entry.eventIds.set(definition.status, event.id);
    }
  }

  /*
   * Webhook endpoints: nenhum request HTTP é disparado.
   * Secrets exclusivamente demo são criptografados apenas na criação.
   */
  for (const entry of organizations) {
    for (const [index, definition] of demoEndpointDefinitions.entries()) {
      const id = demoUuid(entry.demo.uuidPrefix, '1000', index + 1);
      const url = definition.kind === 'legacy'
        ? `https://legacy.example.com/${entry.demo.slug}/webhook`
        : `https://hooks.example.com/${entry.demo.slug}/${definition.kind}`;

      const existing = await prisma.webhookEndpoint.findUnique({
        where: { id },
      });

      const data = {
        organizationId: entry.organization.id,
        name: definition.name,
        url,
        active: definition.active,
      };

      const changed = !existing
        || existing.organizationId !== data.organizationId
        || existing.name !== data.name
        || existing.url !== data.url
        || existing.active !== data.active;

      const endpoint = await prisma.webhookEndpoint.upsert({
        where: { id },
        update: changed ? data : {},
        create: {
          ...data,
          id,
          secret: existing?.secret ?? webhookCryptoService.encryptSecret(
            `${entry.demo.slug}-${definition.kind}-secret`,
          ),
        },
      });

      entry.endpointIds.set(definition.kind, endpoint.id);
    }
  }

  /*
   * Deliveries: eventos e endpoints sempre da mesma organização.
   */
  for (const entry of organizations) {
    for (const definition of demoDeliveryDefinitions) {
      const eventId = entry.eventIds.get(definition.eventStatus);
      const endpointId = entry.endpointIds.get(definition.endpointKind);

      if (!eventId || !endpointId) {
        throw new Error('Relacionamento de webhook demo não encontrado.');
      }

      const data = {
        status: definition.status,
        httpStatus: definition.httpStatus,
        errorMessage: definition.errorMessage,
        attemptedAt: new Date(definition.attemptedAt),
      };

      await prisma.webhookDelivery.upsert({
        where: {
          endpointId_eventId_attempt: {
            endpointId,
            eventId,
            attempt: definition.attempt,
          },
        },
        update: data,
        create: {
          ...data,
          endpointId,
          eventId,
          attempt: definition.attempt,
        },
      });
    }
  }

  /*
   * Conversas e mensagens: IDs fixos, sem apagar histórico manual.
   */
  for (const entry of organizations) {
    for (const [index, definition] of demoConversationDefinitions.entries()) {
      const userId = entry.principalUserIds.get(definition.role);

      if (!userId) {
        throw new Error('Usuário principal demo não encontrado.');
      }

      const id = demoUuid(entry.demo.uuidPrefix, '2000', index + 1);
      const createdAt = new Date(definition.createdAt);
      const data = {
        organizationId: entry.organization.id,
        userId,
        title: definition.title,
        createdAt,
        updatedAt: new Date(createdAt.getTime() + 3 * 60_000),
      };

      const conversation = await prisma.conversation.upsert({
        where: { id },
        update: data,
        create: { ...data, id },
      });

      for (const [messageIndex, content] of definition.messages.entries()) {
        const messageId = demoUuid(
          entry.demo.uuidPrefix,
          '3000',
          index * 4 + messageIndex + 1,
        );

        const message = {
          conversationId: conversation.id,
          role: messageIndex % 2 === 0 ? 'USER' as const : 'ASSISTANT' as const,
          content,
          createdAt: new Date(createdAt.getTime() + messageIndex * 60_000),
        };

        await prisma.message.upsert({
          where: { id: messageId },
          update: message,
          create: { ...message, id: messageId },
        });
      }
    }
  }

  /*
   * Logs finais: credenciais exclusivamente de demonstração.
   */
  console.log('Database seed completed.');
  console.log('Demo organization event keys:');

  for (const demo of demoOrganizations) {
    console.log(`${demo.slug}: ${demo.eventKey}`);
  }
}

main()
  .catch((error: unknown) => {
    console.error('Database seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
