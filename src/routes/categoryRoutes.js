const express = require('express');

const router = express.Router();

// Category routes will be implemented here
router.get('/', (req, res) => {
  res.json({ message: 'Categories endpoint - to be implemented' });
});

module.exports = router;