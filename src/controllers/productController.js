const Product = require('../models/Product');
const Category = require('../models/Category');
const APIFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

exports.getAllProducts = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(
    Product.find({ status: 'active' }).populate('category subcategory', 'name slug'),
    req.query
  )
    .filter()
    .search()
    .sort()
    .limitFields()
    .paginate();
  
  const result = await features.executePaginated();
  
  res.status(200).json({
    success: true,
    results: result.docs.length,
    pagination: {
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      totalDocs: result.totalDocs,
      hasNextPage: result.hasNextPage,
      hasPrevPage: result.hasPrevPage,
    },
    data: {
      products: result.docs,
    },
  });
});

exports.getProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findOne({
    $or: [{ _id: req.params.id }, { slug: req.params.id }],
  })
    .populate('category subcategory', 'name slug')
    .populate({
      path: 'reviews',
      select: 'rating title comment user createdAt',
      populate: {
        path: 'user',
        select: 'firstName lastName avatar',
      },
    });
  
  if (!product) {
    return next(new AppError('Product not found', 404));
  }
  
  // Increment views
  product.views += 1;
  await product.save({ validateBeforeSave: false });
  
  res.status(200).json({
    success: true,
    data: {
      product,
    },
  });
});

exports.getFeaturedProducts = catchAsync(async (req, res, next) => {
  const products = await Product.find({
    featured: true,
    status: 'active',
  })
    .populate('category', 'name slug')
    .limit(10)
    .sort('-createdAt');
  
  res.status(200).json({
    success: true,
    results: products.length,
    data: {
      products,
    },
  });
});

exports.getProductsByCategory = catchAsync(async (req, res, next) => {
  const { categoryId } = req.params;
  
  // Find category and its subcategories
  const category = await Category.findById(categoryId);
  if (!category) {
    return next(new AppError('Category not found', 404));
  }
  
  const subcategories = await Category.find({ parent: categoryId });
  const categoryIds = [categoryId, ...subcategories.map(sub => sub._id)];
  
  const features = new APIFeatures(
    Product.find({
      $or: [
        { category: { $in: categoryIds } },
        { subcategory: { $in: categoryIds } },
      ],
      status: 'active',
    }).populate('category subcategory', 'name slug'),
    req.query
  )
    .filter()
    .search()
    .sort()
    .limitFields()
    .paginate();
  
  const result = await features.executePaginated();
  
  res.status(200).json({
    success: true,
    results: result.docs.length,
    pagination: {
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      totalDocs: result.totalDocs,
      hasNextPage: result.hasNextPage,
      hasPrevPage: result.hasPrevPage,
    },
    data: {
      products: result.docs,
      category,
    },
  });
});

exports.searchProducts = catchAsync(async (req, res, next) => {
  const { q, category, brand, minPrice, maxPrice, rating } = req.query;
  
  let filter = { status: 'active' };
  
  if (q) {
    filter.$text = { $search: q };
  }
  
  if (category) {
    filter.category = category;
  }
  
  if (brand) {
    filter.brand = new RegExp(brand, 'i');
  }
  
  if (minPrice || maxPrice) {
    filter.basePrice = {};
    if (minPrice) filter.basePrice.$gte = parseFloat(minPrice);
    if (maxPrice) filter.basePrice.$lte = parseFloat(maxPrice);
  }
  
  if (rating) {
    filter.averageRating = { $gte: parseFloat(rating) };
  }
  
  const features = new APIFeatures(
    Product.find(filter).populate('category', 'name slug'),
    req.query
  )
    .sort()
    .limitFields()
    .paginate();
  
  const result = await features.executePaginated();
  
  res.status(200).json({
    success: true,
    results: result.docs.length,
    pagination: {
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      totalDocs: result.totalDocs,
      hasNextPage: result.hasNextPage,
      hasPrevPage: result.hasPrevPage,
    },
    data: {
      products: result.docs,
    },
  });
});

exports.getRelatedProducts = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  
  if (!product) {
    return next(new AppError('Product not found', 404));
  }
  
  const relatedProducts = await Product.find({
    $and: [
      { _id: { $ne: product._id } },
      {
        $or: [
          { category: product.category },
          { brand: product.brand },
          { tags: { $in: product.tags } },
        ],
      },
      { status: 'active' },
    ],
  })
    .populate('category', 'name slug')
    .limit(8)
    .sort('-averageRating');
  
  res.status(200).json({
    success: true,
    results: relatedProducts.length,
    data: {
      products: relatedProducts,
    },
  });
});

exports.getProductStats = catchAsync(async (req, res, next) => {
  const stats = await Product.aggregate([
    {
      $match: { status: 'active' },
    },
    {
      $group: {
        _id: null,
        totalProducts: { $sum: 1 },
        avgPrice: { $avg: '$basePrice' },
        minPrice: { $min: '$basePrice' },
        maxPrice: { $max: '$basePrice' },
        avgRating: { $avg: '$averageRating' },
      },
    },
  ]);
  
  const categoryStats = await Product.aggregate([
    {
      $match: { status: 'active' },
    },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        avgPrice: { $avg: '$basePrice' },
      },
    },
    {
      $lookup: {
        from: 'categories',
        localField: '_id',
        foreignField: '_id',
        as: 'category',
      },
    },
    {
      $unwind: '$category',
    },
    {
      $project: {
        _id: 1,
        name: '$category.name',
        count: 1,
        avgPrice: { $round: ['$avgPrice', 2] },
      },
    },
    {
      $sort: { count: -1 },
    },
  ]);
  
  res.status(200).json({
    success: true,
    data: {
      stats: stats[0],
      categoryStats,
    },
  });
});