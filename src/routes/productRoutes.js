const express = require('express');
const {
  getAllProducts,
  getProduct,
  getFeaturedProducts,
  getProductsByCategory,
  searchProducts,
  getRelatedProducts,
  getProductStats,
} = require('../controllers/productController');
const { optionalAuth } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/validation');

const router = express.Router();

router.get('/', optionalAuth, getAllProducts);
router.get('/featured', getFeaturedProducts);
router.get('/search', searchProducts);
router.get('/stats', getProductStats);
router.get('/category/:categoryId', validateObjectId('categoryId'), getProductsByCategory);
router.get('/:id', validateObjectId('id'), getProduct);
router.get('/:id/related', validateObjectId('id'), getRelatedProducts);

module.exports = router;