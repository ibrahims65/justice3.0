const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { verifyToken, checkRole } = require('../middleware/auth');

router.get('/dashboard', verifyToken, async (req, res) => {
    const user = req.user;
    if (user.role === 'Police') {
        res.redirect('/police/dashboard');
    } else if (user.role === 'Admin') {
        // Redirect to a future admin dashboard
        res.render('dashboard', { title: 'Admin Dashboard', user });
    } else {
        res.render('dashboard', { title: 'Dashboard', user });
    }
});

module.exports = router;
