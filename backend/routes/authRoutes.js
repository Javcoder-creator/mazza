const express = require('express');
const authController = require('../controllers/authController');
const { protectUser } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', protectUser, authController.getProfile);
router.put('/me', protectUser, authController.updateProfile);
router.put('/change-password', protectUser, authController.changePassword);

module.exports = router;
