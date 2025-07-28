const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { ensureAdmin } = require('../middleware/auth');

router.use(ensureAdmin);

router.get('/', adminController.getDashboard);

// Regions
router.get('/regions', adminController.getRegions);
router.get('/regions/new', adminController.getNewRegion);
router.post('/regions', adminController.createRegion);

// Districts
router.get('/districts', adminController.getDistricts);
router.get('/districts/new', adminController.getNewDistrict);
router.post('/districts', adminController.createDistrict);

// Cities
router.get('/cities', adminController.getCities);
router.get('/cities/new', adminController.getNewCity);
router.post('/cities', adminController.createCity);

// Police Stations
router.get('/police-stations', adminController.getPoliceStations);
router.get('/police-stations/new', adminController.getNewPoliceStation);
router.post('/police-stations', adminController.createPoliceStation);

// Courts
router.get('/courts', adminController.getCourts);
router.get('/courts/new', adminController.getNewCourt);
router.post('/courts', adminController.createCourt);

module.exports = router;
