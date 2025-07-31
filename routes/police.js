const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const policeController = require('../controllers/policeController');

// Dashboard
router.get('/dashboard', ensureAuthenticated, policeController.getDashboardData);

// Management
router.get('/management', ensureAuthenticated, policeController.getManagementData);
router.get('/cases', ensureAuthenticated, (req, res) => res.redirect('/police/management'));
router.get('/people', ensureAuthenticated, (req, res) => res.redirect('/police/management'));

const checkStep = (step) => (req, res, next) => {
    if (req.session.caseData && req.session.caseData.step >= step) {
        next();
    } else {
        res.redirect('/police/cases/new/step1');
    }
};

// Case Creation
router.get('/cases/new/step1', ensureAuthenticated, policeController.getNewCaseStep1);
router.post('/cases/new/step1', ensureAuthenticated, policeController.postNewCaseStep1);
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
router.get('/bookings/:id', ensureAuthenticated, policeController.getBooking);
router.get('/bookings/:id/edit', ensureAuthenticated, policeController.getEditBooking);
router.post('/bookings/:id/edit', ensureAuthenticated, policeController.postEditBooking);

// Search
router.get('/search', ensureAuthenticated, policeController.search);

module.exports = router;
