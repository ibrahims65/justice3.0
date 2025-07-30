const express = require('express');
const router  = express.Router();
const { ensureAuthenticated, ensureAdmin } = require('../middleware/auth');
const { getDashboard, getRegions, getNewRegion, createRegion, getDistricts, getNewDistrict, createDistrict, getCities, getNewCity, createCity, getPoliceStations, getNewPoliceStation, createPoliceStation, getCourts, getNewCourt, createCourt } = require('../controllers/adminController');

// Register the handler without invoking it
router.get('/', ensureAuthenticated, ensureAdmin, getDashboard);

// Regions
router.get('/regions', getRegions);
router.get('/regions/new', getNewRegion);
router.post('/regions', createRegion);

// Districts
router.get('/districts', getDistricts);
router.get('/districts/new', getNewDistrict);
router.post('/districts', createDistrict);

// Cities
router.get('/cities', getCities);
router.get('/cities/new', getNewCity);
router.post('/cities', createCity);

// Police Stations
router.get('/police-stations', getPoliceStations);
router.get('/police-stations/new', getNewPoliceStation);
router.post('/police-stations', createPoliceStation);

// Courts
router.get('/courts', getCourts);
router.get('/courts/new', getNewCourt);
router.post('/courts', createCourt);

module.exports = router;
