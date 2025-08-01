const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getDashboardMetrics(userId) {
    const totalCases = await prisma.case.count({
        where: { booking: { arrestingOfficerId: userId } },
    });

    const openCases = await prisma.case.count({
        where: {
            status: 'Open',
            booking: { arrestingOfficerId: userId },
        },
    });

    const activeRemands = await prisma.remandRequest.count({
        where: {
            status: 'approved',
            booking: { arrestingOfficerId: userId },
        },
    });

    const pendingEvidence = await prisma.evidence.count({
        where: {
            case: {
                booking: { arrestingOfficerId: userId },
            },
            storageLocation: null, // Example criteria for pending
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
