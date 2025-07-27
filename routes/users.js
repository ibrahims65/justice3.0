const express = require('express');
const router = express.Router();

// 🧪 Basic test route
router.get('/', (req, res) => {
  res.send('Users route is alive');
});

module.exports = router;
