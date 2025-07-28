const express = require('express');
const { protect, isAdmin } = require('../middleware/auth');

const router = express.Router();

// Public routes (for applying coupons)
router.get('/validate/:code', (req, res) => {
  res.json({ message: 'Coupon validation endpoint - to be implemented' });
});

// Admin routes
router.use(protect, isAdmin);
router.get('/', (req, res) => {
  res.json({ message: 'Admin coupons endpoint - to be implemented' });
});

module.exports = router;