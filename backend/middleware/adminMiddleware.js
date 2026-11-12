const jwt = require('jsonwebtoken');
const { jwtAdminSecret } = require('../config/auth');
const { Admin } = require('../models');
const { AppError, asyncHandler } = require('../utils/helpers');

const protectAdmin = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

  if (!token) {
    throw new AppError('Admin avtorizatsiyasi talab qilinadi.', 401);
  }

  let decoded;
  try {
    decoded = jwt.verify(token, jwtAdminSecret);
  } catch (_err) {
    throw new AppError('Admin tokeni yaroqsiz yoki muddati tugagan.', 401);
  }

  if (decoded.type !== 'admin') {
    throw new AppError('Ushbu bo\'lim faqat administratorlar uchun ochiq.', 403);
  }

  const admin = await Admin.findByPk(decoded.id, {
    attributes: { exclude: ['passwordHash'] }
  });

  if (!admin || !admin.isActive) {
    throw new AppError('Administrator hisobi topilmadi yoki bloklangan.', 403);
  }

  req.admin = admin;
  next();
});

module.exports = {
  protectAdmin
};
