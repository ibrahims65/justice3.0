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

// Case Creation
router.get('/cases/new', isAuthenticated, policeController.getNewCaseStep1);
router.post('/cases/new', isAuthenticated, policeController.postNewCaseStep1);
router.get('/cases/new/step2', isAuthenticated, policeController.getNewCaseStep2);
router.post('/cases/new/step2', isAuthenticated, policeController.postNewCaseStep2);

// Person
router.get('/people/:id', isAuthenticated, policeController.getPerson);

// Booking
router.get('/bookings/:id', isAuthenticated, policeController.getBooking);
router.get('/bookings/:id/edit', isAuthenticated, policeController.getEditBooking);
router.post('/bookings/:id/edit', isAuthenticated, policeController.postEditBooking);

// Search
router.post('/search', isAuthenticated, policeController.search);

module.exports = router;
