const express = require('express');
const productController = require('../controllers/productController');

const router = express.Router();

router.get('/', productController.listProducts);
router.get('/autocomplete', productController.searchAutocomplete);
router.get('/:idOrSlug', productController.getProductDetail);

module.exports = router;
