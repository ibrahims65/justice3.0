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
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
