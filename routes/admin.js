const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { checkRole } = require('../middleware/auth');
const bcrypt = require('bcrypt');

router.use(checkRole(['SuperAdmin']));

router.get('/', (req, res) => {
  res.render('admin/index');
});

// Regions
router.get('/regions', async (req, res) => {
  const regions = await prisma.region.findMany();
  res.render('admin/regions/index', { regions });
});

router.get('/regions/new', (req, res) => {
  res.render('admin/regions/new');
});

router.post('/regions', async (req, res) => {
  const { name } = req.body;
  await prisma.region.create({ data: { name } });
  res.redirect('/admin/regions');
});

// Districts
router.get('/districts', async (req, res) => {
  const districts = await prisma.district.findMany({ include: { region: true } });
  const regions = await prisma.region.findMany();
  res.render('admin/districts/index', { districts, regions });
});

router.get('/districts/new', async (req, res) => {
  const regions = await prisma.region.findMany();
  res.render('admin/districts/new', { regions });
});

router.post('/districts', async (req, res) => {
  const { name, regionId } = req.body;
  await prisma.district.create({ data: { name, regionId: parseInt(regionId) } });
  res.redirect('/admin/districts');
});

// Cities
router.get('/cities', async (req, res) => {
  const cities = await prisma.city.findMany({ include: { district: true } });
  const districts = await prisma.district.findMany();
  res.render('admin/cities/index', { cities, districts });
});

router.get('/cities/new', async (req, res) => {
  const districts = await prisma.district.findMany();
  res.render('admin/cities/new', { districts });
});

router.post('/cities', async (req, res) => {
  const { name, districtId } = req.body;
  await prisma.city.create({ data: { name, districtId: parseInt(districtId) } });
  res.redirect('/admin/cities');
});

// Police Stations
router.get('/police-stations', async (req, res) => {
  const policeStations = await prisma.policeStation.findMany();
  const cities = await prisma.city.findMany();
  res.render('admin/police-stations/index', { policeStations, cities });
});

router.get('/police-stations/new', async (req, res) => {
  const cities = await prisma.city.findMany();
  res.render('admin/police-stations/new', { cities });
});

router.post('/police-stations', async (req, res) => {
  const { name, cityId } = req.body;
  await prisma.policeStation.create({ data: { name, cityId: parseInt(cityId) } });
  res.redirect('/admin/police-stations');
});

// Courts
router.get('/courts', async (req, res) => {
  const courts = await prisma.court.findMany();
  const cities = await prisma.city.findMany();
  res.render('admin/courts/index', { courts, cities });
});

router.get('/courts/new', async (req, res) => {
  const cities = await prisma.city.findMany();
  res.render('admin/courts/new', { cities });
});

router.post('/courts', async (req, res) => {
  const { name, cityId } = req.body;
  await prisma.court.create({ data: { name, cityId: parseInt(cityId) } });
  res.redirect('/admin/courts');
});

// Users
router.get('/users', async (req, res) => {
    const users = await prisma.user.findMany({ include: { role: true } });
    res.render('admin/users/index', { users, user: req.user });
});

router.get('/users/new', async (req, res) => {
    const roles = await prisma.role.findMany();
    res.render('admin/users/new', { roles, user: req.user });
});

router.post('/users', async (req, res) => {
    const { username, password, roleId } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.create({
        data: {
            username,
            password: hashedPassword,
            roleId: parseInt(roleId),
        },
    });
    res.redirect('/admin/users');
});

router.get('/users/:id/edit', async (req, res) => {
    const editedUser = await prisma.user.findUnique({ where: { id: parseInt(req.params.id) } });
    const roles = await prisma.role.findMany();
    res.render('admin/users/edit', { editedUser, roles, user: req.user });
});

router.post('/users/:id', async (req, res) => {
    const { username, password, roleId } = req.body;
    const data = {
        username,
        roleId: parseInt(roleId),
    };
    if (password) {
        data.password = await bcrypt.hash(password, 10);
    }
    await prisma.user.update({
        where: { id: parseInt(req.params.id) },
        data,
    });
    res.redirect('/admin/users');
});

router.post('/users/:id/delete', async (req, res) => {
    await prisma.user.delete({ where: { id: parseInt(req.params.id) } });
    res.redirect('/admin/users');
});

// Courtrooms
router.get('/courtrooms', async (req, res) => {
    const courtrooms = await prisma.courtroom.findMany({ include: { court: true } });
    res.render('admin/courtrooms/index', { courtrooms, user: req.user });
});

router.get('/courtrooms/new', async (req, res) => {
    const courts = await prisma.court.findMany();
    res.render('admin/courtrooms/new', { courts, user: req.user });
});

router.post('/courtrooms', async (req, res) => {
    const { name, courtId } = req.body;
    await prisma.courtroom.create({
        data: {
            name,
            courtId: parseInt(courtId),
        },
    });
    res.redirect('/admin/courtrooms');
});

// Hearing Types
router.get('/hearing-types', async (req, res) => {
    const hearingTypes = await prisma.hearingType.findMany();
    res.render('admin/hearing-types/index', { hearingTypes, user: req.user });
});

router.get('/hearing-types/new', (req, res) => {
    res.render('admin/hearing-types/new', { user: req.user });
});

router.post('/hearing-types', async (req, res) => {
    const { name } = req.body;
    await prisma.hearingType.create({
        data: {
            name,
        },
    });
    res.redirect('/admin/hearing-types');
});

module.exports = router;
