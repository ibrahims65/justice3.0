const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Dashboard
exports.getDashboard = async (req, res, next) => {
  try {
    const user = req.session.user;
    if (!user) return res.status(403).send('Forbidden: no user context');
    res.render('admin/dashboard', { user });
  } catch (err) {
    next(err);
  }
};

// Regions
exports.getRegions = async (req, res, next) => {
  try {
    const regions = await prisma.region.findMany();
    res.render('admin/regions/index', { regions });
  } catch (err) {
    next(err);
  }
};

exports.getNewRegion = (req, res, next) => {
  try {
    res.render('admin/regions/new');
  } catch (err) {
    next(err);
  }
};

exports.createRegion = async (req, res, next) => {
  try {
    const { name } = req.body;
    await prisma.region.create({ data: { name } });
    res.redirect('/admin/regions');
  } catch (err) {
    next(err);
  }
};

// Districts
exports.getDistricts = async (req, res, next) => {
  try {
    const districts = await prisma.district.findMany({ include: { region: true } });
    const regions = await prisma.region.findMany();
    res.render('admin/districts/index', { districts, regions });
  } catch (err) {
    next(err);
  }
};

exports.getNewDistrict = async (req, res, next) => {
  try {
    const regions = await prisma.region.findMany();
    res.render('admin/districts/new', { regions });
  } catch (err) {
    next(err);
  }
};

exports.createDistrict = async (req, res, next) => {
  try {
    const { name, regionId } = req.body;
    await prisma.district.create({ data: { name, regionId: parseInt(regionId, 10) } });
    res.redirect('/admin/districts');
  } catch (err) {
    next(err);
  }
};

// Cities
exports.getCities = async (req, res, next) => {
  try {
    const cities = await prisma.city.findMany({ include: { district: true } });
    const districts = await prisma.district.findMany();
    res.render('admin/cities/index', { cities, districts });
  } catch (err) {
    next(err);
  }
};

exports.getNewCity = async (req, res, next) => {
  try {
    const districts = await prisma.district.findMany();
    res.render('admin/cities/new', { districts });
  } catch (err) {
    next(err);
  }
};

exports.createCity = async (req, res, next) => {
  try {
    const { name, districtId } = req.body;
    await prisma.city.create({ data: { name, districtId: parseInt(districtId, 10) } });
    res.redirect('/admin/cities');
  } catch (err) {
    next(err);
  }
};

// Police Stations
exports.getPoliceStations = async (req, res, next) => {
  try {
    const policeStations = await prisma.policeStation.findMany();
    const cities = await prisma.city.findMany();
    res.render('admin/police-stations/index', { policeStations, cities });
  } catch (err) {
    next(err);
  }
};

exports.getNewPoliceStation = async (req, res, next) => {
  try {
    const cities = await prisma.city.findMany();
    res.render('admin/police-stations/new', { cities });
  } catch (err) {
    next(err);
  }
};

exports.createPoliceStation = async (req, res, next) => {
  try {
    const { name, cityId } = req.body;
    await prisma.policeStation.create({ data: { name, cityId: parseInt(cityId, 10) } });
    res.redirect('/admin/police-stations');
  } catch (err) {
    next(err);
  }
};

// Courts
exports.getCourts = async (req, res, next) => {
  try {
    const courts = await prisma.court.findMany();
    const cities = await prisma.city.findMany();
    res.render('admin/courts/index', { courts, cities });
  } catch (err) {
    next(err);
  }
};

exports.getNewCourt = async (req, res, next) => {
  try {
    const cities = await prisma.city.findMany();
    res.render('admin/courts/new', { cities });
  } catch (err) {
    next(err);
  }
};

exports.createCourt = async (req, res, next) => {
  try {
    const { name, cityId } = req.body;
    await prisma.court.create({ data: { name, cityId: parseInt(cityId, 10) } });
    res.redirect('/admin/courts');
  } catch (err) {
    next(err);
  }
};
