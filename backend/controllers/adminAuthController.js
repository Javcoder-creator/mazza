const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { Admin } = require('../models');
const { jwtAdminSecret, jwtAdminExpiresIn } = require('../config/auth');
const { AppError, asyncHandler } = require('../utils/helpers');

function signAdminToken(admin) {
  return jwt.sign(
    { id: admin.id, type: 'admin', role: admin.role },
    jwtAdminSecret,
    { expiresIn: jwtAdminExpiresIn }
  );
}

exports.login = asyncHandler(async (req, res) => {
  const { login, username, email, password } = req.body;
  const identifier = String(login || username || email || '').trim().toLowerCase();

  if (!identifier || !password) {
    throw new AppError('Login (username/email) va parol kiritilishi shart.', 400);
  }

  const admin = await Admin.findOne({
    where: {
      [Op.or]: [
        { username: identifier },
        { email: identifier }
      ]
    }
  });

  if (!admin) {
    throw new AppError('Administrator login yoki paroli noto\'g\'ri.', 401);
  }

  if (!admin.isActive) {
    throw new AppError('Administrator hisobi faol emas.', 403);
  }

  const isValid = await bcrypt.compare(String(password), admin.passwordHash);
  if (!isValid) {
    throw new AppError('Administrator login yoki paroli noto\'g\'ri.', 401);
  }

  admin.lastLoginAt = new Date();
  await admin.save();

  const token = signAdminToken(admin);

  res.json({
    success: true,
    message: 'Admin panelga xush kelibsiz.',
    data: {
      token,
      admin: {
        id: admin.id,
        fullName: admin.fullName,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        lastLoginAt: admin.lastLoginAt
      }
    }
  });
});

exports.getProfile = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: req.admin
  });
});
