const jwt = require('jsonwebtoken');
const User = require('../models/User');
const env = require('../config/env');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });

const register = asyncHandler(async (req, res, next) => {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    return next(new AppError('An account with this email already exists.', 409));
  }

  // Public registration always assigns the standard 'user' role
  const user = await User.create({ name, email, password, role: 'user' });
  const token = signToken(user);

  res.status(201).json({
    success: true,
    message: 'Account registered successfully',
    data: {
      user,
      token,
    },
  });
});

const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError('Invalid email or password.', 401));
  }

  if (!user.isActive) {
    return next(new AppError('Your account has been deactivated.', 403));
  }

  const token = signToken(user);
  user.password = undefined;

  res.status(200).json({
    success: true,
    message: 'Logged in successfully',
    data: {
      user,
      token,
    },
  });
});

const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      user: req.user,
    },
  });
});

module.exports = { register, login, getMe };
