const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getDashboard = async (req, res, next) => {
  try {
    const user = req.user || req.session.user;
    if (!user) {
      return res.status(403).send('Forbidden: no user context');
    }
    res.render('admin/dashboard', { user });
  } catch (err) {
    next(err);
  }
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

// --- API Functions ---

// List Regions
exports.listRegions = async (req, res, next) => {
  try {
    const regions = await prisma.region.findMany();
    res.json(regions);
  } catch (e) {
    next(e);
  }
};

// Create Region (API)
exports.createRegionApi = async (req, res, next) => {
  try {
    const { name } = req.body;
    const newRegion = await prisma.region.create({ data: { name } });
    res.status(201).json(newRegion);
  } catch (e) {
    next(e);
  }
};

// List Districts
exports.listDistricts = async (req, res, next) => {
  try {
    const districts = await prisma.district.findMany();
    res.json(districts);
  } catch (e) {
    next(e);
  }
};

// Create District (API)
exports.createDistrictApi = async (req, res, next) => {
  try {
    const { name, regionId } = req.body;
    const newDistrict = await prisma.district.create({ data: { name, regionId: parseInt(regionId) } });
    res.status(201).json(newDistrict);
  } catch (e) {
    next(e);
  }
};

// List Cities
exports.listCities = async (req, res, next) => {
  try {
    const cities = await prisma.city.findMany();
    res.json(cities);
  } catch (e) {
    next(e);
  }
};

// Create City (API)
exports.createCityApi = async (req, res, next) => {
  try {
    const { name, districtId } = req.body;
    const newCity = await prisma.city.create({ data: { name, districtId: parseInt(districtId) } });
    res.status(201).json(newCity);
  } catch (e) {
    next(e);
  }
};

// List Police Stations
exports.listStations = async (req, res, next) => {
  try {
    const stations = await prisma.policeStation.findMany();
    res.json(stations);
  } catch (e) {
    next(e);
  }
};

// Create Police Station (API)
exports.createStationApi = async (req, res, next) => {
  try {
    const { name, cityId } = req.body;
    const newStation = await prisma.policeStation.create({ data: { name, cityId: parseInt(cityId) } });
    res.status(201).json(newStation);
  } catch (e) {
    next(e);
  }
};

// List Courts
exports.listCourts = async (req, res, next) => {
  try {
    const courts = await prisma.court.findMany();
    res.json(courts);
  } catch (e) {
    next(e);
  }
};

// Create Court (API)
exports.createCourtApi = async (req, res, next) => {
  try {
    const { name, cityId } = req.body;
    const newCourt = await prisma.court.create({ data: { name, cityId: parseInt(cityId) } });
    res.status(201).json(newCourt);
  } catch (e) {
    next(e);
  }
};
