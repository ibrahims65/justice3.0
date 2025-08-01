const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Start reseeding ...');

    // Clear existing data
    await prisma.policeStation.deleteMany({});
    await prisma.court.deleteMany({});
    await prisma.city.deleteMany({});
    await prisma.district.deleteMany({});
    await prisma.region.deleteMany({});
    console.log('Cleared existing core data.');

    // Create Regions
    const region1 = await prisma.region.create({ data: { name: 'Banaadir' } });
    const region2 = await prisma.region.create({ data: { name: 'Woqooyi Galbeed' } });
    console.log('Created regions.');

    // Create Districts
    const district1 = await prisma.district.create({ data: { name: 'Hodan', regionId: region1.id } });
    const district2 = await prisma.district.create({ data: { name: 'Hamar Weyne', regionId: region1.id } });
    const district3 = await prisma.district.create({ data: { name: 'Hargeisa', regionId: region2.id } });
    console.log('Created districts.');

    // Create Cities
    const city1 = await prisma.city.create({ data: { name: 'Mogadishu', districtId: district1.id } });
    const city2 = await prisma.city.create({ data: { name: 'Mogadishu', districtId: district2.id } });
    const city3 = await prisma.city.create({ data: { name: 'Hargeisa', districtId: district3.id } });
    console.log('Created cities.');

    // Create Police Stations
    await prisma.policeStation.create({ data: { name: 'Hodan Police Station', cityId: city1.id } });
    await prisma.policeStation.create({ data: { name: 'Hamar Weyne Police Station', cityId: city2.id } });
    await prisma.policeStation.create({ data: { name: 'Hargeisa Central Police Station', cityId: city3.id } });
    console.log('Created police stations.');

    // Create Courts
    await prisma.court.create({ data: { name: 'Banaadir Regional Court', cityId: city1.id } });
    await prisma.court.create({ data: { name: 'Hargeisa District Court', cityId: city3.id } });
    console.log('Created courts.');

    console.log('Reseeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
