const prisma = require('../lib/prisma');

exports.getDashboard = async (req, res) => {
    const user = req.user;
    if (user.role === 'Police') {
        res.redirect('/police/dashboard');
    } else if (user.role === 'Admin') {
        res.render('admin/dashboard', { title: 'Admin Dashboard', user });
    } else {
        res.render('dashboard', { title: 'Dashboard', user });
    }
};
