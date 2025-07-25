const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function hasPermission(permission) {
  return async (req, res, next) => {
    if (!req.session.userId) {
      return res.redirect('/auth/login');
    }

    const user = await prisma.user.findUnique({
      where: { id: req.session.userId },
      include: {
        role: {
          include: {
            permissions: true,
          },
        },
      },
    });

    if (user && user.role.permissions.some(p => p.name === permission)) {
      next();
    } else {
      res.status(403).send('Forbidden');
    }
  };
}

module.exports = {
  hasPermission,
};
