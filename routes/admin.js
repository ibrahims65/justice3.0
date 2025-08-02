const express = require('express');
const router  = express.Router();
const { verifyToken, checkRole } = require('../middleware/authJwt');
const adminController = require('../controllers/adminController');

// 🛡️ Defensive wrapper to catch missing handlers
const safe = (handlerName) => {
  const fn = adminController[handlerName];
  if (typeof fn !== 'function') {
    console.error(`❌ Missing adminController.${handlerName}`);
    return (req, res) => res.status(500).send(`Handler "${handlerName}" not implemented`);
  }
  return fn;
};

// Dashboard
router.get('/', verifyToken, checkRole('Admin'), safe('getDashboard'));

// Regions
router.get('/regions', safe('getRegions'));
router.get('/regions/new', safe('getNewRegion'));
router.post('/regions', safe('createRegion'));

// Districts
router.get('/districts', safe('getDistricts'));
router.get('/districts/new', safe('getNewDistrict'));
router.post('/districts', safe('createDistrict'));

// Cities
router.get('/cities', safe('getCities'));
router.get('/cities/new', safe('getNewCity'));
router.post('/cities', safe('createCity'));

// Police Stations
router.get('/police-stations', safe('getPoliceStations'));
router.get('/police-stations/new', safe('getNewPoliceStation'));
router.post('/police-stations', safe('createPoliceStation'));

// Courts
router.get('/courts', safe('getCourts'));
router.get('/courts/new', safe('getNewCourt'));
router.post('/courts', safe('createCourt'));

module.exports = router;
