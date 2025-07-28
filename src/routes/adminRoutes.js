const express = require('express');
const { protect, isAdmin } = require('../middleware/auth');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(protect, isAdmin);

// Admin dashboard routes will be implemented here
router.get('/dashboard', (req, res) => {
  res.json({ message: 'Admin dashboard endpoint - to be implemented' });
});

module.exports = router;