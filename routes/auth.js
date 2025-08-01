// routes/auth.js
const express        = require('express');
const router         = express.Router();
const authController = require('../controllers/authController');

// Show login form
router.get('/login', authController.getLogin);

// Handle login submission
router.post('/login', authController.postLogin);

// Logout (destroys session)
router.get('/logout', authController.getLogout);

module.exports = router;
