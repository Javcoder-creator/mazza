const { fn, col } = require('sequelize');
const { Category, Product } = require('../models');
const { AppError, asyncHandler, slugify } = require('../utils/helpers');

exports.listPublicCategories = asyncHandler(async (_req, res) => {
  const categories = await Category.findAll({
    where: { isActive: true },
    order: [
      ['sortOrder', 'ASC'],
      ['id', 'ASC']
    ]
  });

  const counts = await Product.findAll({
    where: { isAvailable: true },
    attributes: ['categoryId', [fn('COUNT', col('id')), 'count']],
    group: ['categoryId'],
    raw: true
  });

  const countMap = new Map(counts.map((c) => [Number(c.categoryId), Number(c.count)]));
  const [promoCount, newCount] = await Promise.all([
    Product.count({ where: { isAvailable: true, isPromo: true } }),
    Product.count({ where: { isAvailable: true, isNew: true } })
  ]);

  const enriched = categories.map((cat) => {
    let productCount = countMap.get(cat.id) || 0;
    if (cat.slug === 'aksiyalar') {
      productCount = Math.max(productCount, promoCount);
    } else if (cat.slug === 'yangiliklar') {
      productCount = Math.max(productCount, newCount);
    }
    return {
      ...cat.toJSON(),
      productCount
    };
  });

  res.json({
    success: true,
    data: enriched
  });
});

exports.listAdminCategories = asyncHandler(async (_req, res) => {
  const categories = await Category.findAll({
    order: [
      ['sortOrder', 'ASC'],
      ['id', 'ASC']
    ]
  });

  const counts = await Product.findAll({
    attributes: ['categoryId', [fn('COUNT', col('id')), 'count']],
    group: ['categoryId'],
    raw: true
  });
  const countMap = new Map(counts.map((c) => [Number(c.categoryId), Number(c.count)]));

  res.json({
    success: true,
    data: categories.map((cat) => ({
      ...cat.toJSON(),
      productCount: countMap.get(cat.id) || 0
    }))
  });
});

exports.createCategory = asyncHandler(async (req, res) => {
  const { nameUz, nameRu, slug, descriptionUz, descriptionRu, icon, sortOrder, isVirtual, isActive } = req.body;

  if (!nameUz || !nameRu) {
    throw new AppError('Kategoriya nomi (O\'zbekcha va Ruscha) kiritilishi shart.', 400);
  }

  const finalSlug = slugify(slug || nameUz);
  if (!finalSlug) {
    throw new AppError('Kategoriya slug noto\'g\'ri.', 400);
  }

  let iconPath = icon || null;
  if (req.file) {
    iconPath = `/uploads/categories/${req.file.filename}`;
  }

  const category = await Category.create({
    slug: finalSlug,
    nameUz: String(nameUz).trim(),
    nameRu: String(nameRu).trim(),
    descriptionUz: descriptionUz || null,
    descriptionRu: descriptionRu || null,
    icon: iconPath,
    sortOrder: Number(sortOrder) || 0,
    isVirtual: isVirtual === true || isVirtual === 'true',
    isActive: isActive === undefined ? true : isActive === true || isActive === 'true'
  });

  res.status(201).json({
    success: true,
    message: 'Kategoriya yaratildi.',
    data: category
  });
});

exports.updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByPk(req.params.id);
  if (!category) {
    throw new AppError('Kategoriya topilmadi.', 404);
  }

  const { nameUz, nameRu, slug, descriptionUz, descriptionRu, icon, sortOrder, isVirtual, isActive } = req.body;

  if (nameUz !== undefined) category.nameUz = String(nameUz).trim();
  if (nameRu !== undefined) category.nameRu = String(nameRu).trim();
  if (slug !== undefined && String(slug).trim()) category.slug = slugify(slug);
  if (descriptionUz !== undefined) category.descriptionUz = descriptionUz;
  if (descriptionRu !== undefined) category.descriptionRu = descriptionRu;
  if (sortOrder !== undefined) category.sortOrder = Number(sortOrder) || 0;
  if (isVirtual !== undefined) category.isVirtual = isVirtual === true || isVirtual === 'true';
  if (isActive !== undefined) category.isActive = isActive === true || isActive === 'true';

  if (req.file) {
    category.icon = `/uploads/categories/${req.file.filename}`;
  } else if (icon !== undefined) {
    category.icon = icon;
  }

  await category.save();

  res.json({
    success: true,
    message: 'Kategoriya yangilandi.',
    data: category
  });
});

exports.deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByPk(req.params.id);
  if (!category) {
    throw new AppError('Kategoriya topilmadi.', 404);
  }

  const linkedProducts = await Product.count({ where: { categoryId: category.id } });
  if (linkedProducts > 0) {
    throw new AppError(
      `Ushbu kategoriyada ${linkedProducts} ta mahsulot mavjud. Avval mahsulotlarni boshqa kategoriyaga o'tkazing yoki o'chiring.`,
      400
    );
  }

  await category.destroy();

  res.json({
    success: true,
    message: 'Kategoriya o\'chirildi.'
  });
});
