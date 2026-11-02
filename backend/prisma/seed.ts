import { createHash } from 'node:crypto';

import * as argon2 from 'argon2';

import { prisma } from '../src/infrastructure/database/prisma.js';

function hashEventIngestKey(
  key: string,
): string {
  return createHash('sha256')
    .update(key)
    .digest('hex');
}

async function main() {
  /*
   * Credenciais de demonstração para recebimento
   * de eventos externos.
   *
   * Somente os hashes são persistidos no banco.
   */
  const organizationAEventKey =
    'dh-demo-events-K7m2Q9x4R8v1P6t3N5z0';

  const organizationBEventKey =
    'dh-norte-events-T4p8X1q7M9r3V6k2Z5n0';

  /*
   * Organizações
   */
  const organizationA =
    await prisma.organization.upsert({
      where: {
        slug: 'dominiohub-demo',
      },

      update: {
        name: 'DomínioHub Demo',

        eventIngestKeyHash:
          hashEventIngestKey(
            organizationAEventKey,
          ),
      },

      create: {
        name: 'DomínioHub Demo',
        slug: 'dominiohub-demo',

        eventIngestKeyHash:
          hashEventIngestKey(
            organizationAEventKey,
          ),
      },
    });

  const organizationB =
    await prisma.organization.upsert({
      where: {
        slug: 'agencia-norte',
      },

      update: {
        name: 'Agência Norte',

        eventIngestKeyHash:
          hashEventIngestKey(
            organizationBEventKey,
          ),
      },

      create: {
        name: 'Agência Norte',
        slug: 'agencia-norte',

        eventIngestKeyHash:
          hashEventIngestKey(
            organizationBEventKey,
          ),
      },
    });

  /*
   * Domínios — DomínioHub Demo
   */
  await prisma.domain.upsert({
    where: {
      organizationId_name: {
        organizationId:
          organizationA.id,

        name:
          'agencia-demo.com.br',
      },
    },

    update: {
      externalId:
        'mock-domain-001',

      provider:
        'mock-namecheap',

      registrar:
        'Namecheap Mock',

      status:
        'ACTIVE',

      expiresAt:
        new Date(
          '2027-10-01T00:00:00.000Z',
        ),

      dns: [
        {
          type: 'A',
          host: '@',
          value: '192.0.2.10',
          ttl: 1800,
        },

        {
          type: 'MX',
          host: '@',
          value:
            'mail.agencia-demo.com.br',
          ttl: 1800,
        },
      ],
    },

    create: {
      organizationId:
        organizationA.id,

      externalId:
        'mock-domain-001',

      name:
        'agencia-demo.com.br',

      provider:
        'mock-namecheap',

      registrar:
        'Namecheap Mock',

      status:
        'ACTIVE',

      expiresAt:
        new Date(
          '2027-10-01T00:00:00.000Z',
        ),

      dns: [
        {
          type: 'A',
          host: '@',
          value: '192.0.2.10',
          ttl: 1800,
        },

        {
          type: 'MX',
          host: '@',
          value:
            'mail.agencia-demo.com.br',
          ttl: 1800,
        },
      ],
    },
  });

  await prisma.domain.upsert({
    where: {
      organizationId_name: {
        organizationId:
          organizationA.id,

        name:
          'cliente-demo.com.br',
      },
    },

    update: {
      externalId:
        'mock-domain-002',

      provider:
        'mock-namecheap',

      registrar:
        'Namecheap Mock',

      status:
        'EXPIRING',

      expiresAt:
        new Date(
          '2026-12-10T00:00:00.000Z',
        ),

      dns: [
        {
          type: 'A',
          host: '@',
          value: '198.51.100.10',
          ttl: 1800,
        },

        {
          type: 'CNAME',
          host: 'www',
          value:
            'cliente-demo.com.br',
          ttl: 1800,
        },
      ],
    },

    create: {
      organizationId:
        organizationA.id,

      externalId:
        'mock-domain-002',

      name:
        'cliente-demo.com.br',

      provider:
        'mock-namecheap',

      registrar:
        'Namecheap Mock',

      status:
        'EXPIRING',

      expiresAt:
        new Date(
          '2026-12-10T00:00:00.000Z',
        ),

      dns: [
        {
          type: 'A',
          host: '@',
          value: '198.51.100.10',
          ttl: 1800,
        },

        {
          type: 'CNAME',
          host: 'www',
          value:
            'cliente-demo.com.br',
          ttl: 1800,
        },
      ],
    },
  });

  /*
   * Domínio — Agência Norte
   */
  await prisma.domain.upsert({
    where: {
      organizationId_name: {
        organizationId:
          organizationB.id,

        name:
          'empresa-acre.com.br',
      },
    },

    update: {
      provider:
        'mock',

      registrar:
        'Mock Registrar',

      status:
        'ACTIVE',

      expiresAt:
        new Date(
          '2027-08-20T00:00:00.000Z',
        ),

      dns: {
        A: [
          '198.51.100.20',
        ],
      },
    },

    create: {
      organizationId:
        organizationB.id,

      name:
        'empresa-acre.com.br',

      provider:
        'mock',

      registrar:
        'Mock Registrar',

      status:
        'ACTIVE',

      expiresAt:
        new Date(
          '2027-08-20T00:00:00.000Z',
        ),

      dns: {
        A: [
          '198.51.100.20',
        ],
      },
    },
  });

  /*
   * Senha compartilhada apenas pelos
   * usuários de demonstração.
   *
   * Senha:
   * DominioHubDemo123!
   */
  const demoPasswordHash =
    await argon2.hash(
      'DominioHubDemo123!',
    );

  /*
   * Usuários — DomínioHub Demo
   */
  await prisma.user.upsert({
    where: {
      email:
        'admin@dominiohub.com',
    },

    update: {
      organizationId:
        organizationA.id,

      name:
        'Administrador Demo',

      passwordHash:
        demoPasswordHash,

      role:
        'ADMIN',

      active:
        true,
    },

    create: {
      organizationId:
        organizationA.id,

      name:
        'Administrador Demo',

      email:
        'admin@dominiohub.com',

      passwordHash:
        demoPasswordHash,

      role:
        'ADMIN',

      active:
        true,
    },
  });

  await prisma.user.upsert({
    where: {
      email:
        'operator@dominiohub.com',
    },

    update: {
      organizationId:
        organizationA.id,

      name:
        'Operador Demo',

      passwordHash:
        demoPasswordHash,

      role:
        'OPERATOR',

      active:
        true,
    },

    create: {
      organizationId:
        organizationA.id,

      name:
        'Operador Demo',

      email:
        'operator@dominiohub.com',

      passwordHash:
        demoPasswordHash,

      role:
        'OPERATOR',

      active:
        true,
    },
  });

  await prisma.user.upsert({
    where: {
      email:
        'support@dominiohub.com',
    },

    update: {
      organizationId:
        organizationA.id,

      name:
        'Suporte Demo',

      passwordHash:
        demoPasswordHash,

      role:
        'SUPPORT',

      active:
        true,
    },

    create: {
      organizationId:
        organizationA.id,

      name:
        'Suporte Demo',

      email:
        'support@dominiohub.com',

      passwordHash:
        demoPasswordHash,

      role:
        'SUPPORT',

      active:
        true,
    },
  });

  /*
   * Usuário — Agência Norte
   */
  await prisma.user.upsert({
    where: {
      email:
        'admin@agencianorte.com',
    },

    update: {
      organizationId:
        organizationB.id,

      name:
        'Administrador Agência Norte',

      passwordHash:
        demoPasswordHash,

      role:
        'ADMIN',

      active:
        true,
    },

    create: {
      organizationId:
        organizationB.id,

      name:
        'Administrador Agência Norte',

      email:
        'admin@agencianorte.com',

      passwordHash:
        demoPasswordHash,

      role:
        'ADMIN',

      active:
        true,
    },
  });

  console.log(
    'Database seed completed.',
  );

  console.log(
    'Demo organization event keys:',
  );

  console.log(
    `dominiohub-demo: ${organizationAEventKey}`,
  );

  console.log(
    `agencia-norte: ${organizationBEventKey}`,
  );
}

main()
  .catch((error: unknown) => {
    console.error(
      'Database seed failed:',
      error,
    );

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });