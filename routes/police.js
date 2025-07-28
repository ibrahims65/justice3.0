const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const policeController = require('../controllers/policeController');

// Dashboard
router.get('/dashboard', isAuthenticated, policeController.getDashboardData);

// Management
router.get('/management', isAuthenticated, policeController.getManagementData);
router.get('/cases', isAuthenticated, (req, res) => res.redirect('/police/management'));
router.get('/people', isAuthenticated, (req, res) => res.redirect('/police/management'));

const checkStep = (step) => (req, res, next) => {
    if (req.session.caseData && req.session.caseData.step >= step) {
        next();
    } else {
        res.redirect('/police/cases/new/step1');
    }
};

// Case Creation
router.get('/cases/new/step1', isAuthenticated, policeController.getNewCaseStep1);
router.post('/cases/new/step1', isAuthenticated, policeController.postNewCaseStep1);
router.get('/cases/new/step2', isAuthenticated, checkStep(2), policeController.getNewCaseStep2);
router.post('/cases/new/step2', isAuthenticated, checkStep(2), policeController.postNewCaseStep2);
router.get('/cases/new/step3', isAuthenticated, checkStep(3), policeController.getNewCaseStep3);
router.post('/cases/new/confirm', isAuthenticated, checkStep(3), policeController.postNewCaseConfirm);

// Person
router.get('/people/new', isAuthenticated, policeController.getNewPerson);
router.post('/people/new', isAuthenticated, policeController.postNewPerson);
router.get('/people/:id', isAuthenticated, policeController.getPerson);
router.get('/people/:id/print', isAuthenticated, policeController.printPersonRecord);

// Booking
router.get('/bookings/:id', isAuthenticated, policeController.getBooking);
router.get('/bookings/:id/edit', isAuthenticated, policeController.getEditBooking);
router.post('/bookings/:id/edit', isAuthenticated, policeController.postEditBooking);

// Search
router.get('/search', isAuthenticated, policeController.search);

module.exports = router;
