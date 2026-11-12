const { Banner, Category, Product, Promotion } = require('../models');
const { AppError, asyncHandler } = require('../utils/helpers');

const BANNER_INCLUDES = [
  { model: Category, as: 'category', attributes: ['id', 'slug', 'nameUz', 'nameRu'] },
  { model: Product, as: 'product', attributes: ['id', 'slug', 'nameUz', 'nameRu', 'price'] },
  { model: Promotion, as: 'promotion', attributes: ['id', 'titleUz', 'titleRu', 'promoCode', 'discountPercent', 'discountAmount'] }
];

exports.listPublicBanners = asyncHandler(async (_req, res) => {
  const banners = await Banner.findAll({
    where: { isActive: true },
    include: BANNER_INCLUDES,
    order: [
      ['sortOrder', 'ASC'],
      ['id', 'ASC']
    ]
  });

  res.json({
    success: true,
    data: banners
  });
});

exports.listAdminBanners = asyncHandler(async (_req, res) => {
  const banners = await Banner.findAll({
    include: BANNER_INCLUDES,
    order: [
      ['sortOrder', 'ASC'],
      ['id', 'ASC']
    ]
  });

  res.json({
    success: true,
    data: banners
  });
});

exports.createBanner = asyncHandler(async (req, res) => {
  const {
    titleUz,
    titleRu,
    subtitleUz,
    subtitleRu,
    ctaTextUz,
    ctaTextRu,
    imageUrl,
    linkType,
    promotionId,
    productId,
    categoryId,
    targetUrl,
    sortOrder,
    isActive
  } = req.body;

  if (!titleUz || !titleRu) {
    throw new AppError('Banner sarlavhasi (UZ va RU) kiritilishi shart.', 400);
  }

  const finalImageUrl = req.file
    ? `/uploads/banners/${req.file.filename}`
    : imageUrl;

  if (!finalImageUrl) {
    throw new AppError('Banner rasmi yuklanishi shart.', 400);
  }

  const banner = await Banner.create({
    titleUz: String(titleUz).trim(),
    titleRu: String(titleRu).trim(),
    subtitleUz: subtitleUz ? String(subtitleUz).trim() : null,
    subtitleRu: subtitleRu ? String(subtitleRu).trim() : null,
    ctaTextUz: ctaTextUz ? String(ctaTextUz).trim() : 'Buyurtma berish',
    ctaTextRu: ctaTextRu ? String(ctaTextRu).trim() : 'Заказать',
    imageUrl: finalImageUrl,
    linkType: linkType || 'category',
    promotionId: promotionId ? Number(promotionId) : null,
    productId: productId ? Number(productId) : null,
    categoryId: categoryId ? Number(categoryId) : null,
    targetUrl: targetUrl || null,
    sortOrder: Number(sortOrder) || 0,
    isActive: isActive === undefined ? true : isActive === true || isActive === 'true'
  });

  const fullBanner = await Banner.findByPk(banner.id, { include: BANNER_INCLUDES });

  res.status(201).json({
    success: true,
    message: 'Banner qo\'shildi.',
    data: fullBanner
  });
});

exports.updateBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.findByPk(req.params.id);
  if (!banner) {
    throw new AppError('Banner topilmadi.', 404);
  }

  const {
    titleUz,
    titleRu,
    subtitleUz,
    subtitleRu,
    ctaTextUz,
    ctaTextRu,
    imageUrl,
    linkType,
    promotionId,
    productId,
    categoryId,
    targetUrl,
    sortOrder,
    isActive
  } = req.body;

  if (titleUz !== undefined) banner.titleUz = String(titleUz).trim();
  if (titleRu !== undefined) banner.titleRu = String(titleRu).trim();
  if (subtitleUz !== undefined) banner.subtitleUz = subtitleUz ? String(subtitleUz).trim() : null;
  if (subtitleRu !== undefined) banner.subtitleRu = subtitleRu ? String(subtitleRu).trim() : null;
  if (ctaTextUz !== undefined) banner.ctaTextUz = String(ctaTextUz).trim();
  if (ctaTextRu !== undefined) banner.ctaTextRu = String(ctaTextRu).trim();
  if (linkType !== undefined) banner.linkType = linkType;
  if (promotionId !== undefined) banner.promotionId = promotionId ? Number(promotionId) : null;
  if (productId !== undefined) banner.productId = productId ? Number(productId) : null;
  if (categoryId !== undefined) banner.categoryId = categoryId ? Number(categoryId) : null;
  if (targetUrl !== undefined) banner.targetUrl = targetUrl || null;
  if (sortOrder !== undefined) banner.sortOrder = Number(sortOrder) || 0;
  if (isActive !== undefined) banner.isActive = isActive === true || isActive === 'true';

  if (req.file) {
    banner.imageUrl = `/uploads/banners/${req.file.filename}`;
  } else if (imageUrl !== undefined && String(imageUrl).trim()) {
    banner.imageUrl = String(imageUrl).trim();
  }

  await banner.save();
  const updated = await Banner.findByPk(banner.id, { include: BANNER_INCLUDES });

  res.json({
    success: true,
    message: 'Banner yangilandi.',
    data: updated
  });
});

exports.deleteBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.findByPk(req.params.id);
  if (!banner) {
    throw new AppError('Banner topilmadi.', 404);
  }

  await banner.destroy();

  res.json({
    success: true,
    message: 'Banner o\'chirildi.'
  });
});
