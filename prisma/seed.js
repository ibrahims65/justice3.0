const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function main() {
    const hashedPassword = bcrypt.hashSync('password', 10);
    await prisma.role.createMany({
        data: [
            { name: 'Admin' },
            { name: 'Police' },
            { name: 'Prosecutor' },
            { name: 'Court' },
            { name: 'Corrections' }
        ]
    });
    await prisma.user.create({
        data: {
            username: 'admin',
            password: hashedPassword,
            roleId: 1
        }
    });
    await prisma.user.create({
        data: {
            username: 'police',
            password: hashedPassword,
            roleId: 2
        }
    });

    // Seed Regions
    const region1 = await prisma.region.create({ data: { name: 'North' } });
    const region2 = await prisma.region.create({ data: { name: 'South' } });

    // Seed Districts
    const district1 = await prisma.district.create({ data: { name: 'Northland', regionId: region1.id } });
    const district2 = await prisma.district.create({ data: { name: 'Southland', regionId: region2.id } });

    // Seed Cities
    const city1 = await prisma.city.create({ data: { name: 'Northville', districtId: district1.id } });
    const city2 = await prisma.city.create({ data: { name: 'Southville', districtId: district2.id } });

    // Seed Police Stations
    await prisma.policeStation.create({ data: { name: 'Northville PD', cityId: city1.id } });
    await prisma.policeStation.create({ data: { name: 'Southville PD', cityId: city2.id } });

    // Seed Courts
    await prisma.court.create({ data: { name: 'Northville Court', cityId: city1.id } });
    await prisma.court.create({ data: { name: 'Southville Court', cityId: city2.id } });
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
