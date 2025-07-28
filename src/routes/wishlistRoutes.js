const express = require('express');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All wishlist routes require authentication
router.use(protect);

// Wishlist routes will be implemented here
router.get('/', (req, res) => {
  res.json({ message: 'Wishlist endpoint - to be implemented' });
});

module.exports = router;