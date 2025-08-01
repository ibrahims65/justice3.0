const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getDashboardMetrics(userId) {
    const totalCases = await prisma.case.count({
        where: { arrests: { some: { officerId: userId } } },
    });

    const openCases = await prisma.case.count({
        where: {
            status: 'Open',
            arrests: { some: { officerId: userId } },
        },
    });

    const activeRemands = await prisma.bailRemand.count({
        where: {
            case: {
                arrests: { some: { officerId: userId } },
            },
            remandEndDate: null,
        },
    });

    const pendingEvidence = await prisma.evidence.count({
        where: {
            case: {
                arrests: { some: { officerId: userId } },
            },
            chainOfCustodyStatus: 'Pending',
        },
    });

    return {
        totalCases,
        openCases,
        activeRemands,
        pendingEvidence,
    };
}

module.exports = {
    getDashboardMetrics,
};
