const express = require('express');
const promotionController = require('../controllers/promotionController');

const router = express.Router();

router.get('/', promotionController.listPublicPromotions);
router.post('/validate', promotionController.validatePromoCode);

module.exports = router;
