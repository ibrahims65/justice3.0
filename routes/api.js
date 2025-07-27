const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { checkRole } = require('../middleware/auth');

router.get('/police/search', checkRole(['Police']), async (req, res) => {
    const { q } = req.query;

    if (!q) {
        return res.json([]);
    }

    try {
        const cases = await prisma.case.findMany({
            where: {
                OR: [
                    { caseNumber: { contains: q, mode: 'insensitive' } },
                    { booking: { person: { name: { contains: q, mode: 'insensitive' } } } },
                ],
            },
            include: {
                booking: {
                    include: {
                        person: true,
                    },
                },
            },
        });

        const people = await prisma.person.findMany({
            where: {
                name: {
                    contains: q,
                    mode: 'insensitive',
                },
            },
        });

        const results = [
            ...cases.map(c => ({ type: 'Case', id: c.id, name: c.caseNumber, context: c.booking.person.name })),
            ...people.map(p => ({ type: 'Person', id: p.id, name: p.name, context: 'Person' })),
        ];

        res.json(results);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
