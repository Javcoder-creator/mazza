const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ORDER_STATUSES = ['new', 'accepted', 'preparing', 'delivering', 'completed', 'cancelled'];
const ORDER_TYPES = ['delivery', 'pickup'];
const PAYMENT_TYPES = ['cash', 'card', 'payme', 'click'];

const Order = sequelize.define(
  'Order',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    orderNumber: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true,
      field: 'order_number'
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'user_id'
    },
    addressId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'address_id'
    },
    promotionId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'promotion_id'
    },
    customerName: {
      type: DataTypes.STRING(120),
      allowNull: false,
      field: 'customer_name'
    },
    customerPhone: {
      type: DataTypes.STRING(30),
      allowNull: false,
      field: 'customer_phone'
    },
    deliveryAddress: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'delivery_address'
    },
    branchName: {
      type: DataTypes.STRING(120),
      allowNull: true,
      field: 'branch_name'
    },
    orderType: {
      type: DataTypes.ENUM(...ORDER_TYPES),
      allowNull: false,
      defaultValue: 'delivery',
      field: 'order_type'
    },
    paymentType: {
      type: DataTypes.ENUM(...PAYMENT_TYPES),
      allowNull: false,
      defaultValue: 'cash',
      field: 'payment_type'
    },
    status: {
      type: DataTypes.ENUM(...ORDER_STATUSES),
      allowNull: false,
      defaultValue: 'new'
    },
    subtotalAmount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'subtotal_amount'
    },
    deliveryFee: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'delivery_fee'
    },
    discountAmount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'discount_amount'
    },
    totalAmount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'total_amount'
    },
    promoCode: {
      type: DataTypes.STRING(40),
      allowNull: true,
      field: 'promo_code'
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  },
  {
    tableName: 'orders'
  }
);

Order.ORDER_STATUSES = ORDER_STATUSES;
Order.ORDER_TYPES = ORDER_TYPES;
Order.PAYMENT_TYPES = PAYMENT_TYPES;

module.exports = Order;
