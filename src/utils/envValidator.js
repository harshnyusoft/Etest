const logger = require('./logger');

const requiredEnvVars = [
  'NODE_ENV',
  'PORT',
  'MONGODB_URI',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'JWT_EXPIRE',
  'JWT_REFRESH_EXPIRE',
  'JWT_COOKIE_EXPIRES_IN',
  'BCRYPT_ROUNDS',
  'CLIENT_URL',
  'RATE_LIMIT_WINDOW_MS',
  'RATE_LIMIT_MAX'
];

const optionalEnvVars = [
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
  'REDIS_URL',
  'LOG_LEVEL',
  'SESSION_SECRET',
  'COOKIE_SECRET'
];

const validateEnvironment = () => {
  const missingVars = [];
  const warnings = [];

  // Check required environment variables
  requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  });

  // Check optional environment variables and warn if missing in production
  if (process.env.NODE_ENV === 'production') {
    optionalEnvVars.forEach(varName => {
      if (!process.env[varName]) {
        warnings.push(varName);
      }
    });
  }

  // Log missing required variables
  if (missingVars.length > 0) {
    logger.error(`Missing required environment variables: ${missingVars.join(', ')}`);
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  // Log warnings for missing optional variables in production
  if (warnings.length > 0) {
    logger.warn(`Missing optional environment variables in production: ${warnings.join(', ')}`);
  }

  // Validate specific environment variables
  validateSpecificVars();

  logger.info('Environment variables validation passed');
};

const validateSpecificVars = () => {
  // Validate JWT secrets are not default values in production
  if (process.env.NODE_ENV === 'production') {
    if (process.env.JWT_SECRET === 'your-super-secret-jwt-key-change-this-in-production') {
      throw new Error('JWT_SECRET must be changed in production');
    }
    if (process.env.JWT_REFRESH_SECRET === 'your-refresh-secret-key-change-this-in-production') {
      throw new Error('JWT_REFRESH_SECRET must be changed in production');
    }
  }

  // Validate numeric values
  const port = parseInt(process.env.PORT);
  if (isNaN(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be a valid port number (1-65535)');
  }

  const bcryptRounds = parseInt(process.env.BCRYPT_ROUNDS);
  if (isNaN(bcryptRounds) || bcryptRounds < 10 || bcryptRounds > 14) {
    throw new Error('BCRYPT_ROUNDS must be between 10 and 14');
  }

  const rateLimitMax = parseInt(process.env.RATE_LIMIT_MAX);
  if (isNaN(rateLimitMax) || rateLimitMax < 1) {
    throw new Error('RATE_LIMIT_MAX must be a positive number');
  }

  const rateLimitWindow = parseInt(process.env.RATE_LIMIT_WINDOW_MS);
  if (isNaN(rateLimitWindow) || rateLimitWindow < 60000) {
    throw new Error('RATE_LIMIT_WINDOW_MS must be at least 60000ms (1 minute)');
  }
};

module.exports = { validateEnvironment }; 