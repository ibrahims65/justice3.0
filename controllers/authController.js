const prisma = require('../lib/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.getLoginPage = (req, res) => {
    res.render('auth/login', { title: 'Login' });
};

exports.login = async (req, res) => {
    const { username, password } = req.body;
    const user = await prisma.user.findUnique({
        where: { username },
        include: { role: true }
    });

    if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.status(401).send('Invalid credentials');
    }

    const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role.name },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );

    res.cookie('auth_token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
    res.redirect('/dashboard');
};

exports.logout = (req, res) => {
    res.clearCookie('auth_token');
    res.redirect('/login');
};
