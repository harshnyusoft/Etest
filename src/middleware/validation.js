const { validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const extractedErrors = [];
    errors.array().map(err => extractedErrors.push({ [err.param]: err.msg }));
    
    return next(new AppError('Validation failed', 400, extractedErrors));
  }
  
  next();
};

exports.validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return next(new AppError(`Invalid ${paramName}`, 400));
    }
    
    next();
  };
};

// File upload validation
exports.validateFileUpload = (req, res, next) => {
  if (!req.file && !req.files) {
    return next(new AppError('No file uploaded', 400));
  }
  
  // Check file size (5MB limit)
  const maxSize = 5 * 1024 * 1024; // 5MB
  const files = req.files || [req.file];
  
  for (const file of files) {
    if (file.size > maxSize) {
      return next(new AppError('File too large. Maximum size is 5MB', 400));
    }
    
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      return next(new AppError('Invalid file type. Only JPEG, PNG, and WebP are allowed', 400));
    }
  }
  
  next();
};

// Address validation
exports.validateAddress = (req, res, next) => {
  const { firstName, lastName, address, city, state, zipCode, country } = req.body;
  
  if (!firstName || !lastName || !address || !city || !state || !zipCode || !country) {
    return next(new AppError('All address fields are required', 400));
  }
  
  // Validate zip code format (basic validation)
  const zipCodeRegex = /^\d{5}(-\d{4})?$/;
  if (!zipCodeRegex.test(zipCode)) {
    return next(new AppError('Invalid zip code format', 400));
  }
  
  // Validate phone number if provided
  if (req.body.phone) {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    if (!phoneRegex.test(req.body.phone)) {
      return next(new AppError('Invalid phone number format', 400));
    }
  }
  
  next();
};

// SKU validation
exports.validateSKU = (req, res, next) => {
  const { sku } = req.body;
  
  if (!sku) {
    return next(new AppError('SKU is required', 400));
  }
  
  // SKU format validation (alphanumeric, 3-20 characters)
  const skuRegex = /^[A-Z0-9]{3,20}$/;
  if (!skuRegex.test(sku)) {
    return next(new AppError('SKU must be 3-20 characters long and contain only uppercase letters and numbers', 400));
  }
  
  next();
};

// Price validation
exports.validatePrice = (req, res, next) => {
  const { price, salePrice } = req.body;
  
  if (price !== undefined) {
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice < 0) {
      return next(new AppError('Price must be a positive number', 400));
    }
  }
  
  if (salePrice !== undefined) {
    const numSalePrice = parseFloat(salePrice);
    if (isNaN(numSalePrice) || numSalePrice < 0) {
      return next(new AppError('Sale price must be a positive number', 400));
    }
    
    if (price && numSalePrice >= parseFloat(price)) {
      return next(new AppError('Sale price must be less than regular price', 400));
    }
  }
  
  next();
};

// Pagination validation
exports.validatePagination = (req, res, next) => {
  const { page, limit } = req.query;
  
  if (page !== undefined) {
    const numPage = parseInt(page);
    if (isNaN(numPage) || numPage < 1) {
      return next(new AppError('Page must be a positive number', 400));
    }
  }
  
  if (limit !== undefined) {
    const numLimit = parseInt(limit);
    if (isNaN(numLimit) || numLimit < 1 || numLimit > 100) {
      return next(new AppError('Limit must be between 1 and 100', 400));
    }
  }
  
  next();
};