const express = require('express');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All order routes require authentication
router.use(protect);

// Order routes will be implemented here
router.get('/', (req, res) => {
  res.json({ message: 'Orders endpoint - to be implemented' });
});

module.exports = router;