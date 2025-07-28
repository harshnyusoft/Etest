const express = require('express');
const { protect, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/product/:productId', (req, res) => {
  res.json({ message: 'Product reviews endpoint - to be implemented' });
});

// Protected routes
router.use(protect);
router.post('/', (req, res) => {
  res.json({ message: 'Create review endpoint - to be implemented' });
});

module.exports = router;