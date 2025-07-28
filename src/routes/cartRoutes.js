const express = require('express');
const { body } = require('express-validator');
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  applyCoupon,
  removeCoupon,
} = require('../controllers/cartController');
const { protect } = require('../middleware/auth');
const { handleValidationErrors, validateObjectId } = require('../middleware/validation');

const router = express.Router();

// All cart routes require authentication
router.use(protect);

const addToCartValidation = [
  body('productId')
    .isMongoId()
    .withMessage('Invalid product ID'),
  body('size')
    .notEmpty()
    .withMessage('Size is required'),
  body('color')
    .notEmpty()
    .withMessage('Color is required'),
  body('quantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
];

const updateCartValidation = [
  body('quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
];

const applyCouponValidation = [
  body('couponCode')
    .notEmpty()
    .trim()
    .withMessage('Coupon code is required'),
];

router.get('/', getCart);
router.post('/add', addToCartValidation, handleValidationErrors, addToCart);
router.patch('/item/:itemId', validateObjectId('itemId'), updateCartValidation, handleValidationErrors, updateCartItem);
router.delete('/item/:itemId', validateObjectId('itemId'), removeFromCart);
router.delete('/clear', clearCart);
router.post('/apply-coupon', applyCouponValidation, handleValidationErrors, applyCoupon);
router.delete('/remove-coupon', removeCoupon);

module.exports = router;