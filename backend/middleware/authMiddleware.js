const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/auth');
const { User } = require('../models');
const { AppError, asyncHandler } = require('../utils/helpers');

function extractBearerToken(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  return null;
}

const protectUser = asyncHandler(async (req, _res, next) => {
  const token = extractBearerToken(req);
  if (!token) {
    throw new AppError('Avtorizatsiya talab qilinadi. Iltimos, tizimga kiring.', 401);
  }

  let decoded;
  try {
    decoded = jwt.verify(token, jwtSecret);
  } catch (_err) {
    throw new AppError('Sessiya muddati tugagan yoki token yaroqsiz.', 401);
  }

  if (decoded.type !== 'user') {
    throw new AppError('Foydalanuvchi huquqi talab qilinadi.', 403);
  }

  const user = await User.findByPk(decoded.id, {
    attributes: { exclude: ['passwordHash'] }
  });

  if (!user) {
    throw new AppError('Foydalanuvchi topilmadi.', 401);
  }

  if (!user.isActive) {
    throw new AppError('Sizning hisobingiz faol emas. Administrator bilan bog\'laning.', 403);
  }

  req.user = user;
  next();
});

const optionalUser = asyncHandler(async (req, _res, next) => {
  const token = extractBearerToken(req);
  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    if (decoded.type === 'user') {
      const user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['passwordHash'] }
      });
      if (user && user.isActive) {
        req.user = user;
      }
    }
  } catch (_err) {
    // Allow guest checkout when optional token is expired/invalid
  }
  next();
});

module.exports = {
  protectUser,
  optionalUser
};
