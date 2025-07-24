const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { checkRole } = require('../middleware/auth');

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

module.exports = router;
