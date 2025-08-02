require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const prisma = require('./lib/prisma');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// View Engine
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layouts/main');

// Static Files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
// const authRoutes = require('./routes/auth');
// app.use('/', authRoutes);

app.get('/', (req, res) => {
    res.render('index', { title: 'Justice 4.0' });
});


app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
