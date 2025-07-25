const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { checkRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/new', checkRole(['Lawyer']), async (req, res) => {
    const user = await prisma.user.findUnique({
        where: { id: req.session.userId },
        include: { role: true },
    });
    const cases = await prisma.case.findMany();
    res.render('efile/new', { user, cases });
});

router.post('/', checkRole(['Lawyer']), upload.single('document'), async (req, res) => {
    const { caseId } = req.body;
    const { originalname, path } = req.file;
    const userId = req.session.userId;

    try {
        await prisma.efile.create({
            data: {
                name: originalname,
                url: `/${path}`,
                caseId: parseInt(caseId),
                userId: userId,
            },
        });
        res.redirect(`/cases/${caseId}`);
    } catch (error) {
        res.redirect('/efile/new');
    }
});

module.exports = router;
