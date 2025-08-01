const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const policeController = require('../controllers/policeController');

// Dashboard
router.get('/', ensureAuthenticated, policeController.getPoliceDashboard);

// Management
router.get('/management', ensureAuthenticated, policeController.getManagementData);
router.get('/cases', ensureAuthenticated, policeController.getCaseList);
router.get('/people', ensureAuthenticated, policeController.getPersonList);

const checkStep = (step) => (req, res, next) => {
    if (req.session.caseData && req.session.caseData.step >= step) {
        next();
    } else {
        res.redirect('/police/cases/new/step1');
    }
};

const upload = require('../middleware/upload');

// Case Creation
router.get('/cases/new/step1', ensureAuthenticated, policeController.getNewCaseStep1);
router.post('/cases/new/step1', ensureAuthenticated, upload.single('photo'), policeController.postNewCaseStep1);
router.get('/cases/new/step2', ensureAuthenticated, checkStep(2), policeController.getNewCaseStep2);
router.post('/cases/new/step2', ensureAuthenticated, checkStep(2), policeController.postNewCaseStep2);
router.get('/cases/new/step3', ensureAuthenticated, checkStep(3), policeController.getNewCaseStep3);
router.post('/cases/new/confirm', ensureAuthenticated, checkStep(3), policeController.postNewCaseConfirm);

// Person
router.get('/people/new', ensureAuthenticated, policeController.getNewPerson);
router.post('/people/new', ensureAuthenticated, policeController.postNewPerson);
router.get('/people/:id', ensureAuthenticated, policeController.getPerson);
router.get('/people/:id/print', ensureAuthenticated, policeController.printPersonRecord);

// Booking
router.get('/bookings', ensureAuthenticated, policeController.listBookings); // Added index route
router.get('/bookings/:id', ensureAuthenticated, policeController.getBooking);
router.get('/bookings/:id/edit', ensureAuthenticated, policeController.getEditBooking);
router.post('/bookings/:id/edit', ensureAuthenticated, policeController.postEditBooking);

// Search
router.get('/search', ensureAuthenticated, policeController.search);

// Remand Request
router.get('/remand/new/:bookingId', ensureAuthenticated, policeController.getNewRemandRequest);
router.post('/remand/new/:bookingId', ensureAuthenticated, policeController.postNewRemandRequest);

// Case Detail View
router.get('/cases/:caseId/view', ensureAuthenticated, policeController.getCaseDetail);

// Dynamic module routes
const caseModules = ['evidence', 'investigations', 'victims', 'witnesses', 'hearings', 'warrants', 'charges'];
caseModules.forEach(mod => {
    const controllerName = mod.charAt(0).toUpperCase() + mod.slice(1);
    router.get(
        `/cases/:caseId/${mod}`,
        ensureAuthenticated,
        policeController[`get${controllerName}List`]
    );
    const handler = policeController[`post${controllerName}`];
    if (mod === 'victims' || mod === 'evidence' || mod === 'documents' || mod === 'media') {
        router.post(`/cases/:caseId/${mod}`, ensureAuthenticated, upload.single('photo'), handler);
    } else {
        router.post(`/cases/:caseId/${mod}`, ensureAuthenticated, handler);
    }
});

module.exports = router;
