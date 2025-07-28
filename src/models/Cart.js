const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  variant: {
    size: {
      type: String,
      required: true
    },
    color: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    }
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1'],
    default: 1
  },
  price: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  items: [cartItemSchema],
  totalItems: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    default: 0
  },
  discountAmount: {
    type: Number,
    default: 0
  },
  appliedCoupon: {
    code: String,
    discount: Number,
    discountType: {
      type: String,
      enum: ['percentage', 'fixed']
    }
  }
}, {
  timestamps: true
});

// Calculate totals before saving
cartSchema.pre('save', function(next) {
  this.totalItems = this.items.reduce((total, item) => total + item.quantity, 0);
  this.totalAmount = this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  
  // Apply coupon discount
  if (this.appliedCoupon && this.appliedCoupon.discount) {
    if (this.appliedCoupon.discountType === 'percentage') {
      this.discountAmount = (this.totalAmount * this.appliedCoupon.discount) / 100;
    } else {
      this.discountAmount = this.appliedCoupon.discount;
    }
    this.discountAmount = Math.min(this.discountAmount, this.totalAmount);
  } else {
    this.discountAmount = 0;
  }
  
  next();
});

// Virtual for final total
cartSchema.virtual('finalTotal').get(function() {
  return this.totalAmount - this.discountAmount;
});

cartSchema.set('toJSON', { virtuals: true });
cartSchema.set('toObject', { virtuals: true });

// Indexes for better performance
cartSchema.index({ 'items.product': 1 });
cartSchema.index({ createdAt: -1 });
cartSchema.index({ updatedAt: -1 });

module.exports = mongoose.model('Cart', cartSchema);