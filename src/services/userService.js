const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');

class UserService {
  async createUser(userData) {
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      throw new AppError('User already exists with this email', 400);
    }
    
    return await User.create(userData);
  }

  async findUserByEmail(email, includePassword = false) {
    const query = User.findOne({ email });
    if (includePassword) {
      query.select('+password');
    }
    return await query.exec();
  }

  async findUserById(id, includePassword = false) {
    const query = User.findById(id);
    if (includePassword) {
      query.select('+password +refreshToken');
    }
    return await query.exec();
  }

  async updateUser(id, updateData) {
    return await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    });
  }

  async updateUserPassword(id, newPassword) {
    const user = await User.findById(id).select('+password');
    if (!user) {
      throw new AppError('User not found', 404);
    }
    
    user.password = newPassword;
    await user.save();
    return user;
  }

  async validatePassword(user, password) {
    return await user.comparePassword(password);
  }

  generateTokens(user) {
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRE }
    );

    return { token, refreshToken };
  }

  async updateRefreshToken(userId, refreshToken) {
    return await User.findByIdAndUpdate(
      userId,
      { refreshToken },
      { new: true, runValidators: false }
    );
  }

  async verifyRefreshToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      const user = await User.findById(decoded.id).select('+refreshToken');
      
      if (!user || user.refreshToken !== refreshToken) {
        throw new AppError('Invalid refresh token', 401);
      }
      
      return user;
    } catch (error) {
      throw new AppError('Invalid refresh token', 401);
    }
  }

  async updateLastLogin(userId) {
    return await User.findByIdAndUpdate(
      userId,
      { lastLogin: new Date() },
      { new: true, runValidators: false }
    );
  }

  async addAddress(userId, addressData) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Set isDefault to false for all existing addresses if new address is default
    if (addressData.isDefault) {
      user.addresses.forEach(addr => addr.isDefault = false);
    }

    user.addresses.push(addressData);
    await user.save();
    return user;
  }

  async updateAddress(userId, addressId, addressData) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const addressIndex = user.addresses.findIndex(addr => addr._id.toString() === addressId);
    if (addressIndex === -1) {
      throw new AppError('Address not found', 404);
    }

    // Set isDefault to false for all other addresses if this address is being set as default
    if (addressData.isDefault) {
      user.addresses.forEach((addr, index) => {
        if (index !== addressIndex) addr.isDefault = false;
      });
    }

    user.addresses[addressIndex] = { ...user.addresses[addressIndex], ...addressData };
    await user.save();
    return user;
  }

  async deleteAddress(userId, addressId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const addressIndex = user.addresses.findIndex(addr => addr._id.toString() === addressId);
    if (addressIndex === -1) {
      throw new AppError('Address not found', 404);
    }

    user.addresses.splice(addressIndex, 1);
    await user.save();
    return user;
  }
}

module.exports = new UserService(); 