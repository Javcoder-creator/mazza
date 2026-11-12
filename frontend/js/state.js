function safeParseJSON(raw, fallback) {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch (_e) {
    return fallback;
  }
}

window.MAZZA_STATE = {
  lang: localStorage.getItem('mazza_lang') || 'uz',
  categories: [],
  products: [],
  allProductsCache: [],
  banners: [],
  promotions: [],
  info: {
    brand: {
      name: 'MAZZA',
      phone: '+998 71 200 70 70',
      deliveryFee: 15000,
      freeDeliveryThreshold: 100000
    },
    branches: [],
    vacancies: [],
    about: {}
  },
  activeCategorySlug: 'all',
  kidsMode: false,
  searchQuery: '',
  cart: safeParseJSON(localStorage.getItem('mazza_cart'), []),
  appliedPromo: safeParseJSON(localStorage.getItem('mazza_promo'), null),
  user: null,
  addresses: [],
  myOrders: []
};

function saveCart() {
  localStorage.setItem('mazza_cart', JSON.stringify(window.MAZZA_STATE.cart));
}

function savePromo() {
  if (window.MAZZA_STATE.appliedPromo) {
    localStorage.setItem('mazza_promo', JSON.stringify(window.MAZZA_STATE.appliedPromo));
  } else {
    localStorage.removeItem('mazza_promo');
  }
}

function getCartItemQuantity(productId) {
  const item = window.MAZZA_STATE.cart.find((c) => c.productId === Number(productId));
  return item ? item.quantity : 0;
}

function addToCart(product, qty = 1) {
  const existing = window.MAZZA_STATE.cart.find((c) => c.productId === product.id);
  if (existing) {
    existing.quantity = Math.min(99, existing.quantity + qty);
    existing.price = product.price;
    existing.nameUz = product.nameUz;
    existing.nameRu = product.nameRu;
    existing.imageUrl = product.imageUrl;
  } else {
    window.MAZZA_STATE.cart.push({
      productId: product.id,
      nameUz: product.nameUz,
      nameRu: product.nameRu,
      price: product.price,
      imageUrl: product.imageUrl,
      volumeUz: product.volumeUz,
      volumeRu: product.volumeRu,
      quantity: Math.max(1, Math.min(99, qty))
    });
  }
  saveCart();
}

function updateCartQuantity(productId, deltaOrExact, exact = false) {
  const idx = window.MAZZA_STATE.cart.findIndex((c) => c.productId === Number(productId));
  if (idx === -1) return;

  const nextQty = exact ? deltaOrExact : window.MAZZA_STATE.cart[idx].quantity + deltaOrExact;
  if (nextQty <= 0) {
    window.MAZZA_STATE.cart.splice(idx, 1);
  } else {
    window.MAZZA_STATE.cart[idx].quantity = Math.min(99, nextQty);
  }
  saveCart();
}

function removeFromCart(productId) {
  window.MAZZA_STATE.cart = window.MAZZA_STATE.cart.filter((c) => c.productId !== Number(productId));
  saveCart();
}

function clearCart() {
  window.MAZZA_STATE.cart = [];
  window.MAZZA_STATE.appliedPromo = null;
  saveCart();
  savePromo();
}

function getCartTotals(orderType = 'delivery') {
  const cart = window.MAZZA_STATE.cart;
  const brand = window.MAZZA_STATE.info.brand || {};
  const deliveryBase = Number(brand.deliveryFee ?? 15000);
  const freeThreshold = Number(brand.freeDeliveryThreshold ?? 100000);

  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  let discount = 0;
  const promo = window.MAZZA_STATE.appliedPromo;
  if (promo && subtotal >= Number(promo.minOrderAmount || 0)) {
    if (promo.discountPercent > 0) {
      discount = Math.round((subtotal * promo.discountPercent) / 100);
    } else if (promo.discountAmount > 0) {
      discount = Math.min(subtotal, Number(promo.discountAmount));
    }
  }

  const afterDiscount = Math.max(0, subtotal - discount);
  const deliveryFee =
    orderType === 'pickup' || afterDiscount === 0 || afterDiscount >= freeThreshold ? 0 : deliveryBase;

  const total = afterDiscount + deliveryFee;
  const remainingForFreeDelivery = Math.max(0, freeThreshold - afterDiscount);

  return {
    count,
    subtotal,
    discount,
    deliveryFee,
    total,
    freeThreshold,
    remainingForFreeDelivery
  };
}

window.MAZZA_STORE = {
  saveCart,
  savePromo,
  getCartItemQuantity,
  addToCart,
  updateCartQuantity,
  removeFromCart,
  clearCart,
  getCartTotals
};
