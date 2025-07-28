const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

exports.getCart = catchAsync(async (req, res, next) => {
  let cart = await Cart.findOne({ user: req.user.id }).populate({
    path: 'items.product',
    select: 'name slug images basePrice baseSalePrice brand status',
  });
  
  if (!cart) {
    cart = await Cart.create({ user: req.user.id, items: [] });
  }
  
  res.status(200).json({
    success: true,
    data: {
      cart,
    },
  });
});

exports.addToCart = catchAsync(async (req, res, next) => {
  const { productId, size, color, quantity = 1 } = req.body;
  
  // Validate product and variant
  const product = await Product.findById(productId);
  if (!product) {
    return next(new AppError('Product not found', 404));
  }
  
  if (product.status !== 'active') {
    return next(new AppError('Product is not available', 400));
  }
  
  // Find the specific variant
  const variant = product.variants.find(v => v.size === size && v.color === color);
  if (!variant) {
    return next(new AppError('Product variant not found', 404));
  }
  
  if (variant.stock < quantity) {
    return next(new AppError('Insufficient stock available', 400));
  }
  
  // Get or create cart
  let cart = await Cart.findOne({ user: req.user.id });
  if (!cart) {
    cart = new Cart({ user: req.user.id, items: [] });
  }
  
  // Check if item already exists in cart
  const existingItemIndex = cart.items.findIndex(
    item =>
      item.product.toString() === productId &&
      item.variant.size === size &&
      item.variant.color === color
  );
  
  if (existingItemIndex > -1) {
    // Update quantity
    const newQuantity = cart.items[existingItemIndex].quantity + quantity;
    
    if (newQuantity > variant.stock) {
      return next(new AppError('Cannot add more items. Insufficient stock.', 400));
    }
    
    cart.items[existingItemIndex].quantity = newQuantity;
  } else {
    // Add new item
    cart.items.push({
      product: productId,
      variant: {
        size,
        color,
        price: variant.salePrice || variant.price,
      },
      quantity,
      price: variant.salePrice || variant.price,
    });
  }
  
  await cart.save();
  
  // Populate and return updated cart
  cart = await cart.populate({
    path: 'items.product',
    select: 'name slug images basePrice baseSalePrice brand status',
  });
  
  res.status(200).json({
    success: true,
    message: 'Item added to cart successfully',
    data: {
      cart,
    },
  });
});

exports.updateCartItem = catchAsync(async (req, res, next) => {
  const { itemId } = req.params;
  const { quantity } = req.body;
  
  if (quantity <= 0) {
    return next(new AppError('Quantity must be greater than 0', 400));
  }
  
  const cart = await Cart.findOne({ user: req.user.id });
  if (!cart) {
    return next(new AppError('Cart not found', 404));
  }
  
  const item = cart.items.id(itemId);
  if (!item) {
    return next(new AppError('Cart item not found', 404));
  }
  
  // Validate stock
  const product = await Product.findById(item.product);
  const variant = product.variants.find(
    v => v.size === item.variant.size && v.color === item.variant.color
  );
  
  if (!variant || variant.stock < quantity) {
    return next(new AppError('Insufficient stock available', 400));
  }
  
  item.quantity = quantity;
  await cart.save();
  
  await cart.populate({
    path: 'items.product',
    select: 'name slug images basePrice baseSalePrice brand status',
  });
  
  res.status(200).json({
    success: true,
    message: 'Cart updated successfully',
    data: {
      cart,
    },
  });
});

exports.removeFromCart = catchAsync(async (req, res, next) => {
  const { itemId } = req.params;
  
  const cart = await Cart.findOne({ user: req.user.id });
  if (!cart) {
    return next(new AppError('Cart not found', 404));
  }
  
  cart.items.pull(itemId);
  await cart.save();
  
  await cart.populate({
    path: 'items.product',
    select: 'name slug images basePrice baseSalePrice brand status',
  });
  
  res.status(200).json({
    success: true,
    message: 'Item removed from cart successfully',
    data: {
      cart,
    },
  });
});

exports.clearCart = catchAsync(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user.id });
  if (!cart) {
    return next(new AppError('Cart not found', 404));
  }
  
  cart.items = [];
  cart.appliedCoupon = undefined;
  await cart.save();
  
  res.status(200).json({
    success: true,
    message: 'Cart cleared successfully',
    data: {
      cart,
    },
  });
});

exports.applyCoupon = catchAsync(async (req, res, next) => {
  const { couponCode } = req.body;
  
  const cart = await Cart.findOne({ user: req.user.id }).populate('items.product');
  if (!cart || cart.items.length === 0) {
    return next(new AppError('Cart is empty', 400));
  }
  
  const coupon = await Coupon.findOne({
    code: couponCode.toUpperCase(),
    isActive: true,
    validFrom: { $lte: new Date() },
    validUntil: { $gte: new Date() },
  });
  
  if (!coupon) {
    return next(new AppError('Invalid or expired coupon code', 400));
  }
  
  // Check usage limit
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    return next(new AppError('Coupon usage limit exceeded', 400));
  }
  
  // Check user usage limit
  if (coupon.usageLimitPerUser) {
    const userUsageCount = coupon.usageHistory.filter(
      usage => usage.user.toString() === req.user.id
    ).length;
    
    if (userUsageCount >= coupon.usageLimitPerUser) {
      return next(new AppError('You have exceeded the usage limit for this coupon', 400));
    }
  }
  
  // Check minimum order amount
  if (coupon.minimumOrderAmount && cart.totalAmount < coupon.minimumOrderAmount) {
    return next(new AppError(`Minimum order amount of $${coupon.minimumOrderAmount} required`, 400));
  }
  
  // Check first time user restriction
  if (coupon.firstTimeUserOnly) {
    // This would require checking if user has any previous orders
    // For now, we'll skip this check
  }
  
  // Apply coupon
  cart.appliedCoupon = {
    code: coupon.code,
    discount: coupon.value,
    discountType: coupon.type,
  };
  
  await cart.save();
  
  res.status(200).json({
    success: true,
    message: 'Coupon applied successfully',
    data: {
      cart,
    },
  });
});

exports.removeCoupon = catchAsync(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user.id });
  if (!cart) {
    return next(new AppError('Cart not found', 404));
  }
  
  cart.appliedCoupon = undefined;
  await cart.save();
  
  await cart.populate({
    path: 'items.product',
    select: 'name slug images basePrice baseSalePrice brand status',
  });
  
  res.status(200).json({
    success: true,
    message: 'Coupon removed successfully',
    data: {
      cart,
    },
  });
});