require('dotenv').config();
const { Client } = require('pg');
const { sequelize } = require('../models');
const { seedDatabase } = require('./seed');

async function initDatabase() {
  const dbName = process.env.DB_NAME || 'mazza_food_db';
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: 'postgres'
  });

  await client.connect();
  const existsRes = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
  if (existsRes.rowCount === 0) {
    const safeDbName = dbName.replace(/[^a-zA-Z0-9_]/g, '');
    await client.query(`CREATE DATABASE "${safeDbName}"`);
    console.log(`PostgreSQL bazasi yaratildi: ${safeDbName}`);
  } else {
    console.log(`PostgreSQL bazasi mavjud: ${dbName}`);
  }
  await client.end();

  await sequelize.authenticate();
  await sequelize.sync({ alter: false });
  console.log('Barcha 10 ta jadval yaratildi / sinxronizatsiya qilindi.');

  await seedDatabase({ force: false });
  console.log('Baza tayyor!');
}

initDatabase()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Bazani sozlashda xatolik:', err.message);
    process.exit(1);
  });
