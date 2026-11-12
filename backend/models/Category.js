const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Category = sequelize.define(
  'Category',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    slug: {
      type: DataTypes.STRING(80),
      allowNull: false,
      unique: true
    },
    nameUz: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'name_uz'
    },
    nameRu: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'name_ru'
    },
    descriptionUz: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'description_uz'
    },
    descriptionRu: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'description_ru'
    },
    icon: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'sort_order'
    },
    isVirtual: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_virtual'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active'
    }
  },
  {
    tableName: 'categories'
  }
);

module.exports = Category;
