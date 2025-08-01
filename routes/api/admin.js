const router = require('express').Router();
const adminCtrl = require('../../controllers/adminController');

// Regions
router.get('/regions',    adminCtrl.listRegions);
router.post('/regions',   adminCtrl.createRegionApi);

// Districts
router.get('/districts',  adminCtrl.listDistricts);
router.post('/districts', adminCtrl.createDistrictApi);

// Cities
router.get('/cities',     adminCtrl.listCities);
router.post('/cities',    adminCtrl.createCityApi);

// Police Stations
router.get('/stations',   adminCtrl.listStations);
router.post('/stations',  adminCtrl.createStationApi);

// Courts
router.get('/courts',     adminCtrl.listCourts);
router.post('/courts',    adminCtrl.createCourtApi);

module.exports = router;
