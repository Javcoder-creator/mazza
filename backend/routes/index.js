const express = require('express');
const authRoutes = require('./authRoutes');
const categoryRoutes = require('./categoryRoutes');
const productRoutes = require('./productRoutes');
const bannerRoutes = require('./bannerRoutes');
const promotionRoutes = require('./promotionRoutes');
const addressRoutes = require('./addressRoutes');
const orderRoutes = require('./orderRoutes');
const adminRoutes = require('./adminRoutes');
const infoRoutes = require('./infoRoutes');

const router = express.Router();

router.get('/health', (_req, res) => {
  res.json({ success: true, status: 'ok', service: 'MAZZA Fast Food API' });
});

router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/banners', bannerRoutes);
router.use('/promotions', promotionRoutes);
router.use('/addresses', addressRoutes);
router.use('/orders', orderRoutes);
router.use('/admin', adminRoutes);
router.use('/info', infoRoutes);

module.exports = router;
