const API_BASE = '/api';

async function apiRequest(endpoint, { method = 'GET', body = null, tokenType = 'user', isFormData = false } = {}) {
  const headers = {};
  const tokenKey = tokenType === 'admin' ? 'mazza_admin_token' : 'mazza_user_token';
  const token = localStorage.getItem(tokenKey);

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (!isFormData && body !== null) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: body === null ? undefined : isFormData ? body : JSON.stringify(body)
  });

  const payload = await response.json().catch(() => ({
    success: false,
    message: 'Server javobini o\'qishda xatolik.'
  }));

  if (!response.ok || payload.success === false) {
    const err = new Error(payload.message || `HTTP ${response.status}`);
    err.status = response.status;
    err.payload = payload;
    throw err;
  }

  return payload;
}

window.MAZZA_API = {
  // Public
  getInfo: () => apiRequest('/info'),
  getCategories: () => apiRequest('/categories'),
  getBanners: () => apiRequest('/banners'),
  getPromotions: () => apiRequest('/promotions'),
  validatePromo: (code, subtotal) =>
    apiRequest('/promotions/validate', { method: 'POST', body: { code, subtotal } }),
  getProducts: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') query.append(k, v);
    });
    const qs = query.toString();
    return apiRequest(`/products${qs ? `?${qs}` : ''}`);
  },
  autocomplete: (q) => apiRequest(`/products/autocomplete?q=${encodeURIComponent(q)}`),
  getProductDetail: (idOrSlug) => apiRequest(`/products/${encodeURIComponent(idOrSlug)}`),

  // User Auth & Profile
  register: (data) => apiRequest('/auth/register', { method: 'POST', body: data }),
  login: (data) => apiRequest('/auth/login', { method: 'POST', body: data }),
  getProfile: () => apiRequest('/auth/me'),
  updateProfile: (data) => apiRequest('/auth/me', { method: 'PUT', body: data }),
  changePassword: (data) => apiRequest('/auth/change-password', { method: 'PUT', body: data }),

  // Addresses
  getAddresses: () => apiRequest('/addresses'),
  createAddress: (data) => apiRequest('/addresses', { method: 'POST', body: data }),
  updateAddress: (id, data) => apiRequest(`/addresses/${id}`, { method: 'PUT', body: data }),
  deleteAddress: (id) => apiRequest(`/addresses/${id}`, { method: 'DELETE' }),

  // Orders
  createOrder: (data) => apiRequest('/orders', { method: 'POST', body: data }),
  getMyOrders: () => apiRequest('/orders/my'),
  trackOrder: (orderNumber, phone) =>
    apiRequest(`/orders/track/${encodeURIComponent(orderNumber)}?phone=${encodeURIComponent(phone || '')}`),
  cancelMyOrder: (id) => apiRequest(`/orders/${id}/cancel`, { method: 'POST' }),

  // Admin
  adminLogin: (data) => apiRequest('/admin/login', { method: 'POST', body: data, tokenType: 'admin' }),
  adminMe: () => apiRequest('/admin/me', { tokenType: 'admin' }),
  adminDashboard: () => apiRequest('/admin/dashboard', { tokenType: 'admin' }),
  adminGetOrders: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest(`/admin/orders${qs ? `?${qs}` : ''}`, { tokenType: 'admin' });
  },
  adminUpdateOrderStatus: (id, status) =>
    apiRequest(`/admin/orders/${id}/status`, { method: 'PATCH', body: { status }, tokenType: 'admin' }),
  adminGetProducts: () => apiRequest('/admin/products', { tokenType: 'admin' }),
  adminCreateProduct: (formData) =>
    apiRequest('/admin/products', { method: 'POST', body: formData, tokenType: 'admin', isFormData: true }),
  adminUpdateProduct: (id, formData) =>
    apiRequest(`/admin/products/${id}`, { method: 'PUT', body: formData, tokenType: 'admin', isFormData: true }),
  adminDeleteProduct: (id) => apiRequest(`/admin/products/${id}`, { method: 'DELETE', tokenType: 'admin' }),
  adminGetCategories: () => apiRequest('/admin/categories', { tokenType: 'admin' }),
  adminCreateCategory: (formData) =>
    apiRequest('/admin/categories', { method: 'POST', body: formData, tokenType: 'admin', isFormData: true }),
  adminUpdateCategory: (id, formData) =>
    apiRequest(`/admin/categories/${id}`, { method: 'PUT', body: formData, tokenType: 'admin', isFormData: true }),
  adminDeleteCategory: (id) => apiRequest(`/admin/categories/${id}`, { method: 'DELETE', tokenType: 'admin' }),
  adminGetBanners: () => apiRequest('/admin/banners', { tokenType: 'admin' }),
  adminCreateBanner: (formData) =>
    apiRequest('/admin/banners', { method: 'POST', body: formData, tokenType: 'admin', isFormData: true }),
  adminUpdateBanner: (id, formData) =>
    apiRequest(`/admin/banners/${id}`, { method: 'PUT', body: formData, tokenType: 'admin', isFormData: true }),
  adminDeleteBanner: (id) => apiRequest(`/admin/banners/${id}`, { method: 'DELETE', tokenType: 'admin' }),
  adminGetPromotions: () => apiRequest('/admin/promotions', { tokenType: 'admin' }),
  adminCreatePromotion: (formData) =>
    apiRequest('/admin/promotions', { method: 'POST', body: formData, tokenType: 'admin', isFormData: true }),
  adminUpdatePromotion: (id, formData) =>
    apiRequest(`/admin/promotions/${id}`, { method: 'PUT', body: formData, tokenType: 'admin', isFormData: true }),
  adminDeletePromotion: (id) => apiRequest(`/admin/promotions/${id}`, { method: 'DELETE', tokenType: 'admin' }),
  adminGetUsers: (search = '') =>
    apiRequest(`/admin/users${search ? `?search=${encodeURIComponent(search)}` : ''}`, { tokenType: 'admin' }),
  adminToggleUserStatus: (id, isActive) =>
    apiRequest(`/admin/users/${id}/status`, { method: 'PATCH', body: { isActive }, tokenType: 'admin' })
};
