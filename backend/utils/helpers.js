class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[ʻ’'`"]/g, '')
    .replace(/[^a-z0-9\s-]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function normalizePhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length === 9) {
    return `+998${digits}`;
  }
  if (digits.length === 12 && digits.startsWith('998')) {
    return `+${digits}`;
  }
  if (digits.length > 0 && String(phone).trim().startsWith('+')) {
    return `+${digits}`;
  }
  return digits ? `+${digits}` : '';
}

function generateOrderNumber() {
  const now = new Date();
  const yymmdd = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(
    now.getDate()
  ).padStart(2, '0')}`;
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `MZZ-${yymmdd}-${rand}`;
}

function calculateOrderTotals({ items, orderType, promotion, deliveryFeeConfig, freeThresholdConfig }) {
  const deliveryBase = Number.isFinite(Number(deliveryFeeConfig)) ? Number(deliveryFeeConfig) : 15000;
  const freeThreshold = Number.isFinite(Number(freeThresholdConfig)) ? Number(freeThresholdConfig) : 100000;

  const subtotalAmount = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  let discountAmount = 0;
  if (promotion && promotion.isActive) {
    const minOrder = Number(promotion.minOrderAmount || 0);
    if (subtotalAmount >= minOrder) {
      if (promotion.discountPercent > 0) {
        discountAmount = Math.round((subtotalAmount * promotion.discountPercent) / 100);
      } else if (promotion.discountAmount > 0) {
        discountAmount = Math.min(subtotalAmount, Number(promotion.discountAmount));
      }
    }
  }

  const afterDiscount = Math.max(0, subtotalAmount - discountAmount);
  const deliveryFee =
    orderType === 'pickup' || afterDiscount === 0 || afterDiscount >= freeThreshold ? 0 : deliveryBase;

  const totalAmount = afterDiscount + deliveryFee;

  return {
    subtotalAmount,
    discountAmount,
    deliveryFee,
    totalAmount
  };
}

module.exports = {
  AppError,
  asyncHandler,
  slugify,
  normalizePhone,
  generateOrderNumber,
  calculateOrderTotals
};
