const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

exports.getLogin = (req, res) => {
    res.render('login', { message: req.flash('error') });
};

exports.postLogin = async (req, res) => {
    const { username, password } = req.body;
    const user = await prisma.user.findUnique({ where: { username } });
    if (user && bcrypt.compareSync(password, user.password)) {
        req.session.userId = user.id;
        res.redirect('/dashboard');
    } else {
        req.flash('error', 'Invalid username or password');
        res.redirect('/login');
    }
};

exports.getLogout = (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
};

exports.getRegister = (req, res) => {
    res.render('register');
};

exports.postRegister = async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);
    await prisma.user.create({
        data: {
            username,
            password: hashedPassword,
            roleId: 2 // default to user role
        }
    });
    res.redirect('/login');
};
