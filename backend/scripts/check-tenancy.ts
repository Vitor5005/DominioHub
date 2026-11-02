import { prisma } from '../src/infrastructure/database/prisma.js';

async function main() {
  const organizationA = await prisma.organization.findUnique({
    where: {
      slug: 'dominiohub-demo',
    },
  });

  const organizationB = await prisma.organization.findUnique({
    where: {
      slug: 'agencia-norte',
    },
  });

  if (!organizationA || !organizationB) {
    throw new Error('Organizations not found. Run the seed first.');
  }

  const domainsA = await prisma.domain.findMany({
    where: {
      organizationId: organizationA.id,
    },
  });

  const domainsB = await prisma.domain.findMany({
    where: {
      organizationId: organizationB.id,
    },
  });

  console.log('\nOrganization A');
  console.log(domainsA.map((domain) => domain.name));

  console.log('\nOrganization B');
  console.log(domainsB.map((domain) => domain.name));

  const leakedDomain = await prisma.domain.findFirst({
    where: {
      id: domainsB[0]?.id,
      organizationId: organizationA.id,
    },
  });

  console.log('\nCross-tenant access result:');
  console.log(leakedDomain);

  if (leakedDomain !== null) {
    throw new Error('Tenant isolation failed.');
  }

  console.log('\nTenant isolation check passed.');
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });