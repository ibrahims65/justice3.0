const prisma = require('../lib/prisma');

module.exports = {
    ensureAuthenticated: function(req, res, next) {
        if (req.session.userId) {
            return next();
        }
        res.redirect('/auth/login');
    },
    ensureAdmin: async function(req, res, next) {
        if (req.session.userId) {
            const user = await prisma.user.findUnique({ where: { id: req.session.userId }, include: { role: true } });
            if (user && user.role.name === 'Admin') {
                return next();
            }
        }
        res.redirect('/login');
    },
    checkRole: function(roles) {
        return async (req, res, next) => {
            if (req.session.userId) {
                const user = await prisma.user.findUnique({ where: { id: req.session.userId }, include: { role: true } });
                if (user && roles.includes(user.role.name)) {
                    return next();
                }
            }
            res.status(403).send('Forbidden');
        };
    }
};
