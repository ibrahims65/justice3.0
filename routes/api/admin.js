const router = require('express').Router();
const adminCtrl = require('../../controllers/adminController');

// 🛡️ Defensive wrapper to catch missing handlers
const safe = (handlerName) => {
  const fn = adminCtrl[handlerName];
  if (typeof fn !== 'function') {
    console.error(`❌ Missing adminController.${handlerName}`);
    return (req, res) => res.status(500).json({ error: `Handler "${handlerName}" not implemented` });
  }
  return fn;
};

// Regions
router.get('/regions',    safe('listRegions'));
router.post('/regions',   safe('createRegionApi'));

// Districts
router.get('/districts',  safe('listDistricts'));
router.post('/districts', safe('createDistrictApi'));

// Cities
router.get('/cities',     safe('listCities'));
router.post('/cities',    safe('createCityApi'));

// Police Stations
router.get('/stations',   safe('listStations'));
router.post('/stations',  safe('createStationApi'));

// Courts
router.get('/courts',     safe('listCourts'));
router.post('/courts',    safe('createCourtApi'));

module.exports = router;
