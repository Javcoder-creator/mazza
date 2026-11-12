const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Address = sequelize.define(
  'Address',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id'
    },
    label: {
      type: DataTypes.STRING(60),
      allowNull: false
    },
    streetAddress: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'street_address'
    },
    apartment: {
      type: DataTypes.STRING(60),
      allowNull: true
    },
    entrance: {
      type: DataTypes.STRING(30),
      allowNull: true
    },
    floor: {
      type: DataTypes.STRING(30),
      allowNull: true
    },
    landmark: {
      type: DataTypes.STRING(150),
      allowNull: true
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_default'
    }
  },
  {
    tableName: 'addresses'
  }
);

module.exports = Address;
