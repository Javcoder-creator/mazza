const { Op } = require('sequelize');
const { Order, OrderItem, Product, Promotion, Address, sequelize } = require('../models');
const {
  AppError,
  asyncHandler,
  normalizePhone,
  generateOrderNumber,
  calculateOrderTotals
} = require('../utils/helpers');

exports.createOrder = asyncHandler(async (req, res) => {
  const {
    customerName,
    customerPhone,
    deliveryAddress,
    addressId,
    branchName,
    orderType,
    paymentType,
    comment,
    promoCode,
    items
  } = req.body;

  if (!customerName || !String(customerName).trim()) {
    throw new AppError('Ismingizni kiriting.', 400);
  }

  const normalizedPhone = normalizePhone(customerPhone);
  if (!normalizedPhone || normalizedPhone.length < 9) {
    throw new AppError('Telefon raqami noto\'g\'ri formatda.', 400);
  }

  const finalOrderType = Order.ORDER_TYPES.includes(orderType) ? orderType : 'delivery';
  const finalPaymentType = Order.PAYMENT_TYPES.includes(paymentType) ? paymentType : 'cash';

  let resolvedAddress = deliveryAddress ? String(deliveryAddress).trim() : null;
  let resolvedAddressId = null;

  if (finalOrderType === 'delivery') {
    if (addressId && req.user) {
      const savedAddr = await Address.findOne({ where: { id: addressId, userId: req.user.id } });
      if (savedAddr) {
        resolvedAddressId = savedAddr.id;
        if (!resolvedAddress) {
          resolvedAddress = [
            savedAddr.streetAddress,
            savedAddr.apartment ? `kv. ${savedAddr.apartment}` : null,
            savedAddr.entrance ? `pod. ${savedAddr.entrance}` : null,
            savedAddr.floor ? `${savedAddr.floor}-qavat` : null,
            savedAddr.landmark ? `(${savedAddr.landmark})` : null
          ]
            .filter(Boolean)
            .join(', ');
        }
      }
    }
    if (!resolvedAddress) {
      throw new AppError('Yetkazib berish manzilini kiriting.', 400);
    }
  }

  if (finalOrderType === 'pickup' && !branchName) {
    throw new AppError('Olib ketish uchun filialni tanlang.', 400);
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw new AppError('Savat bo\'sh. Kamida bitta mahsulot tanlang.', 400);
  }

  const productIds = [...new Set(items.map((i) => Number(i.productId)).filter(Boolean))];
  if (productIds.length === 0) {
    throw new AppError('Mahsulotlar noto\'g\'ri ko\'rsatilgan.', 400);
  }

  const dbProducts = await Product.findAll({
    where: { id: { [Op.in]: productIds }, isAvailable: true }
  });
  const productMap = new Map(dbProducts.map((p) => [p.id, p]));

  const normalizedItems = [];
  for (const reqItem of items) {
    const prod = productMap.get(Number(reqItem.productId));
    const qty = Number(reqItem.quantity);
    if (!prod) {
      throw new AppError(`Tanlangan mahsulot (ID: ${reqItem.productId}) hozirda mavjud emas.`, 400);
    }
    if (!Number.isInteger(qty) || qty < 1 || qty > 99) {
      throw new AppError('Mahsulot soni 1 dan 99 gacha bo\'lishi kerak.', 400);
    }
    normalizedItems.push({
      productId: prod.id,
      productNameUz: prod.nameUz,
      productNameRu: prod.nameRu,
      productImage: prod.imageUrl,
      unitPrice: prod.price,
      quantity: qty,
      totalPrice: prod.price * qty
    });
  }

  let promotion = null;
  if (promoCode && String(promoCode).trim()) {
    const now = new Date();
    promotion = await Promotion.findOne({
      where: {
        promoCode: String(promoCode).trim().toUpperCase(),
        isActive: true,
        [Op.and]: [
          { [Op.or]: [{ startsAt: null }, { startsAt: { [Op.lte]: now } }] },
          { [Op.or]: [{ endsAt: null }, { endsAt: { [Op.gte]: now } }] }
        ]
      }
    });
    if (!promotion) {
      throw new AppError('Kiritilgan promo kod yaroqsiz yoki muddati tugagan.', 400);
    }
  }

  const totals = calculateOrderTotals({
    items: normalizedItems,
    orderType: finalOrderType,
    promotion,
    deliveryFeeConfig: process.env.DELIVERY_FEE,
    freeThresholdConfig: process.env.FREE_DELIVERY_THRESHOLD
  });

  const createdOrder = await sequelize.transaction(async (t) => {
    let orderNumber = generateOrderNumber();
    const exists = await Order.findOne({ where: { orderNumber }, transaction: t });
    if (exists) {
      orderNumber = `${generateOrderNumber()}-${Math.floor(Math.random() * 90 + 10)}`;
    }

    const order = await Order.create(
      {
        orderNumber,
        userId: req.user ? req.user.id : null,
        addressId: resolvedAddressId,
        promotionId: promotion && totals.discountAmount > 0 ? promotion.id : null,
        customerName: String(customerName).trim(),
        customerPhone: normalizedPhone,
        deliveryAddress: finalOrderType === 'delivery' ? resolvedAddress : null,
        branchName: finalOrderType === 'pickup' ? String(branchName).trim() : null,
        orderType: finalOrderType,
        paymentType: finalPaymentType,
        status: 'new',
        subtotalAmount: totals.subtotalAmount,
        deliveryFee: totals.deliveryFee,
        discountAmount: totals.discountAmount,
        totalAmount: totals.totalAmount,
        promoCode: promotion && totals.discountAmount > 0 ? promotion.promoCode : null,
        comment: comment ? String(comment).trim() : null
      },
      { transaction: t }
    );

    await OrderItem.bulkCreate(
      normalizedItems.map((item) => ({
        orderId: order.id,
        ...item
      })),
      { transaction: t }
    );

    return order;
  });

  const fullOrder = await Order.findByPk(createdOrder.id, {
    include: [{ model: OrderItem, as: 'items' }]
  });

  res.status(201).json({
    success: true,
    message: 'Buyurtmangiz muvaffaqiyatli qabul qilindi!',
    data: fullOrder
  });
});

exports.getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.findAll({
    where: { userId: req.user.id },
    include: [{ model: OrderItem, as: 'items' }],
    order: [['createdAt', 'DESC']]
  });

  res.json({
    success: true,
    data: orders
  });
});

exports.getOrderByNumber = asyncHandler(async (req, res) => {
  const orderNumber = String(req.params.orderNumber || '').trim().toUpperCase();
  const phone = req.query.phone ? normalizePhone(req.query.phone) : null;

  const order = await Order.findOne({
    where: { orderNumber },
    include: [{ model: OrderItem, as: 'items' }]
  });

  if (!order) {
    throw new AppError('Buyurtma topilmadi.', 404);
  }

  const isOwner = req.user && order.userId === req.user.id;
  const phoneMatches = phone && order.customerPhone === phone;

  if (!isOwner && !phoneMatches) {
    throw new AppError('Buyurtma ma\'lumotlarini ko\'rish uchun telefon raqamini tasdiqlang.', 403);
  }

  res.json({
    success: true,
    data: order
  });
});

exports.cancelMyOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({
    where: { id: req.params.id, userId: req.user.id }
  });

  if (!order) {
    throw new AppError('Buyurtma topilmadi.', 404);
  }

  if (!['new', 'accepted'].includes(order.status)) {
    throw new AppError('Tayyorlanayotgan yoki yo\'ldagi buyurtmani bekor qilib bo\'lmaydi.', 400);
  }

  order.status = 'cancelled';
  await order.save();

  res.json({
    success: true,
    message: 'Buyurtma bekor qilindi.',
    data: order
  });
});
