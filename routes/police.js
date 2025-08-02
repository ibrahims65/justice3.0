const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authJwt');
const policeController = require('../controllers/policeController');

// Dashboard
router.get('/', verifyToken, policeController.getPoliceDashboard);

// Management
router.get('/management', verifyToken, policeController.getManagementData);
router.get('/cases', verifyToken, policeController.getCaseList);
// router.get('/people', verifyToken, policeController.getPersonList); // Removed as Person model does not exist

const checkStep = (step) => (req, res, next) => {
    if (req.session.caseData && req.session.caseData.step >= step) {
        next();
    } else {
        res.redirect('/police/cases/new/step1');
    }
};

const upload = require('../middleware/upload');

// Case Creation
router.get('/cases/new/step1', verifyToken, policeController.getNewCaseStep1);
router.post('/cases/new/step1', verifyToken, upload.single('photo'), policeController.postNewCaseStep1);
router.get('/cases/new/step2', verifyToken, checkStep(2), policeController.getNewCaseStep2);
router.post('/cases/new/step2', verifyToken, checkStep(2), policeController.postNewCaseStep2);
router.get('/cases/new/step3', verifyToken, checkStep(3), policeController.getNewCaseStep3);
router.post('/cases/new/confirm', verifyToken, checkStep(3), policeController.postNewCaseConfirm);

// Person
router.get('/people/new', verifyToken, policeController.getNewPerson);
router.post('/people/new', verifyToken, policeController.postNewPerson);
router.get('/people/:id', verifyToken, policeController.getPerson);
router.get('/people/:id/print', verifyToken, policeController.printPersonRecord);

// ArrestEvent
router.get('/bookings', verifyToken, policeController.listBookings); // View is named bookings, controller is listBookings
router.get('/arrests/:id', verifyToken, policeController.getArrestEvent);
router.get('/arrests/:id/edit', verifyToken, policeController.getEditArrestEvent);
router.post('/arrests/:id/edit', verifyToken, policeController.postEditArrestEvent);

// Search
router.get('/search', verifyToken, policeController.search);

// Remand Request
router.get('/remand/new/:bookingId', verifyToken, policeController.getNewRemandRequest);
router.post('/remand/new/:bookingId', verifyToken, policeController.postNewRemandRequest);

// Case Detail View
router.get('/cases/:caseId/view', verifyToken, policeController.getCaseDetail);

// Dynamic module routes
const caseModules = ['evidence', 'investigations', 'victims', 'witnesses', 'hearings', 'warrants', 'charges', 'affiliations', 'legalReps'];
caseModules.forEach(mod => {
    const controllerName = mod.charAt(0).toUpperCase() + mod.slice(1);
    router.get(
        `/cases/:caseId/${mod}`,
        verifyToken,
        policeController[`get${controllerName}List`]
    );
    const handler = policeController[`post${controllerName}`];
    if (mod === 'victims' || mod === 'evidence' || mod === 'documents' || mod === 'media') {
        router.post(`/cases/:caseId/${mod}`, verifyToken, upload.single('photo'), handler);
    } else {
        router.post(`/cases/:caseId/${mod}`, verifyToken, handler);
    }
});

module.exports = router;
