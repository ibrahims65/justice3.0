const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function main() {
    const hashedPassword = bcrypt.hashSync('password', 10);

    // The schema does not have Role or User models, commenting out for now
    // await prisma.role.createMany({
    //     data: [
    //         { name: 'Admin' },
    //         { name: 'Police' },
    //         { name: 'Prosecutor' },
    //         { name: 'Court' },
    //         { name: 'Corrections' }
    //     ]
    // });
    // await prisma.user.create({
    //     data: {
    //         username: 'admin',
    //         password: hashedPassword,
    //         roleId: 1
    //     }
    // });
    // await prisma.user.create({
    //     data: {
    //         username: 'police',
    //         password: hashedPassword,
    //         roleId: 2
    //     }
    // });

    // The schema does not have Region, District, City, PoliceStation, or Court models
    // Commenting out for now
    // // Seed Regions
    // const region1 = await prisma.region.create({ data: { name: 'North' } });
    // const region2 = await prisma.region.create({ data: { name: 'South' } });

    // // Seed Districts
    // const district1 = await prisma.district.create({ data: { name: 'Northland', regionId: region1.id } });
    // const district2 = await prisma.district.create({ data: { name: 'Southland', regionId: region2.id } });

    // // Seed Cities
    // const city1 = await prisma.city.create({ data: { name: 'Northville', districtId: district1.id } });
    // const city2 = await prisma.city.create({ data: { name: 'Southville', districtId: district2.id } });

    // // Seed Police Stations
    // await prisma.policeStation.create({ data: { name: 'Northville PD', cityId: city1.id } });
    // await prisma.policeStation.create({ data: { name: 'Southville PD', cityId: city2.id } });

    // // Seed Courts
    // await prisma.court.create({ data: { name: 'Northville Court', cityId: city1.id } });
    // await prisma.court.create({ data: { name: 'Southville Court', cityId: city2.id } });

    // Seed Police Data
    console.log('Seeding police data...');
    await prisma.case.create({
        data: {
            title: 'The Great Donut Heist',
            description: 'A daring daylight robbery of a local donut shop.',
            status: 'Open',
            arrests: {
                create: {
                    officerId: 1, // Assuming a user with ID 1 exists and is a police officer
                    arrestedAt: new Date(),
                    location: 'Downtown Donut Shop',
                    arrestType: 'On-site',
                    notes: 'Suspect was covered in sprinkles.'
                }
            },
            evidences: {
                create: {
                    type: 'Witness Testimony',
                    description: 'A witness saw the suspect fleeing the scene.',
                    collectedAt: new Date(),
                    fileUpload: 'witness_statement.txt',
                    chainOfCustodyStatus: 'Collected',
                    storageLocation: 'Evidence Locker A-1'
                }
            }
        }
    });

    await prisma.case.create({
        data: {
            title: 'The Case of the Missing Garden Gnome',
            description: 'A beloved garden gnome has been abducted.',
            status: 'Open',
            arrests: {
                create: {
                    officerId: 1,
                    arrestedAt: new Date(),
                    location: 'Suburban Garden',
                    arrestType: 'Warrant',
                    notes: 'Gnome was found in a pawn shop.'
                }
            }
        }
    });
    console.log('Police data seeded.');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
