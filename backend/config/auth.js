require('dotenv').config();

module.exports = {
  jwtSecret: process.env.JWT_SECRET || 'mazza_dev_jwt_secret_2026_uzbekistan_fast_food',
  jwtAdminSecret: process.env.JWT_ADMIN_SECRET || 'mazza_dev_admin_jwt_secret_2026_uzbekistan_fast_food',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  jwtAdminExpiresIn: process.env.JWT_ADMIN_EXPIRES_IN || '24h',
  saltRounds: Number(process.env.BCRYPT_SALT_ROUNDS) || 10
};
