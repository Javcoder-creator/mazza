const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Banner = sequelize.define(
  'Banner',
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
    subtitleUz: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'subtitle_uz'
    },
    subtitleRu: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'subtitle_ru'
    },
    ctaTextUz: {
      type: DataTypes.STRING(60),
      allowNull: false,
      defaultValue: 'Buyurtma berish',
      field: 'cta_text_uz'
    },
    ctaTextRu: {
      type: DataTypes.STRING(60),
      allowNull: false,
      defaultValue: 'Заказать',
      field: 'cta_text_ru'
    },
    imageUrl: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'image_url'
    },
    linkType: {
      type: DataTypes.ENUM('promotion', 'product', 'category', 'url'),
      allowNull: false,
      defaultValue: 'category',
      field: 'link_type'
    },
    promotionId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'promotion_id'
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'product_id'
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'category_id'
    },
    targetUrl: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'target_url'
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'sort_order'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active'
    }
  },
  {
    tableName: 'banners'
  }
);

module.exports = Banner;
