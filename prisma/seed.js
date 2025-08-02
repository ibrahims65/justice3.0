const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding ...');

  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create Roles
  const adminRole = await prisma.role.create({ data: { name: 'Admin' } });
  const policeRole = await prisma.role.create({ data: { name: 'Police' } });
  const prosecutorRole = await prisma.role.create({ data: { name: 'Prosecutor' } });
  const courtRole = await prisma.role.create({ data: { name: 'Court' } });
  const correctionsRole = await prisma.role.create({ data: { name: 'Corrections' } });

  console.log('Roles created.');

  // Create Users
  await prisma.user.create({
    data: {
      username: 'admin',
      password: hashedPassword,
      roleId: adminRole.id,
    },
  });

  await prisma.user.create({
    data: {
      username: 'police_officer_1',
      password: hashedPassword,
      roleId: policeRole.id,
    },
  });

  console.log('Users created.');

  // Create Geographic Data
  const northRegion = await prisma.region.create({ data: { name: 'North' } });
  const northlandDistrict = await prisma.district.create({ data: { name: 'Northland', regionId: northRegion.id } });
  const northvilleCity = await prisma.city.create({ data: { name: 'Northville', districtId: northlandDistrict.id } });
  await prisma.policeStation.create({ data: { name: 'Northville PD', cityId: northvilleCity.id } });
  await prisma.court.create({ data: { name: 'Northville High Court', cityId: northvilleCity.id } });

  console.log('Geographic data created.');

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
