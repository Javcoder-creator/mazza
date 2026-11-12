const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Promotion = sequelize.define(
  'Promotion',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    titleUz: {
      type: DataTypes.STRING(180),
      allowNull: false,
      field: 'title_uz'
    },
    titleRu: {
      type: DataTypes.STRING(180),
      allowNull: false,
      field: 'title_ru'
    },
    descriptionUz: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'description_uz'
    },
    descriptionRu: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'description_ru'
    },
    promoCode: {
      type: DataTypes.STRING(40),
      allowNull: true,
      unique: true,
      field: 'promo_code'
    },
    discountPercent: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'discount_percent'
    },
    discountAmount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'discount_amount'
    },
    minOrderAmount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'min_order_amount'
    },
    badgeText: {
      type: DataTypes.STRING(40),
      allowNull: true,
      field: 'badge_text'
    },
    imageUrl: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'image_url'
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'category_id'
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'product_id'
    },
    startsAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'starts_at'
    },
    endsAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'ends_at'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active'
    }
  },
  {
    tableName: 'promotions'
  }
);

module.exports = Promotion;
