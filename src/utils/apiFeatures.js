class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields', 'search'];
    excludedFields.forEach(el => delete queryObj[el]);

    // Sanitize and validate query parameters
    const sanitizedQuery = this.sanitizeQuery(queryObj);
    
    // Advanced filtering with proper escaping
    let queryStr = JSON.stringify(sanitizedQuery);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

    try {
      const parsedQuery = JSON.parse(queryStr);
      this.query = this.query.find(parsedQuery);
    } catch (error) {
      // If parsing fails, return empty result
      this.query = this.query.find({ _id: null });
    }
    
    return this;
  }

  sanitizeQuery(queryObj) {
    const sanitized = {};
    const allowedFields = [
      'name', 'brand', 'category', 'status', 'featured', 
      'price', 'averageRating', 'createdAt', 'updatedAt'
    ];
    
    for (const [key, value] of Object.entries(queryObj)) {
      // Only allow specific fields to prevent injection
      if (allowedFields.includes(key)) {
        // Sanitize string values
        if (typeof value === 'string') {
          sanitized[key] = value.replace(/[<>]/g, '');
        } else {
          sanitized[key] = value;
        }
      }
    }
    
    return sanitized;
  }

  search() {
    if (this.queryString.search) {
      const searchRegex = new RegExp(this.queryString.search, 'i');
      this.query = this.query.find({
        $or: [
          { name: searchRegex },
          { description: searchRegex },
          { brand: searchRegex }
        ]
      });
    }
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  paginate() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 10;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);
    return this;
  }

  async execute() {
    return await this.query;
  }

  async executePaginated() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 10;
    
    const totalDocs = await this.query.model.countDocuments(this.query.getQuery());
    const totalPages = Math.ceil(totalDocs / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    const docs = await this.query;
    
    return {
      docs,
      totalDocs,
      limit,
      totalPages,
      page,
      pagingCounter: (page - 1) * limit + 1,
      hasPrevPage,
      hasNextPage,
      prevPage: hasPrevPage ? page - 1 : null,
      nextPage: hasNextPage ? page + 1 : null
    };
  }
}

module.exports = APIFeatures;