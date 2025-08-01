const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// --- View-based Handlers ---

// Dashboard
const getDashboard = async (req, res, next) => {
  try {
    const user = req.session.user;
    if (!user) return res.status(403).send('Forbidden: no user context');
    res.render('admin/dashboard', { user });
  } catch (err) {
    next(err);
  }
};

// Regions
const getRegions = async (req, res, next) => {
  try {
    const regions = await prisma.region.findMany();
    res.render('admin/regions/index', { regions });
  } catch (err) {
    next(err);
  }
};

const getNewRegion = (req, res, next) => {
  try {
    res.render('admin/regions/new');
  } catch (err) {
    next(err);
  }
};

const createRegion = async (req, res, next) => {
  try {
    const { name } = req.body;
    await prisma.region.create({ data: { name } });
    res.redirect('/admin/regions');
  } catch (err) {
    next(err);
  }
};

// Districts
const getDistricts = async (req, res, next) => {
  try {
    const districts = await prisma.district.findMany({ include: { region: true } });
    const regions = await prisma.region.findMany();
    res.render('admin/districts/index', { districts, regions });
  } catch (err) {
    next(err);
  }
};

const getNewDistrict = async (req, res, next) => {
  try {
    const regions = await prisma.region.findMany();
    res.render('admin/districts/new', { regions });
  } catch (err) {
    next(err);
  }
};

const createDistrict = async (req, res, next) => {
  try {
    const { name, regionId } = req.body;
    await prisma.district.create({ data: { name, regionId: parseInt(regionId, 10) } });
    res.redirect('/admin/districts');
  } catch (err) {
    next(err);
  }
};

// Cities
const getCities = async (req, res, next) => {
  try {
    const cities = await prisma.city.findMany({ include: { district: true } });
    const districts = await prisma.district.findMany();
    res.render('admin/cities/index', { cities, districts });
  } catch (err) {
    next(err);
  }
};

const getNewCity = async (req, res, next) => {
  try {
    const districts = await prisma.district.findMany();
    res.render('admin/cities/new', { districts });
  } catch (err) {
    next(err);
  }
};

const createCity = async (req, res, next) => {
  try {
    const { name, districtId } = req.body;
    await prisma.city.create({ data: { name, districtId: parseInt(districtId, 10) } });
    res.redirect('/admin/cities');
  } catch (err) {
    next(err);
  }
};

// Police Stations
const getPoliceStations = async (req, res, next) => {
  try {
    const policeStations = await prisma.policeStation.findMany();
    const cities = await prisma.city.findMany();
    res.render('admin/police-stations/index', { policeStations, cities });
  } catch (err) {
    next(err);
  }
};

const getNewPoliceStation = async (req, res, next) => {
  try {
    const cities = await prisma.city.findMany();
    res.render('admin/police-stations/new', { cities });
  } catch (err) {
    next(err);
  }
};

const createPoliceStation = async (req, res, next) => {
  try {
    const { name, cityId } = req.body;
    await prisma.policeStation.create({ data: { name, cityId: parseInt(cityId, 10) } });
    res.redirect('/admin/police-stations');
  } catch (err) {
    next(err);
  }
};

// Courts
const getCourts = async (req, res, next) => {
  try {
    const courts = await prisma.court.findMany();
    const cities = await prisma.city.findMany();
    res.render('admin/courts/index', { courts, cities });
  } catch (err) {
    next(err);
  }
};

const getNewCourt = async (req, res, next) => {
  try {
    const cities = await prisma.city.findMany();
    res.render('admin/courts/new', { cities });
  } catch (err) {
    next(err);
  }
};

const createCourt = async (req, res, next) => {
  try {
    const { name, cityId } = req.body;
    await prisma.court.create({ data: { name, cityId: parseInt(cityId, 10) } });
    res.redirect('/admin/courts');
  } catch (err) {
    next(err);
  }
};

// --- API Handlers ---

const listRegions = async (req, res, next) => {
  try {
    const regions = await prisma.region.findMany();
    res.json(regions);
  } catch (err) {
    next(err);
  }
};

const createRegionApi = async (req, res, next) => {
  try {
    const { name } = req.body;
    const region = await prisma.region.create({ data: { name } });
    res.status(201).json(region);
  } catch (err) {
    next(err);
  }
};

const listDistricts = async (req, res, next) => {
  try {
    const districts = await prisma.district.findMany();
    res.json(districts);
  } catch (err) {
    next(err);
  }
};

const createDistrictApi = async (req, res, next) => {
  try {
    const { name, regionId } = req.body;
    const district = await prisma.district.create({
      data: { name, regionId: parseInt(regionId, 10) }
    });
    res.status(201).json(district);
  } catch (err) {
    next(err);
  }
};

const listCities = async (req, res, next) => {
  try {
    const cities = await prisma.city.findMany();
    res.json(cities);
  } catch (err) {
    next(err);
  }
};

const createCityApi = async (req, res, next) => {
  try {
    const { name, districtId } = req.body;
    const city = await prisma.city.create({
      data: { name, districtId: parseInt(districtId, 10) }
    });
    res.status(201).json(city);
  } catch (err) {
    next(err);
  }
};

const listStations = async (req, res, next) => {
  try {
    const stations = await prisma.policeStation.findMany();
    res.json(stations);
  } catch (err) {
    next(err);
  }
};

const createStationApi = async (req, res, next) => {
  try {
    const { name, cityId } = req.body;
    const station = await prisma.policeStation.create({
      data: { name, cityId: parseInt(cityId, 10) }
    });
    res.status(201).json(station);
  } catch (err) {
    next(err);
  }
};

const listCourts = async (req, res, next) => {
  try {
    const courts = await prisma.court.findMany();
    res.json(courts);
  } catch (err) {
    next(err);
  }
};

const createCourtApi = async (req, res, next) => {
  try {
    const { name, cityId } = req.body;
    const court = await prisma.court.create({
      data: { name, cityId: parseInt(cityId, 10) }
    });
    res.status(201).json(court);
  } catch (err) {
    next(err);
  }
};

// --- Export Everything ---
module.exports = {
  // View-based
  getDashboard,
  getRegions,
  getNewRegion,
  createRegion,
  getDistricts,
  getNewDistrict,
  createDistrict,
  getCities,
  getNewCity,
  createCity,
  getPoliceStations,
  getNewPoliceStation,
  createPoliceStation,
  getCourts,
  getNewCourt,
  createCourt,

  // API-based
  listRegions,
  createRegionApi,
  listDistricts,
  createDistrictApi,
  listCities,
  createCityApi,
  listStations,
  createStationApi,
  listCourts,
  createCourtApi
};
