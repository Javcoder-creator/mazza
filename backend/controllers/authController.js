const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { User, Order, Address } = require('../models');
const { jwtSecret, jwtExpiresIn, saltRounds } = require('../config/auth');
const { AppError, asyncHandler, normalizePhone } = require('../utils/helpers');

function signUserToken(user) {
  return jwt.sign({ id: user.id, type: 'user' }, jwtSecret, { expiresIn: jwtExpiresIn });
}

function sanitizeUser(user) {
  return {
    id: user.id,
    fullName: user.fullName,
    phone: user.phone,
    email: user.email,
    preferredLanguage: user.preferredLanguage,
    isActive: user.isActive,
    createdAt: user.createdAt
  };
}

exports.register = asyncHandler(async (req, res) => {
  const { fullName, phone, email, password, preferredLanguage } = req.body;

  if (!fullName || !String(fullName).trim()) {
    throw new AppError('Ism-familiya kiritilishi shart.', 400);
  }
  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone || normalizedPhone.length < 9) {
    throw new AppError('Telefon raqami noto\'g\'ri formatda.', 400);
  }
  if (!password || String(password).length < 6) {
    throw new AppError('Parol kamida 6 ta belgidan iborat bo\'lishi kerak.', 400);
  }

  const cleanEmail = email && String(email).trim() ? String(email).trim().toLowerCase() : null;

  const existingPhone = await User.findOne({ where: { phone: normalizedPhone } });
  if (existingPhone) {
    throw new AppError('Ushbu telefon raqami bilan foydalanuvchi allaqachon ro\'yxatdan o\'tgan.', 409);
  }

  if (cleanEmail) {
    const existingEmail = await User.findOne({ where: { email: cleanEmail } });
    if (existingEmail) {
      throw new AppError('Ushbu email bilan foydalanuvchi allaqachon mavjud.', 409);
    }
  }

  const passwordHash = await bcrypt.hash(String(password), saltRounds);

  const user = await User.create({
    fullName: String(fullName).trim(),
    phone: normalizedPhone,
    email: cleanEmail,
    passwordHash,
    preferredLanguage: preferredLanguage === 'ru' ? 'ru' : 'uz'
  });

  const token = signUserToken(user);

  res.status(201).json({
    success: true,
    message: 'Ro\'yxatdan o\'tish muvaffaqiyatli yakunlandi.',
    data: {
      token,
      user: sanitizeUser(user)
    }
  });
});

exports.login = asyncHandler(async (req, res) => {
  const { login, phone, email, password } = req.body;
  const identifier = String(login || phone || email || '').trim();

  if (!identifier || !password) {
    throw new AppError('Telefon/email va parol kiritilishi shart.', 400);
  }

  const normalized = normalizePhone(identifier);
  const whereConditions = [{ email: identifier.toLowerCase() }];
  if (normalized) {
    whereConditions.push({ phone: normalized });
  }

  const user = await User.findOne({
    where: { [Op.or]: whereConditions }
  });

  if (!user) {
    throw new AppError('Telefon/email yoki parol noto\'g\'ri.', 401);
  }

  if (!user.isActive) {
    throw new AppError('Hisobingiz vaqtincha bloklangan.', 403);
  }

  const isValid = await bcrypt.compare(String(password), user.passwordHash);
  if (!isValid) {
    throw new AppError('Telefon/email yoki parol noto\'g\'ri.', 401);
  }

  const token = signUserToken(user);

  res.json({
    success: true,
    message: 'Tizimga muvaffaqiyatli kirdingiz.',
    data: {
      token,
      user: sanitizeUser(user)
    }
  });
});

exports.getProfile = asyncHandler(async (req, res) => {
  const [ordersCount, addressesCount] = await Promise.all([
    Order.count({ where: { userId: req.user.id } }),
    Address.count({ where: { userId: req.user.id } })
  ]);

  res.json({
    success: true,
    data: {
      ...sanitizeUser(req.user),
      ordersCount,
      addressesCount
    }
  });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const { fullName, phone, email, preferredLanguage } = req.body;
  const user = await User.findByPk(req.user.id);

  if (!user) {
    throw new AppError('Foydalanuvchi topilmadi.', 404);
  }

  if (fullName !== undefined) {
    if (!String(fullName).trim()) {
      throw new AppError('Ism bo\'sh bo\'lishi mumkin emas.', 400);
    }
    user.fullName = String(fullName).trim();
  }

  if (phone !== undefined) {
    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone || normalizedPhone.length < 9) {
      throw new AppError('Telefon raqami noto\'g\'ri formatda.', 400);
    }
    const duplicate = await User.findOne({
      where: { phone: normalizedPhone, id: { [Op.ne]: user.id } }
    });
    if (duplicate) {
      throw new AppError('Ushbu telefon raqami boshqa hisobga biriktirilgan.', 409);
    }
    user.phone = normalizedPhone;
  }

  if (email !== undefined) {
    const cleanEmail = email && String(email).trim() ? String(email).trim().toLowerCase() : null;
    if (cleanEmail) {
      const duplicate = await User.findOne({
        where: { email: cleanEmail, id: { [Op.ne]: user.id } }
      });
      if (duplicate) {
        throw new AppError('Ushbu email boshqa hisobga biriktirilgan.', 409);
      }
    }
    user.email = cleanEmail;
  }

  if (preferredLanguage === 'uz' || preferredLanguage === 'ru') {
    user.preferredLanguage = preferredLanguage;
  }

  await user.save();

  res.json({
    success: true,
    message: 'Shaxsiy ma\'lumotlar yangilandi.',
    data: sanitizeUser(user)
  });
});

exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword || String(newPassword).length < 6) {
    throw new AppError('Joriy parol va kamida 6 belgili yangi parolni kiriting.', 400);
  }

  const user = await User.findByPk(req.user.id);
  const isMatch = await bcrypt.compare(String(currentPassword), user.passwordHash);
  if (!isMatch) {
    throw new AppError('Joriy parol noto\'g\'ri.', 401);
  }

  user.passwordHash = await bcrypt.hash(String(newPassword), saltRounds);
  await user.save();

  res.json({
    success: true,
    message: 'Parol muvaffaqiyatli o\'zgartirildi.'
  });
});
