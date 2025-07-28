const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getDashboard = (req, res) => {
  res.render('admin/dashboard');
};

// Regions
exports.getRegions = async (req, res) => {
  const regions = await prisma.region.findMany();
  res.render('admin/regions/index', { regions });
};

exports.getNewRegion = (req, res) => {
  res.render('admin/regions/new');
};

exports.createRegion = async (req, res) => {
  const { name } = req.body;
  await prisma.region.create({ data: { name } });
  res.redirect('/admin/regions');
};

// Districts
exports.getDistricts = async (req, res) => {
  const districts = await prisma.district.findMany({ include: { region: true } });
  const regions = await prisma.region.findMany();
  res.render('admin/districts/index', { districts, regions });
};

exports.getNewDistrict = async (req, res) => {
  const regions = await prisma.region.findMany();
  res.render('admin/districts/new', { regions });
};

exports.createDistrict = async (req, res) => {
  const { name, regionId } = req.body;
  await prisma.district.create({ data: { name, regionId: parseInt(regionId) } });
  res.redirect('/admin/districts');
};

// Cities
exports.getCities = async (req, res) => {
  const cities = await prisma.city.findMany({ include: { district: true } });
  const districts = await prisma.district.findMany();
  res.render('admin/cities/index', { cities, districts });
};

exports.getNewCity = async (req, res) => {
  const districts = await prisma.district.findMany();
  res.render('admin/cities/new', { districts });
};

exports.createCity = async (req, res) => {
  const { name, districtId } = req.body;
  await prisma.city.create({ data: { name, districtId: parseInt(districtId) } });
  res.redirect('/admin/cities');
};

// Police Stations
exports.getPoliceStations = async (req, res) => {
  const policeStations = await prisma.policeStation.findMany();
  const cities = await prisma.city.findMany();
  res.render('admin/police-stations/index', { policeStations, cities });
};

exports.getNewPoliceStation = async (req, res) => {
  const cities = await prisma.city.findMany();
  res.render('admin/police-stations/new', { cities });
};

exports.createPoliceStation = async (req, res) => {
  const { name, cityId } = req.body;
  await prisma.policeStation.create({ data: { name, cityId: parseInt(cityId) } });
  res.redirect('/admin/police-stations');
};

// Courts
exports.getCourts = async (req, res) => {
  const courts = await prisma.court.findMany();
  const cities = await prisma.city.findMany();
  res.render('admin/courts/index', { courts, cities });
};

exports.getNewCourt = async (req, res) => {
  const cities = await prisma.city.findMany();
  res.render('admin/courts/new', { cities });
};

exports.createCourt = async (req, res) => {
  const { name, cityId } = req.body;
  await prisma.court.create({ data: { name, cityId: parseInt(cityId) } });
  res.redirect('/admin/courts');
};
