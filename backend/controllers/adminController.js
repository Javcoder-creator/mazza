const { Op, fn, col } = require('sequelize');
const { Order, OrderItem, Product, Category, User, Banner, Promotion } = require('../models');
const { AppError, asyncHandler } = require('../utils/helpers');

exports.getDashboardStats = asyncHandler(async (_req, res) => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    totalOrders,
    todayOrders,
    activeOrders,
    totalProducts,
    totalCategories,
    totalUsers,
    activeBanners,
    activePromotions,
    revenueTotalRow,
    revenueTodayRow,
    recentOrders,
    statusBreakdown
  ] = await Promise.all([
    Order.count(),
    Order.count({ where: { createdAt: { [Op.gte]: todayStart } } }),
    Order.count({ where: { status: { [Op.in]: ['new', 'accepted', 'preparing', 'delivering'] } } }),
    Product.count(),
    Category.count(),
    User.count(),
    Banner.count({ where: { isActive: true } }),
    Promotion.count({ where: { isActive: true } }),
    Order.findOne({
      where: { status: { [Op.ne]: 'cancelled' } },
      attributes: [[fn('COALESCE', fn('SUM', col('total_amount')), 0), 'sum']],
      raw: true
    }),
    Order.findOne({
      where: {
        status: { [Op.ne]: 'cancelled' },
        createdAt: { [Op.gte]: todayStart }
      },
      attributes: [[fn('COALESCE', fn('SUM', col('total_amount')), 0), 'sum']],
      raw: true
    }),
    Order.findAll({
      include: [{ model: OrderItem, as: 'items' }],
      order: [['createdAt', 'DESC']],
      limit: 8
    }),
    Order.findAll({
      attributes: ['status', [fn('COUNT', col('id')), 'count']],
      group: ['status'],
      raw: true
    })
  ]);

  res.json({
    success: true,
    data: {
      totalOrders,
      todayOrders,
      activeOrders,
      totalProducts,
      totalCategories,
      totalUsers,
      activeBanners,
      activePromotions,
      totalRevenue: Number(revenueTotalRow?.sum || 0),
      todayRevenue: Number(revenueTodayRow?.sum || 0),
      recentOrders,
      statusBreakdown: statusBreakdown.reduce((acc, row) => {
        acc[row.status] = Number(row.count);
        return acc;
      }, {})
    }
  });
});

exports.listAllOrders = asyncHandler(async (req, res) => {
  const { status, search } = req.query;
  const where = {};

  if (status && status !== 'all') {
    where.status = status;
  }

  if (search && String(search).trim()) {
    const pattern = `%${String(search).trim()}%`;
    where[Op.or] = [
      { orderNumber: { [Op.iLike]: pattern } },
      { customerName: { [Op.iLike]: pattern } },
      { customerPhone: { [Op.iLike]: pattern } }
    ];
  }

  const orders = await Order.findAll({
    where,
    include: [
      { model: OrderItem, as: 'items' },
      { model: User, as: 'user', attributes: ['id', 'fullName', 'phone', 'email'] }
    ],
    order: [['createdAt', 'DESC']]
  });

  res.json({
    success: true,
    data: orders
  });
});

exports.updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!Order.ORDER_STATUSES.includes(status)) {
    throw new AppError(`Noto'g'ri buyurtma holati. Ruxsat etilgan: ${Order.ORDER_STATUSES.join(', ')}`, 400);
  }

  const order = await Order.findByPk(req.params.id, {
    include: [{ model: OrderItem, as: 'items' }]
  });
  if (!order) {
    throw new AppError('Buyurtma topilmadi.', 404);
  }

  order.status = status;
  await order.save();

  res.json({
    success: true,
    message: 'Buyurtma holati yangilandi.',
    data: order
  });
});

exports.listUsers = asyncHandler(async (req, res) => {
  const search = req.query.search ? String(req.query.search).trim() : '';
  const where = search
    ? {
        [Op.or]: [
          { fullName: { [Op.iLike]: `%${search}%` } },
          { phone: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } }
        ]
      }
    : {};

  const users = await User.findAll({
    where,
    attributes: { exclude: ['passwordHash'] },
    order: [['createdAt', 'DESC']]
  });

  const orderCounts = await Order.findAll({
    where: { userId: { [Op.ne]: null } },
    attributes: [
      'userId',
      [fn('COUNT', col('id')), 'ordersCount'],
      [fn('COALESCE', fn('SUM', col('total_amount')), 0), 'totalSpent']
    ],
    group: ['userId'],
    raw: true
  });

  const statsMap = new Map(
    orderCounts.map((row) => [
      Number(row.userId),
      { ordersCount: Number(row.ordersCount), totalSpent: Number(row.totalSpent) }
    ])
  );

  res.json({
    success: true,
    data: users.map((u) => {
      const stat = statsMap.get(u.id) || { ordersCount: 0, totalSpent: 0 };
      return {
        ...u.toJSON(),
        ordersCount: stat.ordersCount,
        totalSpent: stat.totalSpent
      };
    })
  });
});

exports.toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id, {
    attributes: { exclude: ['passwordHash'] }
  });
  if (!user) {
    throw new AppError('Foydalanuvchi topilmadi.', 404);
  }

  user.isActive = req.body.isActive !== undefined ? Boolean(req.body.isActive) : !user.isActive;
  await user.save();

  res.json({
    success: true,
    message: user.isActive ? 'Foydalanuvchi faollashtirildi.' : 'Foydalanuvchi bloklandi.',
    data: user
  });
});
