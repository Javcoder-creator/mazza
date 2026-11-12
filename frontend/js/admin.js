(function () {
  const API = window.MAZZA_API;
  const UI = window.MAZZA_UI;
  const { escapeHtml } = UI;

  const ADMIN_STATE = {
    admin: null,
    section: 'dashboard',
    categories: [],
    products: [],
    orders: [],
    promotions: [],
    banners: [],
    users: []
  };

  const ORDER_STATUSES = [
    { value: 'new', label: 'Yangi' },
    { value: 'accepted', label: 'Qabul qilindi' },
    { value: 'preparing', label: 'Tayyorlanmoqda' },
    { value: 'delivering', label: 'Yetkazilmoqda' },
    { value: 'completed', label: 'Yakunlandi' },
    { value: 'cancelled', label: 'Bekor qilindi' }
  ];

  const SECTION_TITLES = {
    dashboard: 'Boshqaruv paneli',
    orders: 'Buyurtmalarni boshqarish',
    products: 'Mahsulotlar katalogi',
    categories: 'Kategoriyalar',
    promotions: 'Aksiyalar va promo kodlar',
    banners: 'Reklama bannerlari',
    users: 'Foydalanuvchilar'
  };

  function openAdminModal(html) {
    document.getElementById('adminModalContent').innerHTML = html;
    document.getElementById('adminModal').classList.remove('hidden');
  }

  function closeAdminModal() {
    document.getElementById('adminModal').classList.add('hidden');
  }

  async function init() {
    bindShellEvents();
    const token = localStorage.getItem('mazza_admin_token');
    if (!token) {
      showLoginScreen();
      return;
    }
    try {
      const res = await API.adminMe();
      ADMIN_STATE.admin = res.data;
      showAdminWorkspace();
    } catch (_err) {
      localStorage.removeItem('mazza_admin_token');
      showLoginScreen();
    }
  }

  function showLoginScreen() {
    document.getElementById('adminLoginScreen').classList.remove('hidden');
    document.getElementById('adminShell').classList.add('hidden');
  }

  async function showAdminWorkspace() {
    document.getElementById('adminLoginScreen').classList.add('hidden');
    document.getElementById('adminShell').classList.remove('hidden');
    document.getElementById('adminNameChip').textContent = ADMIN_STATE.admin.fullName;
    document.getElementById('adminRoleLabel').textContent = ADMIN_STATE.admin.role.toUpperCase();
    await loadSection('dashboard');
  }

  async function loadSection(section) {
    ADMIN_STATE.section = section;
    document.getElementById('adminPageTitle').textContent = SECTION_TITLES[section] || 'Admin';
    document.querySelectorAll('.admin-nav-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-section') === section);
    });
    document.getElementById('adminSidebar').classList.remove('open');

    const content = document.getElementById('adminContent');
    content.innerHTML = '<div class="kpi-card">Yuklanmoqda...</div>';

    try {
      if (section === 'dashboard') await renderDashboard();
      else if (section === 'orders') await renderOrders();
      else if (section === 'products') await renderProducts();
      else if (section === 'categories') await renderCategories();
      else if (section === 'promotions') await renderPromotions();
      else if (section === 'banners') await renderBanners();
      else if (section === 'users') await renderUsers();
    } catch (err) {
      UI.showToast(err.message, 'error');
      content.innerHTML = `<div class="kpi-card" style="color:var(--danger);">${escapeHtml(err.message)}</div>`;
    }
  }

  /* ---------------- 1. DASHBOARD ---------------- */
  async function renderDashboard() {
    const res = await API.adminDashboard();
    const d = res.data;

    document.getElementById('adminContent').innerHTML = `
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-label">Umumiy tushum</div>
          <div class="kpi-value">${escapeHtml(formatPrice(d.totalRevenue))}</div>
          <div class="kpi-sub">Bugun: ${escapeHtml(formatPrice(d.todayRevenue))}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Buyurtmalar</div>
          <div class="kpi-value">${d.totalOrders}</div>
          <div class="kpi-sub">Faol: ${d.activeOrders} &bull; Bugun: ${d.todayOrders}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Mahsulotlar va Kategoriyalar</div>
          <div class="kpi-value">${d.totalProducts}</div>
          <div class="kpi-sub">${d.totalCategories} ta kategoriya</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Foydalanuvchilar</div>
          <div class="kpi-value">${d.totalUsers}</div>
          <div class="kpi-sub">${d.activePromotions} aksiya &bull; ${d.activeBanners} banner</div>
        </div>
      </div>

      <div class="admin-table-card">
        <div style="padding:16px 18px; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center;">
          <h3 style="font-family:var(--font-display);">So'nggi buyurtmalar</h3>
          <button type="button" class="btn-xs edit" id="dashGoOrders">Barchasini ko'rish</button>
        </div>
        <div class="table-scroll">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Raqam</th>
                <th>Mijoz</th>
                <th>Turi</th>
                <th>Summa</th>
                <th>Holat</th>
                <th>Sana</th>
              </tr>
            </thead>
            <tbody>
              ${(d.recentOrders || [])
                .map(
                  (o) => `
                  <tr>
                    <td><strong>${escapeHtml(o.orderNumber)}</strong></td>
                    <td>${escapeHtml(o.customerName)}<br><small style="color:var(--text-muted);">${escapeHtml(o.customerPhone)}</small></td>
                    <td>${o.orderType === 'delivery' ? 'Yetkazish' : 'Olib ketish'}</td>
                    <td><strong>${escapeHtml(formatPrice(o.totalAmount))}</strong></td>
                    <td><span class="status-badge status-${escapeHtml(o.status)}">${escapeHtml(getStatusLabel(o.status))}</span></td>
                    <td>${new Date(o.createdAt).toLocaleString()}</td>
                  </tr>
                `
                )
                .join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    document.getElementById('dashGoOrders')?.addEventListener('click', () => loadSection('orders'));
  }

  /* ---------------- 2. ORDERS ---------------- */
  async function renderOrders(filterStatus = 'all', search = '') {
    const res = await API.adminGetOrders({ status: filterStatus, search });
    ADMIN_STATE.orders = res.data || [];

    document.getElementById('adminContent').innerHTML = `
      <div class="admin-toolbar">
        <div class="admin-toolbar-filters">
          <select id="orderStatusFilter" class="admin-select">
            <option value="all" ${filterStatus === 'all' ? 'selected' : ''}>Barcha holatlar</option>
            ${ORDER_STATUSES.map((s) => `<option value="${s.value}" ${filterStatus === s.value ? 'selected' : ''}>${s.label}</option>`).join('')}
          </select>
          <input type="search" id="orderSearchInput" class="admin-input" value="${escapeHtml(search)}" placeholder="Buyurtma #, mijoz yoki telefon..." />
          <button type="button" class="btn-secondary" id="orderSearchBtn">Qidirish</button>
        </div>
      </div>

      <div class="admin-table-card">
        <div class="table-scroll">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Buyurtma</th>
                <th>Mijoz va Manzil</th>
                <th>Taomlar</th>
                <th>To'lov / Summa</th>
                <th>Holatni o'zgartirish</th>
              </tr>
            </thead>
            <tbody>
              ${
                ADMIN_STATE.orders.length
                  ? ADMIN_STATE.orders
                      .map(
                        (o) => `
                    <tr>
                      <td>
                        <strong>${escapeHtml(o.orderNumber)}</strong><br>
                        <small style="color:var(--text-muted);">${new Date(o.createdAt).toLocaleString()}</small>
                      </td>
                      <td>
                        <strong>${escapeHtml(o.customerName)}</strong> (${escapeHtml(o.customerPhone)})<br>
                        <small style="color:var(--text-muted);">${o.orderType === 'delivery' ? escapeHtml(o.deliveryAddress) : `Olib ketish: ${escapeHtml(o.branchName)}`}</small>
                        ${o.comment ? `<br><small style="color:var(--green-dark);">Izoh: ${escapeHtml(o.comment)}</small>` : ''}
                      </td>
                      <td>
                        ${(o.items || []).map((i) => `<div>${escapeHtml(i.productNameUz)} &times; ${i.quantity}</div>`).join('')}
                      </td>
                      <td>
                        <strong>${escapeHtml(formatPrice(o.totalAmount))}</strong><br>
                        <small style="text-transform:uppercase; color:var(--text-muted);">${escapeHtml(o.paymentType)}</small>
                      </td>
                      <td>
                        <select class="admin-select" data-order-status="${o.id}">
                          ${ORDER_STATUSES.map((s) => `<option value="${s.value}" ${o.status === s.value ? 'selected' : ''}>${s.label}</option>`).join('')}
                        </select>
                      </td>
                    </tr>
                  `
                      )
                      .join('')
                  : '<tr><td colspan="5" style="text-align:center; padding:28px;">Buyurtmalar topilmadi.</td></tr>'
              }
            </tbody>
          </table>
        </div>
      </div>
    `;

    document.getElementById('orderStatusFilter').addEventListener('change', (e) => {
      renderOrders(e.target.value, document.getElementById('orderSearchInput').value.trim());
    });
    document.getElementById('orderSearchBtn').addEventListener('click', () => {
      renderOrders(document.getElementById('orderStatusFilter').value, document.getElementById('orderSearchInput').value.trim());
    });
    document.querySelectorAll('[data-order-status]').forEach((sel) => {
      sel.addEventListener('change', async () => {
        try {
          await API.adminUpdateOrderStatus(sel.getAttribute('data-order-status'), sel.value);
          UI.showToast('Buyurtma holati yangilandi');
        } catch (err) {
          UI.showToast(err.message, 'error');
        }
      });
    });
  }

  /* ---------------- 3. PRODUCTS CRUD + IMAGE UPLOAD ---------------- */
  function renderProductsTableRows(searchTerm = '') {
    const filtered = searchTerm
      ? ADMIN_STATE.products.filter(
          (p) =>
            p.nameUz.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.nameRu.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : ADMIN_STATE.products;

    const tbody = document.getElementById('productsTableBody');
    if (!tbody) return;

    tbody.innerHTML = filtered.length
      ? filtered
          .map(
            (p) => `
          <tr>
            <td><img class="table-thumb" src="${escapeHtml(p.imageUrl)}" alt="" /></td>
            <td>
              <strong>${escapeHtml(p.nameUz)}</strong><br>
              <small style="color:var(--text-muted);">${escapeHtml(p.nameRu)} &bull; ${escapeHtml(p.volumeUz)}</small>
            </td>
            <td>${escapeHtml(p.category?.nameUz || '-')}</td>
            <td>
              <strong>${escapeHtml(formatPrice(p.price))}</strong>
              ${p.oldPrice ? `<br><small style="text-decoration:line-through; color:var(--text-light);">${escapeHtml(formatPrice(p.oldPrice))}</small>` : ''}
            </td>
            <td>
              <span class="status-badge ${p.isAvailable ? 'status-completed' : 'status-cancelled'}">${p.isAvailable ? 'Mavjud' : 'Nofaol'}</span>
            </td>
            <td>
              <div class="table-actions">
                <button type="button" class="btn-xs edit" data-edit-prod="${p.id}">Tahrirlash</button>
                <button type="button" class="btn-xs" data-price-prod="${p.id}">Narx</button>
                <button type="button" class="btn-xs danger" data-del-prod="${p.id}">O'chirish</button>
              </div>
            </td>
          </tr>
        `
          )
          .join('')
      : '<tr><td colspan="6" style="text-align:center; padding:24px;">Mahsulot topilmadi.</td></tr>';
  }

  async function renderProducts(searchTerm = '') {
    const [prodRes, catRes] = await Promise.all([API.adminGetProducts(), API.adminGetCategories()]);
    ADMIN_STATE.products = prodRes.data || [];
    ADMIN_STATE.categories = catRes.data || [];

    document.getElementById('adminContent').innerHTML = `
      <div class="admin-toolbar">
        <div class="admin-toolbar-filters">
          <input type="search" id="prodSearchInput" class="admin-input" value="${escapeHtml(searchTerm)}" placeholder="Mahsulot nomi..." />
        </div>
        <button type="button" class="btn-primary" id="addProductBtn">+ Mahsulot qo'shish</button>
      </div>

      <div class="admin-table-card">
        <div class="table-scroll">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Rasm</th>
                <th>Nomi</th>
                <th>Kategoriya</th>
                <th>Narx</th>
                <th>Holat</th>
                <th>Amallar</th>
              </tr>
            </thead>
            <tbody id="productsTableBody"></tbody>
          </table>
        </div>
      </div>
    `;

    renderProductsTableRows(searchTerm);

    document.getElementById('prodSearchInput').addEventListener('input', (e) => renderProductsTableRows(e.target.value));
    document.getElementById('addProductBtn').addEventListener('click', () => openProductFormModal(null));
    document.getElementById('productsTableBody').addEventListener('click', async (e) => {
      const editBtn = e.target.closest('[data-edit-prod]');
      if (editBtn) {
        const prod = ADMIN_STATE.products.find((p) => p.id === Number(editBtn.getAttribute('data-edit-prod')));
        if (prod) openProductFormModal(prod);
        return;
      }
      const priceBtn = e.target.closest('[data-price-prod]');
      if (priceBtn) {
        const prod = ADMIN_STATE.products.find((p) => p.id === Number(priceBtn.getAttribute('data-price-prod')));
        if (prod) openQuickPriceModal(prod);
        return;
      }
      const delBtn = e.target.closest('[data-del-prod]');
      if (delBtn) {
        if (!confirm('Haqiqatan ham ushbu mahsulotni o\'chirmoqchimisiz?')) return;
        try {
          await API.adminDeleteProduct(delBtn.getAttribute('data-del-prod'));
          UI.showToast('Mahsulot o\'chirildi');
          renderProducts(document.getElementById('prodSearchInput').value);
        } catch (err) {
          UI.showToast(err.message, 'error');
        }
      }
    });
  }

  function openQuickPriceModal(product) {
    openAdminModal(`
      <h2 class="modal-title">Narxni o'zgartirish</h2>
      <p class="modal-subtitle">${escapeHtml(product.nameUz)}</p>
      <form id="quickPriceForm">
        <div class="form-grid">
          <div class="form-field">
            <label>Yangi narx (so'm) *</label>
            <input type="number" name="price" required min="0" value="${product.price}" />
          </div>
          <div class="form-field">
            <label>Eski narx (chegirma uchun)</label>
            <input type="number" name="oldPrice" min="0" value="${product.oldPrice || ''}" />
          </div>
        </div>
        <button type="submit" class="btn-primary-full">Saqlash</button>
      </form>
    `);

    document.getElementById('quickPriceForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        await API.adminUpdateProduct(product.id, fd);
        closeAdminModal();
        UI.showToast('Narx yangilandi');
        renderProducts();
      } catch (err) {
        UI.showToast(err.message, 'error');
      }
    });
  }

  function openProductFormModal(product) {
    const isEdit = Boolean(product);
    const nonVirtualCats = ADMIN_STATE.categories.filter((c) => !c.isVirtual);

    openAdminModal(`
      <h2 class="modal-title">${isEdit ? 'Mahsulotni tahrirlash' : 'Yangi mahsulot qo\'shish'}</h2>
      <form id="productAdminForm" enctype="multipart/form-data">
        <div class="form-grid">
          <div class="form-field">
            <label>Kategoriya *</label>
            <select name="categoryId" required>
              ${nonVirtualCats
                .map((c) => `<option value="${c.id}" ${product?.categoryId === c.id ? 'selected' : ''}>${escapeHtml(c.nameUz)} / ${escapeHtml(c.nameRu)}</option>`)
                .join('')}
            </select>
          </div>
          <div class="form-field">
            <label>Rasmlar yuklash (Multer)</label>
            <input type="file" name="images" accept="image/*" multiple />
          </div>
          <div class="form-field">
            <label>Nomi (O'zbekcha) *</label>
            <input type="text" name="nameUz" required value="${escapeHtml(product?.nameUz || '')}" />
          </div>
          <div class="form-field">
            <label>Nomi (Ruscha) *</label>
            <input type="text" name="nameRu" required value="${escapeHtml(product?.nameRu || '')}" />
          </div>
          <div class="form-field">
            <label>Narxi (so'm) *</label>
            <input type="number" name="price" required min="0" value="${product?.price || ''}" />
          </div>
          <div class="form-field">
            <label>Eski narx (ixtiyoriy)</label>
            <input type="number" name="oldPrice" min="0" value="${product?.oldPrice || ''}" />
          </div>
          <div class="form-field">
            <label>Hajmi (UZ) *</label>
            <input type="text" name="volumeUz" required placeholder="340 g" value="${escapeHtml(product?.volumeUz || '')}" />
          </div>
          <div class="form-field">
            <label>Hajmi (RU) *</label>
            <input type="text" name="volumeRu" required placeholder="340 г" value="${escapeHtml(product?.volumeRu || '')}" />
          </div>
          <div class="form-field">
            <label>Kaloriyasi (kkal)</label>
            <input type="number" name="calories" min="0" value="${product?.calories || ''}" />
          </div>
          <div class="form-field">
            <label>Rasm URL (ixtiyoriy)</label>
            <input type="text" name="imageUrl" value="${escapeHtml(product?.imageUrl || '/uploads/products/lavash-beef.jpg')}" />
          </div>
          <div class="form-field">
            <label>Belgisi / Badge (UZ)</label>
            <input type="text" name="badgeUz" placeholder="Xit savdo" value="${escapeHtml(product?.badgeUz || '')}" />
          </div>
          <div class="form-field">
            <label>Belgisi / Badge (RU)</label>
            <input type="text" name="badgeRu" placeholder="Хит продаж" value="${escapeHtml(product?.badgeRu || '')}" />
          </div>
          <div class="form-field full">
            <label>Tarkibi (UZ) *</label>
            <textarea name="ingredientsUz" rows="2" required>${escapeHtml(product?.ingredientsUz || '')}</textarea>
          </div>
          <div class="form-field full">
            <label>Tarkibi (RU) *</label>
            <textarea name="ingredientsRu" rows="2" required>${escapeHtml(product?.ingredientsRu || '')}</textarea>
          </div>
          <div class="form-field full">
            <label>Tavsifi (UZ) *</label>
            <textarea name="descriptionUz" rows="2" required>${escapeHtml(product?.descriptionUz || '')}</textarea>
          </div>
          <div class="form-field full">
            <label>Tavsifi (RU) *</label>
            <textarea name="descriptionRu" rows="2" required>${escapeHtml(product?.descriptionRu || '')}</textarea>
          </div>
        </div>
        <div class="checkbox-row">
          <label class="checkbox-pill"><input type="checkbox" name="isAvailable" ${!product || product.isAvailable ? 'checked' : ''} /> Sotuvda mavjud</label>
          <label class="checkbox-pill"><input type="checkbox" name="isNew" ${product?.isNew ? 'checked' : ''} /> Yangilik</label>
          <label class="checkbox-pill"><input type="checkbox" name="isPromo" ${product?.isPromo ? 'checked' : ''} /> Aksiya</label>
          <label class="checkbox-pill"><input type="checkbox" name="isKids" ${product?.isKids ? 'checked' : ''} /> Bolalar uchun</label>
        </div>
        <button type="submit" class="btn-primary-full">${isEdit ? 'O\'zgarishlarni saqlash' : 'Mahsulotni yaratish'}</button>
      </form>
    `);

    document.getElementById('productAdminForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;
      const fd = new FormData(form);
      ['isAvailable', 'isNew', 'isPromo', 'isKids'].forEach((flag) => {
        fd.set(flag, form.elements[flag].checked ? 'true' : 'false');
      });
      try {
        if (isEdit) {
          await API.adminUpdateProduct(product.id, fd);
          UI.showToast('Mahsulot yangilandi');
        } else {
          await API.adminCreateProduct(fd);
          UI.showToast('Mahsulot qo\'shildi');
        }
        closeAdminModal();
        renderProducts();
      } catch (err) {
        UI.showToast(err.message, 'error');
      }
    });
  }

  /* ---------------- 4. CATEGORIES CRUD ---------------- */
  async function renderCategories() {
    const res = await API.adminGetCategories();
    ADMIN_STATE.categories = res.data || [];

    document.getElementById('adminContent').innerHTML = `
      <div class="admin-toolbar">
        <div></div>
        <button type="button" class="btn-primary" id="addCategoryBtn">+ Kategoriya qo'shish</button>
      </div>
      <div class="admin-table-card">
        <div class="table-scroll">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Tartib</th>
                <th>Nomi (UZ)</th>
                <th>Nomi (RU)</th>
                <th>Slug</th>
                <th>Mahsulotlar</th>
                <th>Amallar</th>
              </tr>
            </thead>
            <tbody>
              ${ADMIN_STATE.categories
                .map(
                  (c) => `
                  <tr>
                    <td>${c.sortOrder}</td>
                    <td><strong>${escapeHtml(c.nameUz)}</strong></td>
                    <td>${escapeHtml(c.nameRu)}</td>
                    <td><code>${escapeHtml(c.slug)}</code></td>
                    <td>${c.productCount || 0}</td>
                    <td>
                      <div class="table-actions">
                        <button type="button" class="btn-xs edit" data-edit-cat="${c.id}">Tahrirlash</button>
                        ${!c.isVirtual ? `<button type="button" class="btn-xs danger" data-del-cat="${c.id}">O'chirish</button>` : ''}
                      </div>
                    </td>
                  </tr>
                `
                )
                .join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    document.getElementById('addCategoryBtn').addEventListener('click', () => openCategoryModal(null));
    document.querySelectorAll('[data-edit-cat]').forEach((b) => {
      b.addEventListener('click', () => {
        const cat = ADMIN_STATE.categories.find((c) => c.id === Number(b.getAttribute('data-edit-cat')));
        openCategoryModal(cat);
      });
    });
    document.querySelectorAll('[data-del-cat]').forEach((b) => {
      b.addEventListener('click', async () => {
        if (!confirm('Kategoriyani o\'chirmoqchimisiz?')) return;
        try {
          await API.adminDeleteCategory(b.getAttribute('data-del-cat'));
          UI.showToast('Kategoriya o\'chirildi');
          renderCategories();
        } catch (err) {
          UI.showToast(err.message, 'error');
        }
      });
    });
  }

  function openCategoryModal(cat) {
    const isEdit = Boolean(cat);
    openAdminModal(`
      <h2 class="modal-title">${isEdit ? 'Kategoriyani tahrirlash' : 'Yangi kategoriya'}</h2>
      <form id="categoryAdminForm" enctype="multipart/form-data">
        <div class="form-grid">
          <div class="form-field">
            <label>Nomi (UZ) *</label>
            <input type="text" name="nameUz" required value="${escapeHtml(cat?.nameUz || '')}" />
          </div>
          <div class="form-field">
            <label>Nomi (RU) *</label>
            <input type="text" name="nameRu" required value="${escapeHtml(cat?.nameRu || '')}" />
          </div>
          <div class="form-field">
            <label>Tartib raqami</label>
            <input type="number" name="sortOrder" value="${cat?.sortOrder ?? 13}" />
          </div>
          <div class="form-field">
            <label>Ikonka rasm yuklash</label>
            <input type="file" name="icon" accept="image/*" />
          </div>
        </div>
        <button type="submit" class="btn-primary-full">${isEdit ? 'Saqlash' : 'Yaratish'}</button>
      </form>
    `);

    document.getElementById('categoryAdminForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        if (isEdit) await API.adminUpdateCategory(cat.id, fd);
        else await API.adminCreateCategory(fd);
        closeAdminModal();
        UI.showToast('Saqlandi');
        renderCategories();
      } catch (err) {
        UI.showToast(err.message, 'error');
      }
    });
  }

  /* ---------------- 5. PROMOTIONS CRUD ---------------- */
  async function renderPromotions() {
    const res = await API.adminGetPromotions();
    ADMIN_STATE.promotions = res.data || [];

    document.getElementById('adminContent').innerHTML = `
      <div class="admin-toolbar">
        <div></div>
        <button type="button" class="btn-primary" id="addPromoBtn">+ Yangi aksiya</button>
      </div>
      <div class="admin-table-card">
        <div class="table-scroll">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Sarlavha</th>
                <th>Promo kod</th>
                <th>Chegirma</th>
                <th>Min. buyurtma</th>
                <th>Holat</th>
                <th>Amallar</th>
              </tr>
            </thead>
            <tbody>
              ${ADMIN_STATE.promotions
                .map(
                  (p) => `
                  <tr>
                    <td><strong>${escapeHtml(p.titleUz)}</strong><br><small style="color:var(--text-muted);">${escapeHtml(p.titleRu)}</small></td>
                    <td><code>${escapeHtml(p.promoCode || '-')}</code></td>
                    <td>${p.discountPercent > 0 ? `${p.discountPercent}%` : formatPrice(p.discountAmount)}</td>
                    <td>${formatPrice(p.minOrderAmount)}</td>
                    <td><span class="status-badge ${p.isActive ? 'status-completed' : 'status-cancelled'}">${p.isActive ? 'Faol' : 'Nofaol'}</span></td>
                    <td>
                      <div class="table-actions">
                        <button type="button" class="btn-xs edit" data-edit-promo="${p.id}">Tahrirlash</button>
                        <button type="button" class="btn-xs danger" data-del-promo="${p.id}">O'chirish</button>
                      </div>
                    </td>
                  </tr>
                `
                )
                .join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    document.getElementById('addPromoBtn').addEventListener('click', () => openPromotionModal(null));
    document.querySelectorAll('[data-edit-promo]').forEach((b) => {
      b.addEventListener('click', () => {
        const promo = ADMIN_STATE.promotions.find((p) => p.id === Number(b.getAttribute('data-edit-promo')));
        openPromotionModal(promo);
      });
    });
    document.querySelectorAll('[data-del-promo]').forEach((b) => {
      b.addEventListener('click', async () => {
        if (!confirm('Aksiyani o\'chirmoqchimisiz?')) return;
        try {
          await API.adminDeletePromotion(b.getAttribute('data-del-promo'));
          UI.showToast('Aksiya o\'chirildi');
          renderPromotions();
        } catch (err) {
          UI.showToast(err.message, 'error');
        }
      });
    });
  }

  function openPromotionModal(promo) {
    const isEdit = Boolean(promo);
    openAdminModal(`
      <h2 class="modal-title">${isEdit ? 'Aksiyani tahrirlash' : 'Yangi aksiya yaratish'}</h2>
      <form id="promoAdminForm">
        <div class="form-grid">
          <div class="form-field">
            <label>Sarlavha (UZ) *</label>
            <input type="text" name="titleUz" required value="${escapeHtml(promo?.titleUz || '')}" />
          </div>
          <div class="form-field">
            <label>Sarlavha (RU) *</label>
            <input type="text" name="titleRu" required value="${escapeHtml(promo?.titleRu || '')}" />
          </div>
          <div class="form-field">
            <label>Promo kod</label>
            <input type="text" name="promoCode" placeholder="MAZZA25" value="${escapeHtml(promo?.promoCode || '')}" />
          </div>
          <div class="form-field">
            <label>Badge matni</label>
            <input type="text" name="badgeText" placeholder="-25%" value="${escapeHtml(promo?.badgeText || '')}" />
          </div>
          <div class="form-field">
            <label>Chegirma foizi (%)</label>
            <input type="number" name="discountPercent" min="0" max="100" value="${promo?.discountPercent ?? 0}" />
          </div>
          <div class="form-field">
            <label>Chegirma summasi (so'm)</label>
            <input type="number" name="discountAmount" min="0" value="${promo?.discountAmount ?? 0}" />
          </div>
          <div class="form-field full">
            <label>Minimal buyurtma summasi (so'm)</label>
            <input type="number" name="minOrderAmount" min="0" value="${promo?.minOrderAmount ?? 0}" />
          </div>
          <div class="form-field full">
            <label>Tavsifi (UZ) *</label>
            <textarea name="descriptionUz" rows="2" required>${escapeHtml(promo?.descriptionUz || '')}</textarea>
          </div>
          <div class="form-field full">
            <label>Tavsifi (RU) *</label>
            <textarea name="descriptionRu" rows="2" required>${escapeHtml(promo?.descriptionRu || '')}</textarea>
          </div>
        </div>
        <div class="checkbox-row">
          <label class="checkbox-pill"><input type="checkbox" name="isActive" ${!promo || promo.isActive ? 'checked' : ''} /> Faol aksiya</label>
        </div>
        <button type="submit" class="btn-primary-full">${isEdit ? 'Saqlash' : 'Yaratish'}</button>
      </form>
    `);

    document.getElementById('promoAdminForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;
      const fd = new FormData(form);
      fd.set('isActive', form.elements.isActive.checked ? 'true' : 'false');
      try {
        if (isEdit) await API.adminUpdatePromotion(promo.id, fd);
        else await API.adminCreatePromotion(fd);
        closeAdminModal();
        UI.showToast('Aksiya saqlandi');
        renderPromotions();
      } catch (err) {
        UI.showToast(err.message, 'error');
      }
    });
  }

  /* ---------------- 6. BANNERS CRUD ---------------- */
  async function renderBanners() {
    const [banRes, catRes, prodRes] = await Promise.all([
      API.adminGetBanners(),
      API.adminGetCategories(),
      API.adminGetProducts()
    ]);
    ADMIN_STATE.banners = banRes.data || [];
    ADMIN_STATE.categories = catRes.data || [];
    ADMIN_STATE.products = prodRes.data || [];

    document.getElementById('adminContent').innerHTML = `
      <div class="admin-toolbar">
        <div></div>
        <button type="button" class="btn-primary" id="addBannerBtn">+ Banner qo'shish</button>
      </div>
      <div class="admin-table-card">
        <div class="table-scroll">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Rasm</th>
                <th>Sarlavha</th>
                <th>Bog'lanma</th>
                <th>Holat</th>
                <th>Amallar</th>
              </tr>
            </thead>
            <tbody>
              ${ADMIN_STATE.banners
                .map(
                  (b) => `
                  <tr>
                    <td><img class="table-thumb" style="width:90px;" src="${escapeHtml(b.imageUrl)}" alt="" /></td>
                    <td><strong>${escapeHtml(b.titleUz)}</strong><br><small style="color:var(--text-muted);">${escapeHtml(b.subtitleUz || '')}</small></td>
                    <td>${escapeHtml(b.linkType)}</td>
                    <td><span class="status-badge ${b.isActive ? 'status-completed' : 'status-cancelled'}">${b.isActive ? 'Faol' : 'Nofaol'}</span></td>
                    <td>
                      <div class="table-actions">
                        <button type="button" class="btn-xs edit" data-edit-banner="${b.id}">Tahrirlash</button>
                        <button type="button" class="btn-xs danger" data-del-banner="${b.id}">O'chirish</button>
                      </div>
                    </td>
                  </tr>
                `
                )
                .join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    document.getElementById('addBannerBtn').addEventListener('click', () => openBannerModal(null));
    document.querySelectorAll('[data-edit-banner]').forEach((b) => {
      b.addEventListener('click', () => {
        const banner = ADMIN_STATE.banners.find((x) => x.id === Number(b.getAttribute('data-edit-banner')));
        openBannerModal(banner);
      });
    });
    document.querySelectorAll('[data-del-banner]').forEach((b) => {
      b.addEventListener('click', async () => {
        if (!confirm('Banner o\'chirilsinmi?')) return;
        try {
          await API.adminDeleteBanner(b.getAttribute('data-del-banner'));
          UI.showToast('Banner o\'chirildi');
          renderBanners();
        } catch (err) {
          UI.showToast(err.message, 'error');
        }
      });
    });
  }

  function openBannerModal(banner) {
    const isEdit = Boolean(banner);
    openAdminModal(`
      <h2 class="modal-title">${isEdit ? 'Bannerni tahrirlash' : 'Yangi banner'}</h2>
      <form id="bannerAdminForm" enctype="multipart/form-data">
        <div class="form-grid">
          <div class="form-field">
            <label>Sarlavha (UZ) *</label>
            <input type="text" name="titleUz" required value="${escapeHtml(banner?.titleUz || '')}" />
          </div>
          <div class="form-field">
            <label>Sarlavha (RU) *</label>
            <input type="text" name="titleRu" required value="${escapeHtml(banner?.titleRu || '')}" />
          </div>
          <div class="form-field">
            <label>Tavsif (UZ)</label>
            <input type="text" name="subtitleUz" value="${escapeHtml(banner?.subtitleUz || '')}" />
          </div>
          <div class="form-field">
            <label>Tavsif (RU)</label>
            <input type="text" name="subtitleRu" value="${escapeHtml(banner?.subtitleRu || '')}" />
          </div>
          <div class="form-field">
            <label>Bog'lanish turi</label>
            <select name="linkType">
              <option value="category" ${banner?.linkType === 'category' ? 'selected' : ''}>Kategoriya</option>
              <option value="product" ${banner?.linkType === 'product' ? 'selected' : ''}>Mahsulot</option>
              <option value="promotion" ${banner?.linkType === 'promotion' ? 'selected' : ''}>Aksiya</option>
            </select>
          </div>
          <div class="form-field">
            <label>Kategoriya</label>
            <select name="categoryId">
              <option value="">-- Tanlang --</option>
              ${ADMIN_STATE.categories.map((c) => `<option value="${c.id}" ${banner?.categoryId === c.id ? 'selected' : ''}>${escapeHtml(c.nameUz)}</option>`).join('')}
            </select>
          </div>
          <div class="form-field">
            <label>Mahsulot (ixtiyoriy)</label>
            <select name="productId">
              <option value="">-- Tanlang --</option>
              ${ADMIN_STATE.products.map((p) => `<option value="${p.id}" ${banner?.productId === p.id ? 'selected' : ''}>${escapeHtml(p.nameUz)}</option>`).join('')}
            </select>
          </div>
          <div class="form-field">
            <label>Banner rasm yuklash</label>
            <input type="file" name="image" accept="image/*" />
          </div>
          <div class="form-field full">
            <label>Yoki rasm URL</label>
            <input type="text" name="imageUrl" value="${escapeHtml(banner?.imageUrl || '/uploads/banners/banner-lavash.jpg')}" />
          </div>
        </div>
        <div class="checkbox-row">
          <label class="checkbox-pill"><input type="checkbox" name="isActive" ${!banner || banner.isActive ? 'checked' : ''} /> Faol banner</label>
        </div>
        <button type="submit" class="btn-primary-full">${isEdit ? 'Saqlash' : 'Qo\'shish'}</button>
      </form>
    `);

    document.getElementById('bannerAdminForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;
      const fd = new FormData(form);
      fd.set('isActive', form.elements.isActive.checked ? 'true' : 'false');
      try {
        if (isEdit) await API.adminUpdateBanner(banner.id, fd);
        else await API.adminCreateBanner(fd);
        closeAdminModal();
        UI.showToast('Banner saqlandi');
        renderBanners();
      } catch (err) {
        UI.showToast(err.message, 'error');
      }
    });
  }

  /* ---------------- 7. USERS MANAGEMENT ---------------- */
  async function renderUsers(search = '') {
    const res = await API.adminGetUsers(search);
    ADMIN_STATE.users = res.data || [];

    document.getElementById('adminContent').innerHTML = `
      <div class="admin-toolbar">
        <div class="admin-toolbar-filters">
          <input type="search" id="userSearchInput" class="admin-input" value="${escapeHtml(search)}" placeholder="Ism, telefon yoki email..." />
          <button type="button" class="btn-secondary" id="userSearchBtn">Qidirish</button>
        </div>
      </div>
      <div class="admin-table-card">
        <div class="table-scroll">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Foydalanuvchi</th>
                <th>Telefon / Email</th>
                <th>Buyurtmalar</th>
                <th>Jami xarid</th>
                <th>Holat</th>
                <th>Amal</th>
              </tr>
            </thead>
            <tbody>
              ${ADMIN_STATE.users
                .map(
                  (u) => `
                  <tr>
                    <td><strong>${escapeHtml(u.fullName)}</strong></td>
                    <td>${escapeHtml(u.phone)}<br><small style="color:var(--text-muted);">${escapeHtml(u.email || '-')}</small></td>
                    <td>${u.ordersCount}</td>
                    <td>${escapeHtml(formatPrice(u.totalSpent))}</td>
                    <td><span class="status-badge ${u.isActive ? 'status-completed' : 'status-cancelled'}">${u.isActive ? 'Faol' : 'Bloklangan'}</span></td>
                    <td>
                      <button type="button" class="btn-xs ${u.isActive ? 'danger' : 'edit'}" data-toggle-user="${u.id}" data-active="${u.isActive}">
                        ${u.isActive ? 'Bloklash' : 'Faollashtirish'}
                      </button>
                    </td>
                  </tr>
                `
                )
                .join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    document.getElementById('userSearchBtn').addEventListener('click', () => {
      renderUsers(document.getElementById('userSearchInput').value.trim());
    });
    document.querySelectorAll('[data-toggle-user]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const isCurrentlyActive = btn.getAttribute('data-active') === 'true';
        try {
          await API.adminToggleUserStatus(btn.getAttribute('data-toggle-user'), !isCurrentlyActive);
          UI.showToast('Foydalanuvchi holati o\'zgartirildi');
          renderUsers(document.getElementById('userSearchInput').value.trim());
        } catch (err) {
          UI.showToast(err.message, 'error');
        }
      });
    });
  }

  /* ---------------- SHELL EVENTS ---------------- */
  function bindShellEvents() {
    document.getElementById('adminLoginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        const res = await API.adminLogin({ login: fd.get('login'), password: fd.get('password') });
        localStorage.setItem('mazza_admin_token', res.data.token);
        ADMIN_STATE.admin = res.data.admin;
        UI.showToast(res.message);
        showAdminWorkspace();
      } catch (err) {
        UI.showToast(err.message, 'error');
      }
    });

    document.querySelectorAll('.admin-nav-btn').forEach((btn) => {
      btn.addEventListener('click', () => loadSection(btn.getAttribute('data-section')));
    });

    document.getElementById('adminLogoutBtn').addEventListener('click', () => {
      localStorage.removeItem('mazza_admin_token');
      ADMIN_STATE.admin = null;
      showLoginScreen();
    });

    document.getElementById('adminMobileToggle').addEventListener('click', () => {
      document.getElementById('adminSidebar').classList.toggle('open');
    });

    document.getElementById('adminModalClose').addEventListener('click', closeAdminModal);
    document.getElementById('adminModal').addEventListener('click', (e) => {
      if (e.target.id === 'adminModal') closeAdminModal();
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
