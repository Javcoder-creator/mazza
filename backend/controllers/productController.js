const { Op } = require('sequelize');
const { Product, ProductImage, Category } = require('../models');
const { AppError, asyncHandler, slugify } = require('../utils/helpers');

const PRODUCT_INCLUDES = [
  {
    model: Category,
    as: 'category',
    attributes: ['id', 'slug', 'nameUz', 'nameRu', 'icon']
  },
  {
    model: ProductImage,
    as: 'images',
    attributes: ['id', 'imageUrl', 'isPrimary', 'sortOrder']
  }
];

function buildSearchCondition(searchQuery) {
  const pattern = `%${searchQuery}%`;
  return {
    [Op.or]: [
      { nameUz: { [Op.iLike]: pattern } },
      { nameRu: { [Op.iLike]: pattern } },
      { ingredientsUz: { [Op.iLike]: pattern } },
      { ingredientsRu: { [Op.iLike]: pattern } },
      { descriptionUz: { [Op.iLike]: pattern } },
      { descriptionRu: { [Op.iLike]: pattern } },
      { '$category.name_uz$': { [Op.iLike]: pattern } },
      { '$category.name_ru$': { [Op.iLike]: pattern } }
    ]
  };
}

exports.listProducts = asyncHandler(async (req, res) => {
  const { category, search, kids, promo, isNew, includeUnavailable } = req.query;

  const where = {};
  if (includeUnavailable !== 'true') {
    where.isAvailable = true;
  }

  if (kids === 'true') {
    where.isKids = true;
  }
  if (promo === 'true') {
    where.isPromo = true;
  }
  if (isNew === 'true') {
    where.isNew = true;
  }

  if (category && category !== 'all') {
    const isNumeric = /^\d+$/.test(String(category));
    const catRecord = await Category.findOne({
      where: isNumeric ? { id: Number(category) } : { slug: String(category) }
    });

    if (catRecord) {
      if (catRecord.slug === 'aksiyalar') {
        where[Op.or] = [{ categoryId: catRecord.id }, { isPromo: true }];
      } else if (catRecord.slug === 'yangiliklar') {
        where[Op.or] = [{ categoryId: catRecord.id }, { isNew: true }];
      } else {
        where.categoryId = catRecord.id;
      }
    } else if (!isNumeric) {
      return res.json({ success: true, data: [] });
    } else {
      where.categoryId = Number(category);
    }
  }

  const finalWhere =
    search && String(search).trim()
      ? { [Op.and]: [where, buildSearchCondition(String(search).trim())] }
      : where;

  const products = await Product.findAll({
    where: finalWhere,
    include: PRODUCT_INCLUDES,
    order: [
      ['sortOrder', 'ASC'],
      ['id', 'ASC'],
      [{ model: ProductImage, as: 'images' }, 'isPrimary', 'DESC'],
      [{ model: ProductImage, as: 'images' }, 'sortOrder', 'ASC']
    ]
  });

  res.json({
    success: true,
    data: products
  });
});

exports.searchAutocomplete = asyncHandler(async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q) {
    return res.json({
      success: true,
      data: { products: [], categories: [] }
    });
  }

  const pattern = `%${q}%`;

  const [products, categories] = await Promise.all([
    Product.findAll({
      where: {
        isAvailable: true,
        [Op.and]: [buildSearchCondition(q)]
      },
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'slug', 'nameUz', 'nameRu']
        }
      ],
      limit: 8,
      subQuery: false,
      order: [['sortOrder', 'ASC'], ['id', 'ASC']]
    }),
    Category.findAll({
      where: {
        isActive: true,
        [Op.or]: [
          { nameUz: { [Op.iLike]: pattern } },
          { nameRu: { [Op.iLike]: pattern } }
        ]
      },
      limit: 4,
      order: [['sortOrder', 'ASC']]
    })
  ]);

  res.json({
    success: true,
    data: { products, categories }
  });
});

exports.getProductDetail = asyncHandler(async (req, res) => {
  const param = req.params.idOrSlug;
  const isNumeric = /^\d+$/.test(String(param));

  const product = await Product.findOne({
    where: isNumeric ? { id: Number(param) } : { slug: String(param) },
    include: PRODUCT_INCLUDES,
    order: [
      [{ model: ProductImage, as: 'images' }, 'isPrimary', 'DESC'],
      [{ model: ProductImage, as: 'images' }, 'sortOrder', 'ASC']
    ]
  });

  if (!product) {
    throw new AppError('Mahsulot topilmadi.', 404);
  }

  const related = await Product.findAll({
    where: {
      categoryId: product.categoryId,
      id: { [Op.ne]: product.id },
      isAvailable: true
    },
    limit: 4,
    order: [['sortOrder', 'ASC']]
  });

  res.json({
    success: true,
    data: {
      product,
      related
    }
  });
});

exports.createProduct = asyncHandler(async (req, res) => {
  const {
    categoryId,
    nameUz,
    nameRu,
    slug,
    descriptionUz,
    descriptionRu,
    ingredientsUz,
    ingredientsRu,
    price,
    oldPrice,
    calories,
    volumeUz,
    volumeRu,
    badgeUz,
    badgeRu,
    imageUrl,
    isAvailable,
    isNew,
    isPromo,
    isKids,
    sortOrder
  } = req.body;

  if (!categoryId || !nameUz || !nameRu || price === undefined || !volumeUz || !volumeRu) {
    throw new AppError('Kategoriya, mahsulot nomi, narxi va hajmi kiritilishi shart.', 400);
  }

  const category = await Category.findByPk(categoryId);
  if (!category) {
    throw new AppError('Tanlangan kategoriya topilmadi.', 404);
  }

  const uploadedFiles = Array.isArray(req.files) ? req.files : req.file ? [req.file] : [];
  const primaryImage =
    uploadedFiles.length > 0
      ? `/uploads/products/${uploadedFiles[0].filename}`
      : imageUrl || '/uploads/products/lavash-beef.png';

  const baseSlug = slugify(slug || nameUz) || `product-${Date.now()}`;
  const existingSlug = await Product.findOne({ where: { slug: baseSlug } });
  const finalSlug = existingSlug ? `${baseSlug}-${Date.now().toString().slice(-4)}` : baseSlug;

  const product = await Product.create({
    categoryId: Number(categoryId),
    slug: finalSlug,
    nameUz: String(nameUz).trim(),
    nameRu: String(nameRu).trim(),
    descriptionUz: String(descriptionUz || nameUz).trim(),
    descriptionRu: String(descriptionRu || nameRu).trim(),
    ingredientsUz: String(ingredientsUz || 'Maxsus retsept bo\'yicha tayyorlangan').trim(),
    ingredientsRu: String(ingredientsRu || 'Приготовлено по фирменному рецепту').trim(),
    price: Number(price),
    oldPrice: oldPrice ? Number(oldPrice) : null,
    calories: calories ? Number(calories) : null,
    volumeUz: String(volumeUz).trim(),
    volumeRu: String(volumeRu).trim(),
    badgeUz: badgeUz ? String(badgeUz).trim() : null,
    badgeRu: badgeRu ? String(badgeRu).trim() : null,
    imageUrl: primaryImage,
    isAvailable: isAvailable === undefined ? true : isAvailable === true || isAvailable === 'true',
    isNew: isNew === true || isNew === 'true',
    isPromo: isPromo === true || isPromo === 'true',
    isKids: isKids === true || isKids === 'true',
    sortOrder: Number(sortOrder) || 0
  });

  if (uploadedFiles.length > 0) {
    await ProductImage.bulkCreate(
      uploadedFiles.map((file, idx) => ({
        productId: product.id,
        imageUrl: `/uploads/products/${file.filename}`,
        isPrimary: idx === 0,
        sortOrder: idx
      }))
    );
  } else {
    await ProductImage.create({
      productId: product.id,
      imageUrl: primaryImage,
      isPrimary: true,
      sortOrder: 0
    });
  }

  const fullProduct = await Product.findByPk(product.id, { include: PRODUCT_INCLUDES });

  res.status(201).json({
    success: true,
    message: 'Mahsulot muvaffaqiyatli qo\'shildi.',
    data: fullProduct
  });
});

exports.updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByPk(req.params.id);
  if (!product) {
    throw new AppError('Mahsulot topilmadi.', 404);
  }

  const {
    categoryId,
    nameUz,
    nameRu,
    slug,
    descriptionUz,
    descriptionRu,
    ingredientsUz,
    ingredientsRu,
    price,
    oldPrice,
    calories,
    volumeUz,
    volumeRu,
    badgeUz,
    badgeRu,
    imageUrl,
    isAvailable,
    isNew,
    isPromo,
    isKids,
    sortOrder
  } = req.body;

  if (categoryId !== undefined) {
    const category = await Category.findByPk(categoryId);
    if (!category) throw new AppError('Kategoriya topilmadi.', 404);
    product.categoryId = Number(categoryId);
  }
  if (nameUz !== undefined) product.nameUz = String(nameUz).trim();
  if (nameRu !== undefined) product.nameRu = String(nameRu).trim();
  if (slug !== undefined && String(slug).trim()) product.slug = slugify(slug);
  if (descriptionUz !== undefined) product.descriptionUz = String(descriptionUz).trim();
  if (descriptionRu !== undefined) product.descriptionRu = String(descriptionRu).trim();
  if (ingredientsUz !== undefined) product.ingredientsUz = String(ingredientsUz).trim();
  if (ingredientsRu !== undefined) product.ingredientsRu = String(ingredientsRu).trim();
  if (price !== undefined) product.price = Number(price);
  if (oldPrice !== undefined) product.oldPrice = oldPrice ? Number(oldPrice) : null;
  if (calories !== undefined) product.calories = calories ? Number(calories) : null;
  if (volumeUz !== undefined) product.volumeUz = String(volumeUz).trim();
  if (volumeRu !== undefined) product.volumeRu = String(volumeRu).trim();
  if (badgeUz !== undefined) product.badgeUz = badgeUz ? String(badgeUz).trim() : null;
  if (badgeRu !== undefined) product.badgeRu = badgeRu ? String(badgeRu).trim() : null;
  if (isAvailable !== undefined) product.isAvailable = isAvailable === true || isAvailable === 'true';
  if (isNew !== undefined) product.isNew = isNew === true || isNew === 'true';
  if (isPromo !== undefined) product.isPromo = isPromo === true || isPromo === 'true';
  if (isKids !== undefined) product.isKids = isKids === true || isKids === 'true';
  if (sortOrder !== undefined) product.sortOrder = Number(sortOrder) || 0;

  const uploadedFiles = Array.isArray(req.files) ? req.files : req.file ? [req.file] : [];
  if (uploadedFiles.length > 0) {
    const newMainPath = `/uploads/products/${uploadedFiles[0].filename}`;
    product.imageUrl = newMainPath;

    await ProductImage.update({ isPrimary: false }, { where: { productId: product.id } });
    await ProductImage.bulkCreate(
      uploadedFiles.map((file, idx) => ({
        productId: product.id,
        imageUrl: `/uploads/products/${file.filename}`,
        isPrimary: idx === 0,
        sortOrder: idx
      }))
    );
  } else if (imageUrl !== undefined && String(imageUrl).trim()) {
    product.imageUrl = String(imageUrl).trim();
  }

  await product.save();

  const updated = await Product.findByPk(product.id, { include: PRODUCT_INCLUDES });

  res.json({
    success: true,
    message: 'Mahsulot yangilandi.',
    data: updated
  });
});

exports.deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByPk(req.params.id);
  if (!product) {
    throw new AppError('Mahsulot topilmadi.', 404);
  }

  await product.destroy();

  res.json({
    success: true,
    message: 'Mahsulot o\'chirildi.'
  });
});

exports.addProductImages = asyncHandler(async (req, res) => {
  const product = await Product.findByPk(req.params.id);
  if (!product) {
    throw new AppError('Mahsulot topilmadi.', 404);
  }

  const files = Array.isArray(req.files) ? req.files : [];
  if (files.length === 0) {
    throw new AppError('Yuklash uchun rasm tanlanmadi.', 400);
  }

  const existingCount = await ProductImage.count({ where: { productId: product.id } });
  const created = await ProductImage.bulkCreate(
    files.map((file, idx) => ({
      productId: product.id,
      imageUrl: `/uploads/products/${file.filename}`,
      isPrimary: existingCount === 0 && idx === 0,
      sortOrder: existingCount + idx
    }))
  );

  res.status(201).json({
    success: true,
    message: 'Rasmlar yuklandi.',
    data: created
  });
});

exports.deleteProductImage = asyncHandler(async (req, res) => {
  const img = await ProductImage.findOne({
    where: { id: req.params.imageId, productId: req.params.id }
  });
  if (!img) {
    throw new AppError('Rasm topilmadi.', 404);
  }

  await img.destroy();

  res.json({
    success: true,
    message: 'Rasm o\'chirildi.'
  });
});
