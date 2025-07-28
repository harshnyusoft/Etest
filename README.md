# E-commerce Fashion Backend API

A complete, production-ready E-commerce Fashion Backend API built with Node.js, Express.js, and MongoDB. This API provides all the essential features needed for a modern fashion e-commerce platform.

## 🚀 Features

### Core Features
- **Authentication & Authorization**: JWT-based auth with role-based access control
- **User Management**: Registration, login, profile management, address book
- **Product Management**: Complete CRUD with variants, filtering, search, and reviews
- **Category Management**: Nested categories with full hierarchy support
- **Shopping Cart**: Add/update/remove items with variant support
- **Checkout System**: Complete checkout flow with coupon code application
- **Order Management**: Order tracking with status updates
- **Coupon System**: Flexible discount coupons with usage limits
- **Wishlist**: Save favorite products for later
- **Review System**: Product reviews and ratings

### Technical Features
- **Scalable Architecture**: Modular design following clean code principles
- **Security**: Rate limiting, helmet, CORS, data sanitization
- **Performance**: Database indexing, pagination, caching headers
- **Validation**: Comprehensive input validation with express-validator
- **Error Handling**: Centralized error handling with detailed logging
- **API Documentation**: RESTful design with consistent response format

## 🛠️ Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Express-validator, Joi
- **Security**: Helmet, CORS, Rate Limiting, MongoDB Sanitization
- **File Upload**: Multer with Cloudinary integration
- **Logging**: Winston
- **Development**: Nodemon for hot reloading

## 📁 Project Structure

```
src/
├── config/             # Environment & database configuration
├── controllers/        # Route handlers and business logic
├── middleware/         # Custom middleware (auth, validation, error handling)
├── models/            # Mongoose schemas and models
├── routes/            # API routes organized by feature
├── services/          # Business logic services
├── utils/             # Helper functions and utilities
├── validators/        # Input validation schemas
├── logs/              # Application logs
├── app.js             # Express app configuration
└── server.js          # Application entry point
```

## 🚦 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- Cloudinary account (for image uploads)

### Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   Update the `.env` file with your configuration:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/ecommerce-fashion
   JWT_SECRET=your-super-secret-jwt-key
   JWT_REFRESH_SECRET=your-refresh-secret-key
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

The API will start on `http://localhost:5000`

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/admin/login` - Admin login
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh-token` - Refresh JWT token
- `GET /api/auth/me` - Get current user profile
- `PATCH /api/auth/update-profile` - Update user profile
- `PATCH /api/auth/change-password` - Change password

### Products
- `GET /api/products` - Get all products with filtering & pagination
- `GET /api/products/:id` - Get single product
- `GET /api/products/featured` - Get featured products
- `GET /api/products/category/:categoryId` - Get products by category
- `GET /api/products/search` - Search products
- `GET /api/products/:id/related` - Get related products

### Shopping Cart
- `GET /api/cart` - Get user cart
- `POST /api/cart/add` - Add item to cart
- `PATCH /api/cart/item/:itemId` - Update cart item quantity
- `DELETE /api/cart/item/:itemId` - Remove item from cart
- `DELETE /api/cart/clear` - Clear entire cart
- `POST /api/cart/apply-coupon` - Apply coupon code
- `DELETE /api/cart/remove-coupon` - Remove applied coupon

## 🔒 Security Features

- **JWT Authentication** with refresh tokens
- **Rate Limiting** to prevent abuse
- **Input Validation** and sanitization
- **CORS** configuration
- **Helmet** for security headers
- **MongoDB Injection** protection
- **Password Hashing** with bcrypt

## 📊 Data Models

### User
- Personal information (name, email, phone)
- Authentication data (password, tokens)
- Role-based permissions
- Address book management
- Activity tracking

### Product
- Basic information (name, description, brand)
- Variants (size, color, price, stock)
- Categories and subcategories
- Images and specifications
- Reviews and ratings
- SEO metadata

### Order
- Order tracking with unique order numbers
- Item details with variant information
- Shipping and billing addresses
- Status history and tracking
- Coupon application

### Cart
- User-specific cart items
- Variant selection
- Quantity management
- Coupon application
- Automatic total calculation

## 🚀 Deployment Ready

This API is production-ready with:
- Environment-based configuration
- Comprehensive error handling
- Security best practices
- Performance optimizations
- Structured logging
- Health check endpoints

## 📝 API Response Format

All API responses follow a consistent format:

```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Success message",
  "pagination": {
    // Pagination info for list endpoints
  }
}
```

Error responses:
```json
{
  "success": false,
  "message": "Error message",
  "errors": [
    // Detailed error information
  ]
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.