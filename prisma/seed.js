const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Create permissions
  await prisma.permission.createMany({
    data: [
      { name: 'create:person' },
      { name: 'view:person' },
      { name: 'edit:person' },
      { name: 'delete:person' },
      { name: 'create:booking' },
      { name: 'view:booking' },
      { name: 'edit:booking' },
      { name: 'delete:booking' },
      { name: 'create:case' },
      { name: 'view:case' },
      { name: 'edit:case' },
      { name: 'delete:case' },
      { name: 'create:hearing' },
      { name: 'view:hearing' },
      { name: 'edit:hearing' },
      { name: 'delete:hearing' },
      { name: 'create:report' },
      { name: 'view:report' },
    ],
    skipDuplicates: true,
  });

  // Create roles
  const policeRole = await prisma.role.upsert({
    where: { name: 'Police' },
    update: {},
    create: {
      name: 'Police',
      permissions: {
        connect: [
          { name: 'create:person' },
          { name: 'view:person' },
          { name: 'edit:person' },
          { name: 'create:booking' },
          { name: 'view:booking' },
          { name: 'edit:booking' },
          { name: 'create:case' },
          { name: 'view:case' },
          { name: 'edit:case' },
        ],
      },
    },
  });

  const prosecutorRole = await prisma.role.upsert({
    where: { name: 'Prosecutor' },
    update: {},
    create: {
      name: 'Prosecutor',
      permissions: {
        connect: [
          { name: 'view:person' },
          { name: 'view:booking' },
          { name: 'view:case' },
          { name: 'edit:case' },
        ],
      },
    },
  });

  const courtRole = await prisma.role.upsert({
    where: { name: 'Court' },
    update: {},
    create: {
      name: 'Court',
      permissions: {
        connect: [
          { name: 'view:case' },
          { name: 'create:hearing' },
          { name: 'view:hearing' },
          { name: 'edit:hearing' },
        ],
      },
    },
  });

  const correctionsRole = await prisma.role.upsert({
    where: { name: 'Corrections' },
    update: {},
    create: {
      name: 'Corrections',
      permissions: {
        connect: [
          { name: 'view:person' },
          { name: 'view:booking' },
          { name: 'edit:booking' },
          { name: 'create:report' },
          { name: 'view:report' },
        ],
      },
    },
  });

  const adminRole = await prisma.role.upsert({
    where: { name: 'Admin' },
    update: {},
    create: {
      name: 'Admin',
      permissions: {
        connect: [
          { name: 'create:person' },
          { name: 'view:person' },
          { name: 'edit:person' },
          { name: 'delete:person' },
          { name: 'create:booking' },
          { name: 'view:booking' },
          { name: 'edit:booking' },
          { name: 'delete:booking' },
          { name: 'create:case' },
          { name: 'view:case' },
          { name: 'edit:case' },
          { name: 'delete:case' },
          { name: 'create:hearing' },
          { name: 'view:hearing' },
          { name: 'edit:hearing' },
          { name: 'delete:hearing' },
          { name: 'create:report' },
          { name: 'view:report' },
        ],
      },
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
