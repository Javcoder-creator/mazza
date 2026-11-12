const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Product = sequelize.define(
  'Product',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'category_id'
    },
    slug: {
      type: DataTypes.STRING(140),
      allowNull: false,
      unique: true
    },
    nameUz: {
      type: DataTypes.STRING(160),
      allowNull: false,
      field: 'name_uz'
    },
    nameRu: {
      type: DataTypes.STRING(160),
      allowNull: false,
      field: 'name_ru'
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
    ingredientsUz: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'ingredients_uz'
    },
    ingredientsRu: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'ingredients_ru'
    },
    price: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0
      }
    },
    oldPrice: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'old_price'
    },
    calories: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    volumeUz: {
      type: DataTypes.STRING(60),
      allowNull: false,
      field: 'volume_uz'
    },
    volumeRu: {
      type: DataTypes.STRING(60),
      allowNull: false,
      field: 'volume_ru'
    },
    badgeUz: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'badge_uz'
    },
    badgeRu: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'badge_ru'
    },
    imageUrl: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'image_url'
    },
    isAvailable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_available'
    },
    isNew: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_new'
    },
    isPromo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_promo'
    },
    isKids: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_kids'
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'sort_order'
    }
  },
  {
    tableName: 'products'
  }
);

module.exports = Product;
