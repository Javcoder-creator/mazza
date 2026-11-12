const path = require('path');
const fs = require('fs');
const multer = require('multer');

const UPLOAD_ROOT = path.join(__dirname, '..', 'uploads');
const UPLOAD_DIRS = {
  products: path.join(UPLOAD_ROOT, 'products'),
  banners: path.join(UPLOAD_ROOT, 'banners'),
  categories: path.join(UPLOAD_ROOT, 'categories')
};

Object.values(UPLOAD_DIRS).forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

function createStorage(subFolder) {
  const destinationDir = UPLOAD_DIRS[subFolder] || UPLOAD_DIRS.products;

  return multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, destinationDir);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.png';
      const safeBase = path
        .basename(file.originalname, ext)
        .toLowerCase()
        .replace(/[^a-z0-9-_]/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 40) || 'image';
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
      cb(null, `${safeBase}-${uniqueSuffix}${ext}`);
    }
  });
}

function imageFileFilter(_req, file, cb) {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
  if (allowedMimes.includes(file.mimetype)) {
    return cb(null, true);
  }
  const error = new Error('Faqat rasm fayllari (JPG, PNG, WEBP, GIF, SVG) yuklanishi mumkin.');
  error.statusCode = 400;
  return cb(error, false);
}

function createUploader(subFolder) {
  return multer({
    storage: createStorage(subFolder),
    fileFilter: imageFileFilter,
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB max
    }
  });
}

module.exports = {
  UPLOAD_ROOT,
  UPLOAD_DIRS,
  productUpload: createUploader('products'),
  bannerUpload: createUploader('banners'),
  categoryUpload: createUploader('categories')
};
