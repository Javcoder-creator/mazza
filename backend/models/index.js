const { sequelize } = require('../config/database');
const User = require('./User');
const Admin = require('./Admin');
const Category = require('./Category');
const Product = require('./Product');
const ProductImage = require('./ProductImage');
const Address = require('./Address');
const Promotion = require('./Promotion');
const Banner = require('./Banner');
const Order = require('./Order');
const OrderItem = require('./OrderItem');

// Category <-> Product
Category.hasMany(Product, { foreignKey: 'categoryId', as: 'products', onDelete: 'RESTRICT' });
Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

// Product <-> ProductImage
Product.hasMany(ProductImage, { foreignKey: 'productId', as: 'images', onDelete: 'CASCADE' });
ProductImage.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

// User <-> Address
User.hasMany(Address, { foreignKey: 'userId', as: 'addresses', onDelete: 'CASCADE' });
Address.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User <-> Order
User.hasMany(Order, { foreignKey: 'userId', as: 'orders', onDelete: 'SET NULL' });
Order.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Address <-> Order
Address.hasMany(Order, { foreignKey: 'addressId', as: 'orders', onDelete: 'SET NULL' });
Order.belongsTo(Address, { foreignKey: 'addressId', as: 'savedAddress' });

// Promotion <-> Order
Promotion.hasMany(Order, { foreignKey: 'promotionId', as: 'orders', onDelete: 'SET NULL' });
Order.belongsTo(Promotion, { foreignKey: 'promotionId', as: 'promotion' });

// Order <-> OrderItem
Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items', onDelete: 'CASCADE' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

// Product <-> OrderItem
Product.hasMany(OrderItem, { foreignKey: 'productId', as: 'orderItems', onDelete: 'SET NULL' });
OrderItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

// Promotion <-> Category / Product
Category.hasMany(Promotion, { foreignKey: 'categoryId', as: 'promotions', onDelete: 'SET NULL' });
Promotion.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

Product.hasMany(Promotion, { foreignKey: 'productId', as: 'promotions', onDelete: 'SET NULL' });
Promotion.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

// Banner <-> Promotion / Product / Category
Promotion.hasMany(Banner, { foreignKey: 'promotionId', as: 'banners', onDelete: 'SET NULL' });
Banner.belongsTo(Promotion, { foreignKey: 'promotionId', as: 'promotion' });

Product.hasMany(Banner, { foreignKey: 'productId', as: 'banners', onDelete: 'SET NULL' });
Banner.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

Category.hasMany(Banner, { foreignKey: 'categoryId', as: 'banners', onDelete: 'SET NULL' });
Banner.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

module.exports = {
  sequelize,
  User,
  Admin,
  Category,
  Product,
  ProductImage,
  Address,
  Promotion,
  Banner,
  Order,
  OrderItem
};
