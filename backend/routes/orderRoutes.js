const express = require('express');
const orderController = require('../controllers/orderController');
const { protectUser, optionalUser } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', optionalUser, orderController.createOrder);
router.get('/my', protectUser, orderController.getMyOrders);
router.get('/track/:orderNumber', optionalUser, orderController.getOrderByNumber);
router.post('/:id/cancel', protectUser, orderController.cancelMyOrder);

module.exports = router;
