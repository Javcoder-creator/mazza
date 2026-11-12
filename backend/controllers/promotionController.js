const { Op } = require('sequelize');
const { Promotion, Category, Product } = require('../models');
const { AppError, asyncHandler } = require('../utils/helpers');

const PROMO_INCLUDES = [
  { model: Category, as: 'category', attributes: ['id', 'slug', 'nameUz', 'nameRu'] },
  { model: Product, as: 'product', attributes: ['id', 'slug', 'nameUz', 'nameRu', 'price', 'imageUrl'] }
];

exports.listPublicPromotions = asyncHandler(async (_req, res) => {
  const now = new Date();
  const promotions = await Promotion.findAll({
    where: {
      isActive: true,
      [Op.and]: [
        { [Op.or]: [{ startsAt: null }, { startsAt: { [Op.lte]: now } }] },
        { [Op.or]: [{ endsAt: null }, { endsAt: { [Op.gte]: now } }] }
      ]
    },
    include: PROMO_INCLUDES,
    order: [['id', 'DESC']]
  });

  res.json({
    success: true,
    data: promotions
  });
});

exports.validatePromoCode = asyncHandler(async (req, res) => {
  const code = String(req.body.code || req.query.code || '').trim().toUpperCase();
  const subtotal = Number(req.body.subtotal || 0);

  if (!code) {
    throw new AppError('Promo kod kiritilmadi.', 400);
  }

  const now = new Date();
  const promotion = await Promotion.findOne({
    where: {
      promoCode: code,
      isActive: true,
      [Op.and]: [
        { [Op.or]: [{ startsAt: null }, { startsAt: { [Op.lte]: now } }] },
        { [Op.or]: [{ endsAt: null }, { endsAt: { [Op.gte]: now } }] }
      ]
    }
  });

  if (!promotion) {
    throw new AppError('Promo kod topilmadi yoki muddati tugagan.', 404);
  }

  if (subtotal > 0 && subtotal < promotion.minOrderAmount) {
    throw new AppError(
      `Ushbu promo kod kamida ${promotion.minOrderAmount.toLocaleString()} so'mlik buyurtmada ishlaydi.`,
      400
    );
  }

  const discount =
    promotion.discountPercent > 0
      ? Math.round((subtotal * promotion.discountPercent) / 100)
      : Math.min(subtotal || promotion.discountAmount, promotion.discountAmount);

  res.json({
    success: true,
    data: {
      promotion,
      calculatedDiscount: discount
    }
  });
});

exports.listAdminPromotions = asyncHandler(async (_req, res) => {
  const promotions = await Promotion.findAll({
    include: PROMO_INCLUDES,
    order: [['id', 'DESC']]
  });

  res.json({
    success: true,
    data: promotions
  });
});

exports.createPromotion = asyncHandler(async (req, res) => {
  const {
    titleUz,
    titleRu,
    descriptionUz,
    descriptionRu,
    promoCode,
    discountPercent,
    discountAmount,
    minOrderAmount,
    badgeText,
    imageUrl,
    categoryId,
    productId,
    startsAt,
    endsAt,
    isActive
  } = req.body;

  if (!titleUz || !titleRu || !descriptionUz || !descriptionRu) {
    throw new AppError('Aksiya sarlavhasi va tavsifi (UZ va RU) kiritilishi shart.', 400);
  }

  const promotion = await Promotion.create({
    titleUz: String(titleUz).trim(),
    titleRu: String(titleRu).trim(),
    descriptionUz: String(descriptionUz).trim(),
    descriptionRu: String(descriptionRu).trim(),
    promoCode: promoCode && String(promoCode).trim() ? String(promoCode).trim().toUpperCase() : null,
    discountPercent: Number(discountPercent) || 0,
    discountAmount: Number(discountAmount) || 0,
    minOrderAmount: Number(minOrderAmount) || 0,
    badgeText: badgeText ? String(badgeText).trim() : null,
    imageUrl: req.file ? `/uploads/banners/${req.file.filename}` : imageUrl || null,
    categoryId: categoryId ? Number(categoryId) : null,
    productId: productId ? Number(productId) : null,
    startsAt: startsAt ? new Date(startsAt) : null,
    endsAt: endsAt ? new Date(endsAt) : null,
    isActive: isActive === undefined ? true : isActive === true || isActive === 'true'
  });

  const full = await Promotion.findByPk(promotion.id, { include: PROMO_INCLUDES });

  res.status(201).json({
    success: true,
    message: 'Aksiya yaratildi.',
    data: full
  });
});

exports.updatePromotion = asyncHandler(async (req, res) => {
  const promotion = await Promotion.findByPk(req.params.id);
  if (!promotion) {
    throw new AppError('Aksiya topilmadi.', 404);
  }

  const {
    titleUz,
    titleRu,
    descriptionUz,
    descriptionRu,
    promoCode,
    discountPercent,
    discountAmount,
    minOrderAmount,
    badgeText,
    imageUrl,
    categoryId,
    productId,
    startsAt,
    endsAt,
    isActive
  } = req.body;

  if (titleUz !== undefined) promotion.titleUz = String(titleUz).trim();
  if (titleRu !== undefined) promotion.titleRu = String(titleRu).trim();
  if (descriptionUz !== undefined) promotion.descriptionUz = String(descriptionUz).trim();
  if (descriptionRu !== undefined) promotion.descriptionRu = String(descriptionRu).trim();
  if (promoCode !== undefined) {
    promotion.promoCode = promoCode && String(promoCode).trim() ? String(promoCode).trim().toUpperCase() : null;
  }
  if (discountPercent !== undefined) promotion.discountPercent = Number(discountPercent) || 0;
  if (discountAmount !== undefined) promotion.discountAmount = Number(discountAmount) || 0;
  if (minOrderAmount !== undefined) promotion.minOrderAmount = Number(minOrderAmount) || 0;
  if (badgeText !== undefined) promotion.badgeText = badgeText ? String(badgeText).trim() : null;
  if (categoryId !== undefined) promotion.categoryId = categoryId ? Number(categoryId) : null;
  if (productId !== undefined) promotion.productId = productId ? Number(productId) : null;
  if (startsAt !== undefined) promotion.startsAt = startsAt ? new Date(startsAt) : null;
  if (endsAt !== undefined) promotion.endsAt = endsAt ? new Date(endsAt) : null;
  if (isActive !== undefined) promotion.isActive = isActive === true || isActive === 'true';

  if (req.file) {
    promotion.imageUrl = `/uploads/banners/${req.file.filename}`;
  } else if (imageUrl !== undefined) {
    promotion.imageUrl = imageUrl || null;
  }

  await promotion.save();
  const updated = await Promotion.findByPk(promotion.id, { include: PROMO_INCLUDES });

  res.json({
    success: true,
    message: 'Aksiya yangilandi.',
    data: updated
  });
});

exports.deletePromotion = asyncHandler(async (req, res) => {
  const promotion = await Promotion.findByPk(req.params.id);
  if (!promotion) {
    throw new AppError('Aksiya topilmadi.', 404);
  }

  await promotion.destroy();

  res.json({
    success: true,
    message: 'Aksiya o\'chirildi.'
  });
});
