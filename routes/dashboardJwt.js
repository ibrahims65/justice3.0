const express = require('express');
const verifyToken = require('../middleware/authJwt');
const router = express.Router();

router.get('/dashboard-jwt', verifyToken, (req, res) => {
  res.send(`Hello ${req.user.cn}, you’re in via JWT!`);
});

module.exports = router;
