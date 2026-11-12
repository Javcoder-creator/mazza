const express = require('express');
const adminAuthController = require('../controllers/adminAuthController');
const adminController = require('../controllers/adminController');
const categoryController = require('../controllers/categoryController');
const productController = require('../controllers/productController');
const bannerController = require('../controllers/bannerController');
const promotionController = require('../controllers/promotionController');
const { protectAdmin } = require('../middleware/adminMiddleware');
const { productUpload, bannerUpload, categoryUpload } = require('../config/upload');

const router = express.Router();

// Admin Authentication
router.post('/login', adminAuthController.login);

// Protected Admin Routes
router.use(protectAdmin);

router.get('/me', adminAuthController.getProfile);
router.get('/dashboard', adminController.getDashboardStats);

// Categories CRUD
router.get('/categories', categoryController.listAdminCategories);
router.post('/categories', categoryUpload.single('icon'), categoryController.createCategory);
router.put('/categories/:id', categoryUpload.single('icon'), categoryController.updateCategory);
router.delete('/categories/:id', categoryController.deleteCategory);

// Products CRUD + Images
router.get('/products', (req, res, next) => {
  req.query.includeUnavailable = 'true';
  return productController.listProducts(req, res, next);
});
router.post('/products', productUpload.array('images', 6), productController.createProduct);
router.put('/products/:id', productUpload.array('images', 6), productController.updateProduct);
router.delete('/products/:id', productController.deleteProduct);
router.post('/products/:id/images', productUpload.array('images', 6), productController.addProductImages);
router.delete('/products/:id/images/:imageId', productController.deleteProductImage);

// Banners CRUD
router.get('/banners', bannerController.listAdminBanners);
router.post('/banners', bannerUpload.single('image'), bannerController.createBanner);
router.put('/banners/:id', bannerUpload.single('image'), bannerController.updateBanner);
router.delete('/banners/:id', bannerController.deleteBanner);

// Promotions CRUD
router.get('/promotions', promotionController.listAdminPromotions);
router.post('/promotions', bannerUpload.single('image'), promotionController.createPromotion);
router.put('/promotions/:id', bannerUpload.single('image'), promotionController.updatePromotion);
router.delete('/promotions/:id', promotionController.deletePromotion);

// Orders Management
router.get('/orders', adminController.listAllOrders);
router.patch('/orders/:id/status', adminController.updateOrderStatus);

// Users Management
router.get('/users', adminController.listUsers);
router.patch('/users/:id/status', adminController.toggleUserStatus);

module.exports = router;
