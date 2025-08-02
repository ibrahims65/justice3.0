exports.getDashboard = (req, res) => {
    res.render('dashboard', {
        title: 'Dashboard',
        user: req.user
    });
};
