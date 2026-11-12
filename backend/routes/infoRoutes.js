const express = require('express');
const infoController = require('../controllers/infoController');

const router = express.Router();

router.get('/', infoController.getPublicInfo);

module.exports = router;
