require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./models');
const { testDatabaseConnection } = require('./config/database');
const { seedDatabaseIfEmpty } = require('./database/seed');

const PORT = Number(process.env.PORT) || 5000;

async function startServer() {
  try {
    await testDatabaseConnection();
    console.log('PostgreSQL bilan aloqa muvaffaqiyatli o\'rnatildi.');

    await sequelize.sync();
    console.log('PostgreSQL jadvallari sinxronizatsiya qilindi.');

    await seedDatabaseIfEmpty();

    app.listen(PORT, () => {
      console.log(`MAZZA platformasi ishga tushdi: http://localhost:${PORT}`);
      console.log(`Admin panel: http://localhost:${PORT}/admin`);
    });
  } catch (error) {
    console.error('Serverni ishga tushirishda xatolik:', error.message);
    process.exit(1);
  }
}

startServer();
