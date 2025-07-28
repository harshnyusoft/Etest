const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    // Set mongoose options for better connection handling
    const options = {
      serverSelectionTimeoutMS: 10000, // Increased to 10 seconds
      socketTimeoutMS: 60000, // Increased to 60 seconds
      maxPoolSize: 10, // Connection pool size
      minPoolSize: 2, // Minimum connections in pool
      maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
      retryWrites: true,
      w: 'majority', // Write concern
      readPreference: 'primary'
    };
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, options);

    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });
    
  } catch (error) {
    logger.error('Database connection error:', error);
    // In development, don't exit the process immediately
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    } else {
      logger.warn('Database connection failed, but continuing in development mode');
    }
  }
};

module.exports = connectDB;