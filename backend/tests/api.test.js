const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const app = require('../app');
const {
  slugify,
  normalizePhone,
  generateOrderNumber,
  calculateOrderTotals
} = require('../utils/helpers');
const models = require('../models');

function startTestServer() {
  return new Promise((resolve) => {
    const server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ server, baseUrl: `http://127.0.0.1:${port}` });
    });
  });
}

test('Helpers: slugify, normalizePhone, generateOrderNumber', () => {
  assert.equal(slugify("Mol go'shtli Lavash L"), 'mol-goshtli-lavash-l');
  assert.equal(normalizePhone('90 123 45 67'), '+998901234567');
  assert.equal(normalizePhone('+998 (90) 123-45-67'), '+998901234567');
  assert.match(generateOrderNumber(), /^MZZ-\d{6}-\d{4}$/);
});

test('Helpers: calculateOrderTotals computes delivery, free threshold, and promo discounts', () => {
  const items = [
    { unitPrice: 38000, quantity: 2 } // 76,000
  ];

  // Standard delivery under threshold (100,000)
  const std = calculateOrderTotals({
    items,
    orderType: 'delivery',
    promotion: null,
    deliveryFeeConfig: 15000,
    freeThresholdConfig: 100000
  });
  assert.equal(std.subtotalAmount, 76000);
  assert.equal(std.deliveryFee, 15000);
  assert.equal(std.totalAmount, 91000);

  // Pickup is always free delivery
  const pickup = calculateOrderTotals({
    items,
    orderType: 'pickup',
    promotion: null,
    deliveryFeeConfig: 15000,
    freeThresholdConfig: 100000
  });
  assert.equal(pickup.deliveryFee, 0);
  assert.equal(pickup.totalAmount, 76000);

  // Free delivery when >= 100,000
  const freeDel = calculateOrderTotals({
    items: [{ unitPrice: 50000, quantity: 2 }],
    orderType: 'delivery',
    promotion: null,
    deliveryFeeConfig: 15000,
    freeThresholdConfig: 100000
  });
  assert.equal(freeDel.deliveryFee, 0);
  assert.equal(freeDel.totalAmount, 100000);

  // Percent promotion
  const pctPromo = calculateOrderTotals({
    items: [{ unitPrice: 50000, quantity: 2 }],
    orderType: 'delivery',
    promotion: { isActive: true, discountPercent: 15, discountAmount: 0, minOrderAmount: 40000 },
    deliveryFeeConfig: 15000,
    freeThresholdConfig: 100000
  });
  assert.equal(pctPromo.discountAmount, 15000);
  assert.equal(pctPromo.deliveryFee, 15000); // 85,000 after discount < 100,000
  assert.equal(pctPromo.totalAmount, 100000);
});

test('Models: all 10 PostgreSQL tables and relationships are registered', () => {
  const expectedModels = [
    'User',
    'Admin',
    'Category',
    'Product',
    'ProductImage',
    'Address',
    'Promotion',
    'Banner',
    'Order',
    'OrderItem'
  ];
  for (const name of expectedModels) {
    assert.ok(models[name], `Missing Sequelize model: ${name}`);
  }
  assert.ok(models.Category.associations.products);
  assert.ok(models.Product.associations.images);
  assert.ok(models.User.associations.addresses);
  assert.ok(models.User.associations.orders);
  assert.ok(models.Order.associations.items);
  assert.ok(models.Banner.associations.promotion);
});

test('HTTP API: health, info, static frontend, and auth guards work without DB', async () => {
  const { server, baseUrl } = await startTestServer();
  try {
    const healthRes = await fetch(`${baseUrl}/api/health`);
    assert.equal(healthRes.status, 200);
    const healthJson = await healthRes.json();
    assert.equal(healthJson.success, true);

    const infoRes = await fetch(`${baseUrl}/api/info`);
    assert.equal(infoRes.status, 200);
    const infoJson = await infoRes.json();
    assert.equal(infoJson.data.brand.name, 'MAZZA');
    assert.ok(infoJson.data.branches.length >= 3);
    assert.ok(infoJson.data.vacancies.length >= 3);

    const homeRes = await fetch(`${baseUrl}/`);
    assert.equal(homeRes.status, 200);
    const homeHtml = await homeRes.text();
    assert.match(homeHtml, /MAZZA/);

    const adminPageRes = await fetch(`${baseUrl}/admin`);
    assert.equal(adminPageRes.status, 200);
    const adminHtml = await adminPageRes.text();
    assert.match(adminHtml, /MAZZA ADMIN/);

    // Protected endpoints reject unauthenticated requests
    const userMeRes = await fetch(`${baseUrl}/api/auth/me`);
    assert.equal(userMeRes.status, 401);

    const adminDashRes = await fetch(`${baseUrl}/api/admin/dashboard`);
    assert.equal(adminDashRes.status, 401);

    // Unknown route returns 404 JSON
    const notFoundRes = await fetch(`${baseUrl}/api/unknown-endpoint`);
    assert.equal(notFoundRes.status, 404);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('Database schema SQL file exists and defines all 10 tables', () => {
  const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');
  const tables = [
    'users',
    'admins',
    'categories',
    'products',
    'product_images',
    'addresses',
    'promotions',
    'banners',
    'orders',
    'order_items'
  ];
  for (const tbl of tables) {
    assert.match(sql, new RegExp(`CREATE TABLE IF NOT EXISTS ${tbl}\\b`), `Missing table in schema.sql: ${tbl}`);
  }
});

test('Seed asset paths exist on disk in backend/uploads', () => {
  const seedPath = path.join(__dirname, '..', 'database', 'seed.js');
  const seedCode = fs.readFileSync(seedPath, 'utf8');
  const uploadMatches = [...seedCode.matchAll(/\/uploads\/[a-zA-Z0-9/_.-]+/g)].map((m) => m[0]);
  assert.ok(uploadMatches.length > 0);
  for (const relUrl of uploadMatches) {
    const absPath = path.join(__dirname, '..', relUrl.replace(/^\//, ''));
    assert.ok(fs.existsSync(absPath), `Missing seeded asset file: ${absPath}`);
  }
});
