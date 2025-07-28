const logger = require('./logger');

class Cache {
  constructor() {
    this.cache = new Map();
    this.ttl = new Map(); // Time to live for each key
  }

  set(key, value, ttlSeconds = 300) { // Default 5 minutes
    const expiry = Date.now() + (ttlSeconds * 1000);
    this.cache.set(key, value);
    this.ttl.set(key, expiry);
    
    logger.debug(`Cache set: ${key}, TTL: ${ttlSeconds}s`);
  }

  get(key) {
    if (!this.cache.has(key)) {
      return null;
    }

    const expiry = this.ttl.get(key);
    if (Date.now() > expiry) {
      this.delete(key);
      return null;
    }

    logger.debug(`Cache hit: ${key}`);
    return this.cache.get(key);
  }

  delete(key) {
    this.cache.delete(key);
    this.ttl.delete(key);
    logger.debug(`Cache deleted: ${key}`);
  }

  clear() {
    this.cache.clear();
    this.ttl.clear();
    logger.debug('Cache cleared');
  }

  // Clean up expired entries
  cleanup() {
    const now = Date.now();
    for (const [key, expiry] of this.ttl.entries()) {
      if (now > expiry) {
        this.delete(key);
      }
    }
  }

  // Get cache statistics
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Create a singleton instance
const cache = new Cache();

// Clean up expired entries every 5 minutes
setInterval(() => {
  cache.cleanup();
}, 5 * 60 * 1000);

module.exports = cache; 