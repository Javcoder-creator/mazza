const express = require('express');
const addressController = require('../controllers/addressController');
const { protectUser } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protectUser);
router.get('/', addressController.listMyAddresses);
router.post('/', addressController.createAddress);
router.put('/:id', addressController.updateAddress);
router.delete('/:id', addressController.deleteAddress);

module.exports = router;
