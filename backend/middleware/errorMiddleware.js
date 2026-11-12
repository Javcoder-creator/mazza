const multer = require('multer');

function notFound(req, res, _next) {
  res.status(404).json({
    success: false,
    message: `So'ralgan yo'l topilmadi: ${req.originalUrl}`
  });
}

function errorHandler(err, _req, res, _next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Serverda ichki xatolik yuz berdi.';

  if (err instanceof multer.MulterError) {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'Fayl hajmi 5 MB dan oshmasligi kerak.';
    } else {
      message = `Fayl yuklashda xatolik: ${err.message}`;
    }
  } else if (err.name === 'SequelizeValidationError') {
    statusCode = 400;
    message = err.errors.map((e) => e.message).join('; ');
  } else if (err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 409;
    const field = err.errors && err.errors[0] ? err.errors[0].path : 'qiymat';
    message = `Bunday ${field} allaqachon mavjud.`;
  } else if (err.name === 'SequelizeForeignKeyConstraintError') {
    statusCode = 400;
    message = 'Bog\'langan ma\'lumot mavjudligi sababli ushbu amalni bajarib bo\'lmadi.';
  }

  if (process.env.NODE_ENV !== 'test' && statusCode >= 500) {
    console.error('Server Error:', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && statusCode >= 500 ? { stack: err.stack } : {})
  });
}

module.exports = {
  notFound,
  errorHandler
};
