const express = require('express');
const bannerController = require('../controllers/bannerController');

const router = express.Router();

router.get('/', bannerController.listPublicBanners);

module.exports = router;
