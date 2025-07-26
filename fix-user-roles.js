const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const prosecutorRole = await prisma.role.findUnique({ where: { name: 'Prosecutor' } });
  const courtRole = await prisma.role.findUnique({ where: { name: 'Court' } });
  const correctionsRole = await prisma.role.findUnique({ where: { name: 'Corrections' } });

  await prisma.user.update({
    where: { username: 'prosecutortestuser' },
    data: { roleId: prosecutorRole.id },
  });

  await prisma.user.update({
    where: { username: 'courttestuser' },
    data: { roleId: courtRole.id },
  });

  await prisma.user.update({
    where: { username: 'correctionstestuser' },
    data: { roleId: correctionsRole.id },
  });

  console.log('User roles updated successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
