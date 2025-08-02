// const { PrismaClient } = require('@prisma/client');
// const prisma = new PrismaClient();

// exports.getDashboard = async (req, res) => {
//     const user = req.session.user;
//     res.render('admin/dashboard', { user });
// };

// exports.getRegions = async (req, res) => {
//     const regions = await prisma.region.findMany();
//     res.render('admin/regions/index', { regions });
// };

// exports.getNewRegion = (req, res) => {
//     res.render('admin/regions/new');
// };

// exports.postRegions = async (req, res) => {
//     const { name } = req.body;
//     await prisma.region.create({ data: { name } });
//     res.redirect('/admin/regions');
// };

// exports.getDistricts = async (req, res) => {
//     const districts = await prisma.district.findMany({ include: { region: true } });
//     const regions = await prisma.region.findMany();
//     res.render('admin/districts/index', { districts, regions });
// };

// exports.getNewDistrict = async (req, res) => {
//     const regions = await prisma.region.findMany();
//     res.render('admin/districts/new', { regions });
// };

// exports.postDistricts = async (req, res) => {
//     const { name, regionId } = req.body;
//     await prisma.district.create({ data: { name, regionId: parseInt(regionId, 10) } });
//     res.redirect('/admin/districts');
// };

// exports.getCities = async (req, res) => {
//     const cities = await prisma.city.findMany({ include: { district: true } });
//     const districts = await prisma.district.findMany();
//     res.render('admin/cities/index', { cities, districts });
// };

// exports.getNewCity = async (req, res) => {
//     const districts = await prisma.district.findMany();
//     res.render('admin/cities/new', { districts });
// };

// exports.postCities = async (req, res) => {
//     const { name, districtId } = req.body;
//     await prisma.city.create({ data: { name, districtId: parseInt(districtId, 10) } });
//     res.redirect('/admin/cities');
// };

// exports.getPoliceStations = async (req, res) => {
//     const policeStations = await prisma.policeStation.findMany();
//     const cities = await prisma.city.findMany();
//     res.render('admin/police-stations/index', { policeStations, cities });
// };

// exports.getNewPoliceStation = async (req, res) => {
//     const cities = await prisma.city.findMany();
//     res.render('admin/police-stations/new', { cities });
// };

// exports.postPoliceStations = async (req, res) => {
//     const { name, cityId } = req.body;
//     await prisma.policeStation.create({ data: { name, cityId: parseInt(cityId, 10) } });
//     res.redirect('/admin/police-stations');
// };

// exports.getCourts = async (req, res) => {
//     const courts = await prisma.court.findMany();
//     const cities = await prisma.city.findMany();
//     res.render('admin/courts/index', { courts, cities });
// };

// exports.getNewCourt = async (req, res) => {
//     const cities = await prisma.city.findMany();
//     res.render('admin/courts/new', { cities });
// };

// exports.postCourts = async (req, res) => {
//     const { name, cityId } = req.body;
//     await prisma.court.create({ data: { name, cityId: parseInt(cityId, 10) } });
//     res.redirect('/admin/courts');
// };


// // Refactored API-style handlers
// exports.listRegions = async (req, res) => {
//     const regions = await prisma.region.findMany();
//     res.json(regions);
// };
// exports.createRegion = async (req, res) => {
//     const { name } = req.body;
//     const region = await prisma.region.create({ data: { name } });
//     res.json(region);
// };

// exports.listDistricts = async (req, res) => {
//     const districts = await prisma.district.findMany();
//     res.json(districts);
// };
// exports.createDistrict = async (req, res) => {
//     const { name, regionId } = req.body;
//     const district = await prisma.district.create({
//         data: { name, region: { connect: { id: regionId } } },
//     });
//     res.json(district);
// };

// exports.listCities = async (req, res) => {
//     const cities = await prisma.city.findMany();
//     res.json(cities);
// };
// exports.createCity = async (req, res) => {
//     const { name, districtId } = req.body;
//     const city = await prisma.city.create({
//         data: { name, district: { connect: { id: districtId } } },
//     });
//     res.json(city);
// };

// exports.listStations = async (req, res) => {
//     const stations = await prisma.policeStation.findMany();
//     res.json(stations);
// };
// exports.createStation = async (req, res) => {
//     const { name, cityId } = req.body;
//     const station = await prisma.policeStation.create({
//         data: { name, city: { connect: { id: cityId } } },
//     });
//     res.json(station);
// };

// exports.listCourts = async (req, res) => {
//     const courts = await prisma.court.findMany();
//     res.json(courts);
// };
// exports.createCourt = async (req, res) => {
//     const { name, cityId } = req.body;
//     const court = await prisma.court.create({
//         data: { name, city: { connect: { id: cityId } } },
//     });
//     res.json(court);
// };
