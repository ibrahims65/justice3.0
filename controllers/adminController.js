// --- API Endpoints ---

// Regions
exports.listRegions = async (req, res, next) => {
  try {
    const regions = await prisma.region.findMany();
    res.json(regions);
  } catch (err) {
    next(err);
  }
};

exports.createRegionApi = async (req, res, next) => {
  try {
    const { name } = req.body;
    const region = await prisma.region.create({ data: { name } });
    res.status(201).json(region);
  } catch (err) {
    next(err);
  }
};

// Districts
exports.listDistricts = async (req, res, next) => {
  try {
    const districts = await prisma.district.findMany();
    res.json(districts);
  } catch (err) {
    next(err);
  }
};

exports.createDistrictApi = async (req, res, next) => {
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

// Cities
exports.listCities = async (req, res, next) => {
  try {
    const cities = await prisma.city.findMany();
    res.json(cities);
  } catch (err) {
    next(err);
  }
};

exports.createCityApi = async (req, res, next) => {
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

// Police Stations
exports.listStations = async (req, res, next) => {
  try {
    const stations = await prisma.policeStation.findMany();
    res.json(stations);
  } catch (err) {
    next(err);
  }
};

exports.createStationApi = async (req, res, next) => {
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

// Courts
exports.listCourts = async (req, res, next) => {
  try {
    const courts = await prisma.court.findMany();
    res.json(courts);
  } catch (err) {
    next(err);
  }
};

exports.createCourtApi = async (req, res, next) => {
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
