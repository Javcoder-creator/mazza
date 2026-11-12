const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const OrderItem = sequelize.define(
  'OrderItem',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'order_id'
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'product_id'
    },
    productNameUz: {
      type: DataTypes.STRING(160),
      allowNull: false,
      field: 'product_name_uz'
    },
    productNameRu: {
      type: DataTypes.STRING(160),
      allowNull: false,
      field: 'product_name_ru'
    },
    productImage: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'product_image'
    },
    unitPrice: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'unit_price'
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1
      }
    },
    totalPrice: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'total_price'
    }
  },
  {
    tableName: 'order_items'
  }
);

module.exports = OrderItem;
