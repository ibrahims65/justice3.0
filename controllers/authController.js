const prisma = require('../lib/prisma');
const bcrypt = require('bcryptjs');

exports.getLogin = (req, res) => {
    res.render('login', { message: req.flash('error') });
};

exports.postLogin = async (req, res) => {
    const { username, password } = req.body;
    const user = await prisma.user.findUnique({
        where: { username },
        include: { role: true }
    });

    if (user && bcrypt.compareSync(password, user.password)) {
        // store a minimal user object so we can read .id and .username everywhere
        req.session.user = {
            id: user.id,
            username: user.username
        };
        return res.redirect('/dashboard');
    } else {
        req.flash('error', 'Invalid username or password');
        return res.redirect('/login');
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
