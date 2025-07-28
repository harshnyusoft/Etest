const Product = require('../models/Product');
const Category = require('../models/Category');
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/AppError');

class ProductService {
  async getAllProducts(queryParams) {
    const features = new APIFeatures(
      Product.find({ status: 'active' }).populate('category subcategory', 'name slug'),
      queryParams
    )
      .filter()
      .search()
      .sort()
      .limitFields()
      .paginate();
    
    return await features.executePaginated();
  }

  async getProductById(id) {
    const product = await Product.findOne({
      $or: [{ _id: id }, { slug: id }],
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
      throw new AppError('Product not found', 404);
    }

    // Increment views
    product.views += 1;
    await product.save({ validateBeforeSave: false });

    return product;
  }

  async getFeaturedProducts() {
    return await Product.find({
      featured: true,
      status: 'active',
    })
      .populate('category', 'name slug')
      .limit(10)
      .sort('-createdAt');
  }

  async getProductsByCategory(categoryId) {
    const category = await Category.findById(categoryId);
    if (!category) {
      throw new AppError('Category not found', 404);
    }

    const subcategories = await Category.find({ parent: categoryId });
    const categoryIds = [categoryId, ...subcategories.map(sub => sub._id)];

    const features = new APIFeatures(
      Product.find({
        $or: [
          { category: { $in: categoryIds } },
          { subcategory: { $in: categoryIds } }
        ],
        status: 'active'
      }).populate('category subcategory', 'name slug'),
      {}
    )
      .sort()
      .paginate();

    return await features.executePaginated();
  }

  async searchProducts(searchTerm, queryParams) {
    const features = new APIFeatures(
      Product.find({
        $or: [
          { name: { $regex: searchTerm, $options: 'i' } },
          { description: { $regex: searchTerm, $options: 'i' } },
          { brand: { $regex: searchTerm, $options: 'i' } }
        ],
        status: 'active'
      }).populate('category subcategory', 'name slug'),
      queryParams
    )
      .sort()
      .limitFields()
      .paginate();

    return await features.executePaginated();
  }

  async getRelatedProducts(productId, limit = 4) {
    const product = await Product.findById(productId);
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    return await Product.find({
      _id: { $ne: productId },
      category: product.category,
      status: 'active'
    })
      .populate('category', 'name slug')
      .limit(limit)
      .sort('-averageRating');
  }

  async createProduct(productData) {
    return await Product.create(productData);
  }

  async updateProduct(id, updateData) {
    const product = await Product.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    return product;
  }

  async deleteProduct(id) {
    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    return product;
  }

  async updateProductStock(productId, variantId, quantity) {
    const product = await Product.findById(productId);
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    const variant = product.variants.id(variantId);
    if (!variant) {
      throw new AppError('Product variant not found', 404);
    }

    if (variant.stock < quantity) {
      throw new AppError('Insufficient stock', 400);
    }

    variant.stock -= quantity;
    await product.save();

    return product;
  }

  async getProductStats() {
    const stats = await Product.aggregate([
      {
        $match: { status: 'active' }
      },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          avgPrice: { $avg: '$basePrice' },
          minPrice: { $min: '$basePrice' },
          maxPrice: { $max: '$basePrice' },
          totalViews: { $sum: '$views' },
          totalSold: { $sum: '$sold' }
        }
      }
    ]);

    return stats[0] || {
      totalProducts: 0,
      avgPrice: 0,
      minPrice: 0,
      maxPrice: 0,
      totalViews: 0,
      totalSold: 0
    };
  }

  async getTopProducts(limit = 10) {
    return await Product.find({ status: 'active' })
      .sort('-sold')
      .limit(limit)
      .populate('category', 'name slug');
  }

  async getMostViewedProducts(limit = 10) {
    return await Product.find({ status: 'active' })
      .sort('-views')
      .limit(limit)
      .populate('category', 'name slug');
  }
}

module.exports = new ProductService(); 