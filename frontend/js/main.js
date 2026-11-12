(function () {
  const STATE = window.MAZZA_STATE;
  const STORE = window.MAZZA_STORE;
  const API = window.MAZZA_API;
  const UI = window.MAZZA_UI;
  const { escapeHtml } = UI;

  let bannerIndex = 0;
  let bannerTimer = null;
  let searchDebounce = null;

  /* ---------------- INITIALIZATION ---------------- */
  async function init() {
    applyStaticTranslations();
    bindStaticEvents();
    updateCartIndicators();

    await Promise.all([loadInfo(), restoreUserSession()]);
    await Promise.all([loadBanners(), loadPromotions(), loadCategories(), loadAllProductsCache()]);
    await loadCatalogProducts();
  }

  async function loadInfo() {
    try {
      const res = await API.getInfo();
      STATE.info = res.data || STATE.info;
    } catch (_err) {
      // keep safe defaults
    }
  }

  async function restoreUserSession() {
    const token = localStorage.getItem('mazza_user_token');
    if (!token) {
      updateAccountButton();
      return;
    }
    try {
      const res = await API.getProfile();
      STATE.user = res.data;
      const addrRes = await API.getAddresses().catch(() => ({ data: [] }));
      STATE.addresses = addrRes.data || [];
    } catch (_err) {
      localStorage.removeItem('mazza_user_token');
      STATE.user = null;
    }
    updateAccountButton();
  }

  async function loadBanners() {
    try {
      const res = await API.getBanners();
      STATE.banners = res.data || [];
      renderBanners();
    } catch (_err) {
      document.getElementById('bannerTrack').innerHTML = '';
    }
  }

  async function loadPromotions() {
    try {
      const res = await API.getPromotions();
      STATE.promotions = res.data || [];
      renderPromotionsStrip();
    } catch (_err) {
      STATE.promotions = [];
    }
  }

  async function loadCategories() {
    try {
      const res = await API.getCategories();
      STATE.categories = res.data || [];
      renderCategories();
    } catch (err) {
      UI.showToast(err.message, 'error');
    }
  }

  async function loadAllProductsCache() {
    try {
      const res = await API.getProducts();
      STATE.allProductsCache = res.data || [];
    } catch (_err) {
      STATE.allProductsCache = [];
    }
  }

  async function loadCatalogProducts() {
    const params = {};
    if (STATE.kidsMode) {
      params.kids = 'true';
    } else if (STATE.searchQuery) {
      params.search = STATE.searchQuery;
    } else if (STATE.activeCategorySlug && STATE.activeCategorySlug !== 'all') {
      params.category = STATE.activeCategorySlug;
    }

    try {
      const res = await API.getProducts(params);
      STATE.products = res.data || [];
      renderCatalog();
    } catch (err) {
      UI.showToast(err.message, 'error');
    }
  }

  /* ---------------- RENDERING: BANNERS ---------------- */
  function renderBanners() {
    const track = document.getElementById('bannerTrack');
    const dots = document.getElementById('bannerDots');
    const banners = STATE.banners;

    if (!banners.length) {
      document.querySelector('.banners-section').classList.add('hidden');
      return;
    }
    document.querySelector('.banners-section').classList.remove('hidden');

    track.innerHTML = banners
      .map(
        (b, idx) => `
        <div class="banner-slide" data-banner-idx="${idx}">
          <img src="${escapeHtml(b.imageUrl)}" alt="${escapeHtml(langField(b, 'title'))}" />
          <div class="banner-overlay">
            <span class="banner-chip">MAZZA AKSIYA</span>
            <h1 class="banner-title">${escapeHtml(langField(b, 'title'))}</h1>
            ${langField(b, 'subtitle') ? `<p class="banner-subtitle">${escapeHtml(langField(b, 'subtitle'))}</p>` : ''}
            <span class="banner-cta">
              ${escapeHtml(langField(b, 'ctaText') || t('add_to_cart'))}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </span>
          </div>
        </div>
      `
      )
      .join('');

    dots.innerHTML = banners
      .map((_, idx) => `<button type="button" class="banner-dot ${idx === bannerIndex ? 'active' : ''}" data-dot="${idx}" aria-label="Slide ${idx + 1}"></button>`)
      .join('');

    goToBanner(bannerIndex % banners.length);
    startBannerAutoPlay();
  }

  function goToBanner(idx) {
    if (!STATE.banners.length) return;
    bannerIndex = (idx + STATE.banners.length) % STATE.banners.length;
    const track = document.getElementById('bannerTrack');
    track.style.transform = `translateX(-${bannerIndex * 100}%)`;
    document.querySelectorAll('.banner-dot').forEach((dot, i) => {
      dot.classList.toggle('active', i === bannerIndex);
    });
  }

  function startBannerAutoPlay() {
    stopBannerAutoPlay();
    if (STATE.banners.length <= 1) return;
    bannerTimer = setInterval(() => goToBanner(bannerIndex + 1), 5000);
  }

  function stopBannerAutoPlay() {
    if (bannerTimer) clearInterval(bannerTimer);
    bannerTimer = null;
  }

  function handleBannerClick(idx) {
    const banner = STATE.banners[idx];
    if (!banner) return;

    if (banner.linkType === 'product' && banner.productId) {
      openProductModal(banner.productId);
      return;
    }
    if (banner.linkType === 'promotion' && banner.promotion) {
      if (banner.promotion.promoCode) {
        STATE.appliedPromo = banner.promotion;
        STORE.savePromo();
        UI.showToast(`${banner.promotion.promoCode} ${STATE.lang === 'ru' ? 'промокод активирован!' : 'promo kodi faollashtirildi!'}`);
      }
      if (banner.category?.slug) {
        selectCategory(banner.category.slug);
      } else {
        selectCategory('aksiyalar');
      }
      return;
    }
    if (banner.category?.slug) {
      selectCategory(banner.category.slug);
    }
  }

  /* ---------------- RENDERING: CATEGORIES & CATALOG ---------------- */
  function getCategoryIconHtml(cat) {
    if (cat.icon === 'promo') {
      return `<span class="category-icon-box category-icon-promo">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><circle cx="9" cy="9" r="2"/><circle cx="15" cy="15" r="2"/><line x1="17" y1="7" x2="7" y2="17"/></svg>
      </span>`;
    }
    if (cat.icon === 'new') {
      return `<span class="category-icon-box category-icon-new">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
      </span>`;
    }
    if (cat.icon) {
      return `<span class="category-icon-box"><img src="${escapeHtml(cat.icon)}" alt="" /></span>`;
    }
    return `<span class="category-icon-box">&#127828;</span>`;
  }

  function renderCategories() {
    const list = document.getElementById('categoryList');
    const resetBtn = document.getElementById('resetFiltersBtn');
    const isFiltered = STATE.activeCategorySlug !== 'all' || STATE.kidsMode || Boolean(STATE.searchQuery);
    resetBtn.classList.toggle('hidden', !isFiltered);

    list.innerHTML = STATE.categories
      .map((cat) => {
        const isActive = !STATE.kidsMode && !STATE.searchQuery && STATE.activeCategorySlug === cat.slug;
        return `
          <button type="button" class="category-item ${isActive ? 'active' : ''}" data-category="${escapeHtml(cat.slug)}">
            ${getCategoryIconHtml(cat)}
            <span class="category-label">${escapeHtml(langField(cat, 'name'))}</span>
            <span class="category-count">${cat.productCount || 0}</span>
          </button>
        `;
      })
      .join('');
  }

  function renderPromotionsStrip() {
    const strip = document.getElementById('promotionsStrip');
    const showPromos =
      STATE.promotions.length > 0 &&
      !STATE.searchQuery &&
      !STATE.kidsMode &&
      (STATE.activeCategorySlug === 'aksiyalar' || STATE.activeCategorySlug === 'all');

    if (!showPromos) {
      strip.classList.add('hidden');
      return;
    }

    strip.classList.remove('hidden');
    strip.innerHTML = STATE.promotions
      .slice(0, 3)
      .map(
        (p) => `
        <div class="promo-mini-card">
          <div class="promo-mini-top">
            <span class="promo-mini-badge">${escapeHtml(p.badgeText || 'AKSIYA')}</span>
            ${p.promoCode ? `<button type="button" class="promo-mini-code" data-copy-code="${escapeHtml(p.promoCode)}">${escapeHtml(p.promoCode)}</button>` : ''}
          </div>
          <h4>${escapeHtml(langField(p, 'title'))}</h4>
          <p>${escapeHtml(langField(p, 'description'))}</p>
        </div>
      `
      )
      .join('');
  }

  function renderCatalog() {
    const container = document.getElementById('catalogContainer');
    const statusBar = document.getElementById('catalogStatusBar');
    const statusText = document.getElementById('catalogStatusText');
    renderPromotionsStrip();
    renderCategories();

    if (STATE.kidsMode) {
      statusBar.classList.remove('hidden');
      statusText.textContent = t('kids_menu_title');
    } else if (STATE.searchQuery) {
      statusBar.classList.remove('hidden');
      statusText.textContent = `${t('search_results_for')} "${STATE.searchQuery}" (${STATE.products.length})`;
    } else if (STATE.activeCategorySlug !== 'all') {
      const cat = STATE.categories.find((c) => c.slug === STATE.activeCategorySlug);
      statusBar.classList.remove('hidden');
      statusText.textContent = cat ? langField(cat, 'name') : '';
    } else {
      statusBar.classList.add('hidden');
    }

    if (!STATE.products.length) {
      container.innerHTML = `
        <div class="empty-state-box">
          <div class="empty-state-icon">&#128269;</div>
          <h3>${escapeHtml(t('empty_search_title'))}</h3>
          <p>${escapeHtml(t('empty_search_desc'))}</p>
          <button type="button" class="btn-primary" id="emptyResetBtn">${escapeHtml(t('show_all_menu'))}</button>
        </div>
      `;
      document.getElementById('emptyResetBtn')?.addEventListener('click', resetAllFilters);
      return;
    }

    // Filtered view (single category, search, or kids)
    if (STATE.activeCategorySlug !== 'all' || STATE.searchQuery || STATE.kidsMode) {
      const cat = STATE.categories.find((c) => c.slug === STATE.activeCategorySlug);
      const heading = STATE.kidsMode
        ? t('kids_menu_title')
        : STATE.searchQuery
        ? `${t('search_results_for')} "${STATE.searchQuery}"`
        : langField(cat, 'name');

      container.innerHTML = `
        <div class="category-section">
          <div class="section-heading">
            ${cat ? getCategoryIconHtml(cat) : ''}
            <h2>${escapeHtml(heading)}</h2>
          </div>
          <div class="products-grid">
            ${STATE.products.map(UI.renderProductCard).join('')}
          </div>
        </div>
      `;
      return;
    }

    // Full EVOS-style grouped menu view
    const sections = [];
    const promoItems = STATE.products.filter((p) => p.isPromo);
    const newItems = STATE.products.filter((p) => p.isNew);

    for (const cat of STATE.categories) {
      let items = [];
      if (cat.slug === 'aksiyalar') {
        items = promoItems;
      } else if (cat.slug === 'yangiliklar') {
        items = newItems;
      } else {
        items = STATE.products.filter((p) => p.categoryId === cat.id);
      }

      if (!items.length) continue;

      sections.push(`
        <div class="category-section" id="cat-${escapeHtml(cat.slug)}">
          <div class="section-heading">
            ${getCategoryIconHtml(cat)}
            <h2>${escapeHtml(langField(cat, 'name'))}</h2>
          </div>
          <div class="products-grid">
            ${items.map(UI.renderProductCard).join('')}
          </div>
        </div>
      `);
    }

    container.innerHTML = sections.join('');
  }

  function selectCategory(slug) {
    STATE.kidsMode = false;
    STATE.searchQuery = '';
    STATE.activeCategorySlug = slug;
    document.getElementById('searchInput').value = '';
    document.getElementById('searchClearBtn').classList.add('hidden');
    document.getElementById('kidsMenuBtn').classList.remove('active');
    loadCatalogProducts();
    document.getElementById('productsContent').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function resetAllFilters() {
    STATE.kidsMode = false;
    STATE.searchQuery = '';
    STATE.activeCategorySlug = 'all';
    document.getElementById('searchInput').value = '';
    document.getElementById('searchClearBtn').classList.add('hidden');
    document.getElementById('kidsMenuBtn').classList.remove('active');
    loadCatalogProducts();
  }

  /* ---------------- SMART SEARCH & AUTOCOMPLETE ---------------- */
  function handleSearchInput(e) {
    const val = e.target.value.trim();
    document.getElementById('searchClearBtn').classList.toggle('hidden', !val);

    clearTimeout(searchDebounce);
    if (!val) {
      hideAutocomplete();
      if (STATE.searchQuery) {
        STATE.searchQuery = '';
        loadCatalogProducts();
      }
      return;
    }

    searchDebounce = setTimeout(async () => {
      try {
        const res = await API.autocomplete(val);
        renderAutocomplete(res.data || { products: [], categories: [] }, val);
      } catch (_err) {
        hideAutocomplete();
      }
    }, 220);
  }

  function renderAutocomplete(data, query) {
    const box = document.getElementById('searchAutocomplete');
    const { products = [], categories = [] } = data;

    if (!products.length && !categories.length) {
      box.innerHTML = `<div style="padding:14px; font-size:0.88rem; color:var(--text-muted);">${escapeHtml(t('empty_search_title'))}: "${escapeHtml(query)}"</div>`;
      box.classList.remove('hidden');
      return;
    }

    let html = '';
    if (categories.length) {
      html += `<div class="autocomplete-group-label">${escapeHtml(t('autocomplete_categories'))}</div>`;
      html += categories
        .map(
          (c) => `
          <button type="button" class="autocomplete-item" data-ac-category="${escapeHtml(c.slug)}">
            <span class="autocomplete-info">
              <div class="autocomplete-title">${escapeHtml(langField(c, 'name'))}</div>
            </span>
          </button>
        `
        )
        .join('');
    }
    if (products.length) {
      html += `<div class="autocomplete-group-label">${escapeHtml(t('autocomplete_products'))}</div>`;
      html += products
        .map(
          (p) => `
          <button type="button" class="autocomplete-item" data-ac-product="${p.id}">
            <img class="autocomplete-thumb" src="${escapeHtml(p.imageUrl)}" alt="" />
            <span class="autocomplete-info">
              <div class="autocomplete-title">${escapeHtml(langField(p, 'name'))}</div>
              <div class="autocomplete-sub">${escapeHtml(langField(p.category, 'name'))}</div>
            </span>
            <span class="autocomplete-price">${escapeHtml(formatPrice(p.price))}</span>
          </button>
        `
        )
        .join('');
    }

    box.innerHTML = html;
    box.classList.remove('hidden');
  }

  function hideAutocomplete() {
    document.getElementById('searchAutocomplete').classList.add('hidden');
  }

  /* ---------------- PRODUCT DETAIL MODAL ---------------- */
  async function openProductModal(idOrSlug) {
    try {
      const res = await API.getProductDetail(idOrSlug);
      const { product, related = [] } = res.data;
      const gallery =
        product.images && product.images.length
          ? product.images.map((i) => i.imageUrl)
          : [product.imageUrl];

      let modalQty = Math.max(1, STORE.getCartItemQuantity(product.id) || 1);

      const html = `
        <div class="product-modal-grid">
          <div class="product-modal-gallery">
            <img id="modalMainProductImg" class="product-modal-main-img" src="${escapeHtml(gallery[0])}" alt="${escapeHtml(langField(product, 'name'))}" />
            ${
              gallery.length > 1
                ? `<div class="product-thumbs">
                    ${gallery
                      .map(
                        (img, idx) => `
                        <button type="button" class="product-thumb-btn ${idx === 0 ? 'active' : ''}" data-thumb-src="${escapeHtml(img)}">
                          <img src="${escapeHtml(img)}" alt="" />
                        </button>`
                      )
                      .join('')}
                  </div>`
                : ''
            }
          </div>
          <div>
            ${product.category ? `<span class="modal-cat-tag">${escapeHtml(langField(product.category, 'name'))}</span>` : ''}
            <h2 class="product-modal-title">${escapeHtml(langField(product, 'name'))}</h2>
            <div class="product-price-row">
              <span class="product-price" style="font-size:1.45rem; color:var(--green-dark);">${escapeHtml(formatPrice(product.price))}</span>
              ${product.oldPrice && product.oldPrice > product.price ? `<span class="product-old-price">${escapeHtml(formatPrice(product.oldPrice))}</span>` : ''}
            </div>
            <div class="product-modal-specs">
              <span class="spec-chip">${escapeHtml(t('volume_label'))}: <strong>${escapeHtml(langField(product, 'volume'))}</strong></span>
              ${product.calories ? `<span class="spec-chip">${escapeHtml(t('calories_label'))}: <strong>${product.calories} ${escapeHtml(t('calories_unit'))}</strong></span>` : ''}
            </div>
            <div class="product-modal-section">
              <h4>${escapeHtml(t('description_label'))}</h4>
              <p>${escapeHtml(langField(product, 'description'))}</p>
            </div>
            <div class="product-modal-section">
              <h4>${escapeHtml(t('ingredients_label'))}</h4>
              <p>${escapeHtml(langField(product, 'ingredients'))}</p>
            </div>
            <div class="product-modal-buy-row">
              <div class="modal-qty-box">
                <button type="button" id="modalQtyDec">&minus;</button>
                <span id="modalQtyVal">${modalQty}</span>
                <button type="button" id="modalQtyInc">+</button>
              </div>
              <button type="button" class="btn-primary-full" id="modalAddToCartBtn">
                ${escapeHtml(t('add_to_cart_full'))} &bull; <span id="modalTotalBtnPrice">${escapeHtml(formatPrice(product.price * modalQty))}</span>
              </button>
            </div>
          </div>
        </div>
        ${
          related.length
            ? `<div style="margin-top:26px; padding-top:18px; border-top:1px solid var(--border);">
                <h4 style="margin-bottom:12px; font-family:var(--font-display);">${escapeHtml(t('related_label'))}</h4>
                <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(150px, 1fr)); gap:10px;">
                  ${related
                    .map(
                      (r) => `
                      <button type="button" class="info-card" style="text-align:left; padding:10px;" data-related-id="${r.id}">
                        <img src="${escapeHtml(r.imageUrl)}" alt="" style="height:80px; width:100%; object-fit:contain; margin-bottom:6px;" />
                        <div style="font-weight:700; font-size:0.84rem;">${escapeHtml(langField(r, 'name'))}</div>
                        <div style="color:var(--green-dark); font-weight:800; font-size:0.82rem;">${escapeHtml(formatPrice(r.price))}</div>
                      </button>
                    `
                    )
                    .join('')}
                </div>
              </div>`
            : ''
        }
      `;

      UI.openModal(html);

      document.querySelectorAll('[data-thumb-src]').forEach((btn) => {
        btn.addEventListener('click', () => {
          document.getElementById('modalMainProductImg').src = btn.getAttribute('data-thumb-src');
          document.querySelectorAll('[data-thumb-src]').forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
        });
      });

      const refreshModalPrice = () => {
        document.getElementById('modalQtyVal').textContent = modalQty;
        document.getElementById('modalTotalBtnPrice').textContent = formatPrice(product.price * modalQty);
      };

      document.getElementById('modalQtyDec').addEventListener('click', () => {
        if (modalQty > 1) {
          modalQty -= 1;
          refreshModalPrice();
        }
      });
      document.getElementById('modalQtyInc').addEventListener('click', () => {
        if (modalQty < 99) {
          modalQty += 1;
          refreshModalPrice();
        }
      });
      document.getElementById('modalAddToCartBtn').addEventListener('click', () => {
        const current = STORE.getCartItemQuantity(product.id);
        if (current > 0) {
          STORE.updateCartQuantity(product.id, modalQty, true);
        } else {
          STORE.addToCart(product, modalQty);
        }
        syncAfterCartChange();
        UI.closeModal();
        UI.showToast(`${langField(product, 'name')} — ${t('cart_btn')}`);
      });

      document.querySelectorAll('[data-related-id]').forEach((btn) => {
        btn.addEventListener('click', () => openProductModal(btn.getAttribute('data-related-id')));
      });
    } catch (err) {
      UI.showToast(err.message, 'error');
    }
  }

  /* ---------------- CART DRAWER ---------------- */
  function updateCartIndicators() {
    const totals = STORE.getCartTotals('delivery');
    const badge = document.getElementById('headerCartCount');
    const mobileBar = document.getElementById('mobileCartBar');
    const mobileCount = document.getElementById('mobileCartCount');
    const mobileTotal = document.getElementById('mobileCartTotal');

    badge.textContent = totals.count;
    badge.classList.toggle('hidden', totals.count === 0);

    mobileCount.textContent = totals.count;
    mobileTotal.textContent = formatPrice(totals.total);
    mobileBar.classList.toggle('hidden', totals.count === 0);
  }

  function renderCartDrawer() {
    const body = document.getElementById('cartDrawerBody');
    const footer = document.getElementById('cartDrawerFooter');
    const promoBadge = document.getElementById('appliedPromoBadge');
    const summaryEl = document.getElementById('cartSummaryLines');

    if (!STATE.cart.length) {
      footer.classList.add('hidden');
      body.innerHTML = `
        <div class="cart-empty">
          <div class="cart-empty-icon">&#128722;</div>
          <h3>${escapeHtml(t('cart_empty_title'))}</h3>
          <p>${escapeHtml(t('cart_empty_desc'))}</p>
          <button type="button" class="btn-primary" id="cartEmptyBackBtn">${escapeHtml(t('back_to_menu'))}</button>
        </div>
      `;
      document.getElementById('cartEmptyBackBtn')?.addEventListener('click', () => UI.closeDrawer('cartDrawer'));
      return;
    }

    footer.classList.remove('hidden');
    body.innerHTML = STATE.cart
      .map(
        (item) => `
        <div class="cart-item-row">
          <img class="cart-item-img" src="${escapeHtml(item.imageUrl)}" alt="" />
          <div class="cart-item-info">
            <div class="cart-item-name">${escapeHtml(langField(item, 'name'))}</div>
            <div class="cart-item-price">${escapeHtml(formatPrice(item.price * item.quantity))}</div>
          </div>
          <div class="cart-item-controls">
            <div class="cart-mini-stepper">
              <button type="button" data-cart-dec="${item.productId}">&minus;</button>
              <span>${item.quantity}</span>
              <button type="button" data-cart-inc="${item.productId}">+</button>
            </div>
            <button type="button" class="cart-remove-btn" data-cart-remove="${item.productId}">&times; ${STATE.lang === 'ru' ? 'Удалить' : 'O\'chirish'}</button>
          </div>
        </div>
      `
      )
      .join('');

    if (STATE.appliedPromo) {
      promoBadge.classList.remove('hidden');
      promoBadge.innerHTML = `
        <span>&#127881; ${escapeHtml(STATE.appliedPromo.promoCode)}</span>
        <button type="button" id="removePromoBtn" style="font-weight:800;">&times;</button>
      `;
      document.getElementById('removePromoBtn')?.addEventListener('click', () => {
        STATE.appliedPromo = null;
        STORE.savePromo();
        renderCartDrawer();
        updateCartIndicators();
      });
    } else {
      promoBadge.classList.add('hidden');
    }

    const totals = STORE.getCartTotals('delivery');
    const hintHtml =
      totals.remainingForFreeDelivery > 0
        ? `<div class="free-delivery-hint">${escapeHtml(t('free_delivery_hint_more'))} <strong>${escapeHtml(formatPrice(totals.remainingForFreeDelivery))}</strong></div>`
        : `<div class="free-delivery-hint">${escapeHtml(t('free_delivery_unlocked'))}</div>`;

    summaryEl.innerHTML = `
      ${hintHtml}
      <div class="summary-line"><span>${escapeHtml(t('subtotal_label'))}</span><span>${escapeHtml(formatPrice(totals.subtotal))}</span></div>
      ${totals.discount > 0 ? `<div class="summary-line" style="color:var(--green-dark); font-weight:700;"><span>${escapeHtml(t('discount_label'))}</span><span>-${escapeHtml(formatPrice(totals.discount))}</span></div>` : ''}
      <div class="summary-line"><span>${escapeHtml(t('delivery_label'))}</span><span>${totals.deliveryFee === 0 ? escapeHtml(t('free_label')) : escapeHtml(formatPrice(totals.deliveryFee))}</span></div>
      <div class="summary-line total"><span>${escapeHtml(t('total_label'))}</span><span>${escapeHtml(formatPrice(totals.total))}</span></div>
    `;
  }

  function syncAfterCartChange() {
    updateCartIndicators();
    renderCatalog();
    if (!document.getElementById('cartDrawer').classList.contains('hidden')) {
      renderCartDrawer();
    }
  }

  /* ---------------- CHECKOUT FLOW ---------------- */
  function openCheckoutModal(preselectedBranch = '') {
    if (!STATE.cart.length) {
      UI.showToast(t('cart_empty_title'), 'error');
      return;
    }
    UI.closeDrawer('cartDrawer');

    let orderType = preselectedBranch ? 'pickup' : 'delivery';
    let paymentType = 'cash';
    let selectedAddressId = STATE.addresses.find((a) => a.isDefault)?.id || null;

    const branches = STATE.info.branches || [];

    const renderCheckoutHtml = () => {
      const totals = STORE.getCartTotals(orderType);
      const savedAddressesHtml =
        orderType === 'delivery' && STATE.user && STATE.addresses.length
          ? `<div class="form-field full">
               <label>${STATE.lang === 'ru' ? 'Сохранённые адреса' : 'Saqlangan manzillar'}</label>
               <div class="saved-address-chips">
                 ${STATE.addresses
                   .map(
                     (a) => `<button type="button" class="saved-address-chip ${selectedAddressId === a.id ? 'active' : ''}" data-pick-addr="${a.id}">${escapeHtml(a.label)}: ${escapeHtml(a.streetAddress)}</button>`
                   )
                   .join('')}
               </div>
             </div>`
          : '';

      const defaultAddrObj = STATE.addresses.find((a) => a.id === selectedAddressId);
      const defaultAddrText = defaultAddrObj
        ? [defaultAddrObj.streetAddress, defaultAddrObj.apartment ? `kv. ${defaultAddrObj.apartment}` : ''].filter(Boolean).join(', ')
        : '';

      return `
        <h2 class="modal-title">${escapeHtml(t('checkout_title'))}</h2>
        <p class="modal-subtitle">${STATE.cart.length} ${STATE.lang === 'ru' ? 'позиций' : 'xil taom'} &bull; ${escapeHtml(formatPrice(totals.total))}</p>

        <form id="checkoutForm">
          <div class="choice-cards" id="orderTypeChoices">
            <button type="button" class="choice-card ${orderType === 'delivery' ? 'active' : ''}" data-order-type="delivery">&#128666; ${escapeHtml(t('order_type_delivery'))}</button>
            <button type="button" class="choice-card ${orderType === 'pickup' ? 'active' : ''}" data-order-type="pickup">&#127978; ${escapeHtml(t('order_type_pickup'))}</button>
          </div>

          <div class="form-grid">
            <div class="form-field">
              <label>${escapeHtml(t('customer_name'))} *</label>
              <input type="text" name="customerName" required value="${escapeHtml(STATE.user?.fullName || '')}" placeholder="Azizbek" />
            </div>
            <div class="form-field">
              <label>${escapeHtml(t('customer_phone'))} *</label>
              <input type="tel" name="customerPhone" required value="${escapeHtml(STATE.user?.phone || '+998 ')}" placeholder="+998 90 123 45 67" />
            </div>

            ${savedAddressesHtml}

            ${
              orderType === 'delivery'
                ? `<div class="form-field full">
                     <label>${escapeHtml(t('delivery_address'))} *</label>
                     <input type="text" name="deliveryAddress" id="checkoutAddressInput" required value="${escapeHtml(defaultAddrText)}" placeholder="${STATE.lang === 'ru' ? 'Улица, дом, квартира, ориентир...' : 'Ko\'cha, uy, xonadon, mo\'ljal...'}" />
                   </div>`
                : `<div class="form-field full">
                     <label>${escapeHtml(t('pickup_branch'))} *</label>
                     <select name="branchName" required>
                       ${branches
                         .map((b) => {
                           const name = langField(b, 'name');
                           const sel = preselectedBranch === b.nameUz || preselectedBranch === name ? 'selected' : '';
                           return `<option value="${escapeHtml(name)}" ${sel}>${escapeHtml(name)} (${escapeHtml(langField(b, 'address'))})</option>`;
                         })
                         .join('')}
                     </select>
                   </div>`
            }
          </div>

          <div class="form-field">
            <label>${escapeHtml(t('payment_type'))}</label>
            <div class="choice-cards cols-4" id="paymentChoices">
              <button type="button" class="choice-card ${paymentType === 'cash' ? 'active' : ''}" data-payment="cash">${escapeHtml(t('pay_cash'))}</button>
              <button type="button" class="choice-card ${paymentType === 'card' ? 'active' : ''}" data-payment="card">${escapeHtml(t('pay_card'))}</button>
              <button type="button" class="choice-card ${paymentType === 'payme' ? 'active' : ''}" data-payment="payme">${escapeHtml(t('pay_payme'))}</button>
              <button type="button" class="choice-card ${paymentType === 'click' ? 'active' : ''}" data-payment="click">${escapeHtml(t('pay_click'))}</button>
            </div>
          </div>

          <div class="form-field">
            <label>${escapeHtml(t('order_comment'))}</label>
            <textarea name="comment" rows="2" placeholder="${STATE.lang === 'ru' ? 'Домофон, без лука, звонить заранее...' : 'Domofon kodi, piyozsiz, oldindan qo\'ng\'iroq qiling...'}"></textarea>
          </div>

          <div class="cart-summary-lines" style="background:var(--bg); padding:12px 14px; border-radius:12px;">
            <div class="summary-line"><span>${escapeHtml(t('subtotal_label'))}</span><span>${escapeHtml(formatPrice(totals.subtotal))}</span></div>
            ${totals.discount > 0 ? `<div class="summary-line" style="color:var(--green-dark);"><span>${escapeHtml(t('discount_label'))}</span><span>-${escapeHtml(formatPrice(totals.discount))}</span></div>` : ''}
            <div class="summary-line"><span>${escapeHtml(t('delivery_label'))}</span><span>${totals.deliveryFee === 0 ? escapeHtml(t('free_label')) : escapeHtml(formatPrice(totals.deliveryFee))}</span></div>
            <div class="summary-line total"><span>${escapeHtml(t('total_label'))}</span><span>${escapeHtml(formatPrice(totals.total))}</span></div>
          </div>

          <button type="submit" class="btn-primary-full" id="submitOrderBtn">${escapeHtml(t('confirm_order'))}</button>
        </form>
      `;
    };

    const mountCheckout = () => {
      UI.openModal(renderCheckoutHtml());

      document.querySelectorAll('[data-order-type]').forEach((btn) => {
        btn.addEventListener('click', () => {
          orderType = btn.getAttribute('data-order-type');
          mountCheckout();
        });
      });

      document.querySelectorAll('[data-payment]').forEach((btn) => {
        btn.addEventListener('click', () => {
          paymentType = btn.getAttribute('data-payment');
          document.querySelectorAll('[data-payment]').forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
        });
      });

      document.querySelectorAll('[data-pick-addr]').forEach((btn) => {
        btn.addEventListener('click', () => {
          selectedAddressId = Number(btn.getAttribute('data-pick-addr'));
          const addr = STATE.addresses.find((a) => a.id === selectedAddressId);
          if (addr) {
            const full = [addr.streetAddress, addr.apartment ? `kv. ${addr.apartment}` : ''].filter(Boolean).join(', ');
            document.getElementById('checkoutAddressInput').value = full;
          }
          document.querySelectorAll('[data-pick-addr]').forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
        });
      });

      document.getElementById('checkoutForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('submitOrderBtn');
        const fd = new FormData(e.target);

        submitBtn.disabled = true;
        try {
          const res = await API.createOrder({
            customerName: fd.get('customerName'),
            customerPhone: fd.get('customerPhone'),
            deliveryAddress: fd.get('deliveryAddress') || null,
            addressId: selectedAddressId,
            branchName: fd.get('branchName') || null,
            orderType,
            paymentType,
            comment: fd.get('comment') || null,
            promoCode: STATE.appliedPromo?.promoCode || null,
            items: STATE.cart.map((c) => ({ productId: c.productId, quantity: c.quantity }))
          });

          STORE.clearCart();
          syncAfterCartChange();
          showOrderSuccessModal(res.data);
        } catch (err) {
          UI.showToast(err.message, 'error');
          submitBtn.disabled = false;
        }
      });
    };

    mountCheckout();
  }

  function showOrderSuccessModal(order) {
    const html = `
      <div style="text-align:center; padding:8px 0 14px;">
        <div style="font-size:3rem; margin-bottom:8px;">&#9989;</div>
        <h2 class="modal-title">${escapeHtml(t('order_success_title'))}</h2>
        <p class="modal-subtitle">${escapeHtml(t('order_number_label'))}: <strong style="color:var(--green-dark); font-size:1.1rem;">${escapeHtml(order.orderNumber)}</strong></p>
      </div>
      ${UI.renderStatusStepper(order.status)}
      <div class="order-card" style="margin-top:16px;">
        <div class="order-card-head">
          <strong>${escapeHtml(order.customerName)} (${escapeHtml(order.customerPhone)})</strong>
          <span class="status-badge status-${escapeHtml(order.status)}">${escapeHtml(getStatusLabel(order.status))}</span>
        </div>
        <p style="font-size:0.88rem; color:var(--text-muted); margin-bottom:10px;">
          ${order.orderType === 'delivery' ? escapeHtml(order.deliveryAddress) : escapeHtml(order.branchName)}
        </p>
        ${(order.items || [])
          .map(
            (it) => `<div class="summary-line" style="font-size:0.86rem;">
              <span>${escapeHtml(STATE.lang === 'ru' ? it.productNameRu : it.productNameUz)} &times; ${it.quantity}</span>
              <strong>${escapeHtml(formatPrice(it.totalPrice))}</strong>
            </div>`
          )
          .join('')}
        <div class="summary-line total" style="margin-top:8px;">
          <span>${escapeHtml(t('total_label'))}</span>
          <span>${escapeHtml(formatPrice(order.totalAmount))}</span>
        </div>
      </div>
      <button type="button" class="btn-primary-full" id="closeSuccessModalBtn">${escapeHtml(t('back_to_menu'))}</button>
    `;
    UI.openModal(html, { narrow: true });
    document.getElementById('closeSuccessModalBtn').addEventListener('click', UI.closeModal);
  }

  /* ---------------- AUTH & USER PANEL ---------------- */
  function updateAccountButton() {
    const btn = document.getElementById('accountBtn');
    const label = document.getElementById('accountBtnLabel');
    if (STATE.user) {
      btn.classList.add('logged-in');
      label.textContent = STATE.user.fullName.split(' ')[0];
    } else {
      btn.classList.remove('logged-in');
      label.textContent = t('login_btn');
    }
  }

  function openAuthModal(defaultTab = 'login') {
    let tab = defaultTab;
    const render = () => {
      const html = `
        <div class="tab-pills">
          <button type="button" class="tab-pill-btn ${tab === 'login' ? 'active' : ''}" data-auth-tab="login">${escapeHtml(t('auth_login_tab'))}</button>
          <button type="button" class="tab-pill-btn ${tab === 'register' ? 'active' : ''}" data-auth-tab="register">${escapeHtml(t('auth_register_tab'))}</button>
        </div>
        ${
          tab === 'login'
            ? `<h2 class="modal-title">${escapeHtml(t('auth_login_tab'))}</h2>
               <p class="modal-subtitle">${STATE.lang === 'ru' ? 'Войдите по номеру телефона или email' : 'Telefon raqami yoki email orqali kiring'}</p>
               <form id="userLoginForm">
                 <div class="form-field">
                   <label>${STATE.lang === 'ru' ? 'Телефон или Email' : 'Telefon yoki Email'}</label>
                   <input type="text" name="login" required placeholder="+998901234567" />
                 </div>
                 <div class="form-field">
                   <label>${STATE.lang === 'ru' ? 'Пароль' : 'Parol'}</label>
                   <input type="password" name="password" required placeholder="••••••••" />
                 </div>
                 <button type="submit" class="btn-primary-full">${escapeHtml(t('auth_login_tab'))}</button>
               </form>`
            : `<h2 class="modal-title">${escapeHtml(t('auth_register_tab'))}</h2>
               <p class="modal-subtitle">${STATE.lang === 'ru' ? 'Создайте личный аккаунт MAZZA' : 'MAZZA shaxsiy hisobingizni yarating'}</p>
               <form id="userRegisterForm">
                 <div class="form-field">
                   <label>${escapeHtml(t('customer_name'))} *</label>
                   <input type="text" name="fullName" required placeholder="Azizbek Karimov" />
                 </div>
                 <div class="form-field">
                   <label>${escapeHtml(t('customer_phone'))} *</label>
                   <input type="tel" name="phone" required placeholder="+998 90 123 45 67" />
                 </div>
                 <div class="form-field">
                   <label>Email (${STATE.lang === 'ru' ? 'необязательно' : 'ixtiyoriy'})</label>
                   <input type="email" name="email" placeholder="example@mail.uz" />
                 </div>
                 <div class="form-field">
                   <label>${STATE.lang === 'ru' ? 'Пароль (мин. 6 символов)' : 'Parol (kamida 6 belgi)'} *</label>
                   <input type="password" name="password" minlength="6" required placeholder="••••••••" />
                 </div>
                 <button type="submit" class="btn-primary-full">${escapeHtml(t('auth_register_tab'))}</button>
               </form>`
        }
      `;
      UI.openModal(html, { narrow: true });

      document.querySelectorAll('[data-auth-tab]').forEach((b) => {
        b.addEventListener('click', () => {
          tab = b.getAttribute('data-auth-tab');
          render();
        });
      });

      document.getElementById('userLoginForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        try {
          const res = await API.login({ login: fd.get('login'), password: fd.get('password') });
          localStorage.setItem('mazza_user_token', res.data.token);
          STATE.user = res.data.user;
          await restoreUserSession();
          UI.showToast(res.message);
          openUserAccountModal('profile');
        } catch (err) {
          UI.showToast(err.message, 'error');
        }
      });

      document.getElementById('userRegisterForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        try {
          const res = await API.register({
            fullName: fd.get('fullName'),
            phone: fd.get('phone'),
            email: fd.get('email'),
            password: fd.get('password'),
            preferredLanguage: STATE.lang
          });
          localStorage.setItem('mazza_user_token', res.data.token);
          STATE.user = res.data.user;
          await restoreUserSession();
          UI.showToast(res.message);
          openUserAccountModal('profile');
        } catch (err) {
          UI.showToast(err.message, 'error');
        }
      });
    };
    render();
  }

  async function openUserAccountModal(activeTab = 'profile') {
    let tab = activeTab;
    try {
      const [addrRes, ordRes] = await Promise.all([API.getAddresses(), API.getMyOrders()]);
      STATE.addresses = addrRes.data || [];
      STATE.myOrders = ordRes.data || [];
    } catch (_err) {
      // ignore if partial
    }

    const render = () => {
      let bodyHtml = '';
      if (tab === 'profile') {
        bodyHtml = `
          <form id="profileUpdateForm" style="margin-bottom:20px;">
            <div class="form-grid">
              <div class="form-field">
                <label>${escapeHtml(t('customer_name'))}</label>
                <input type="text" name="fullName" required value="${escapeHtml(STATE.user.fullName)}" />
              </div>
              <div class="form-field">
                <label>${escapeHtml(t('customer_phone'))}</label>
                <input type="tel" name="phone" required value="${escapeHtml(STATE.user.phone)}" />
              </div>
              <div class="form-field full">
                <label>Email</label>
                <input type="email" name="email" value="${escapeHtml(STATE.user.email || '')}" />
              </div>
            </div>
            <button type="submit" class="btn-primary">${STATE.lang === 'ru' ? 'Сохранить данные' : 'Ma\'lumotlarni saqlash'}</button>
          </form>
          <form id="changePasswordForm" class="info-card">
            <h4 style="margin-bottom:10px;">${STATE.lang === 'ru' ? 'Сменить пароль' : 'Parolni o\'zgartirish'}</h4>
            <div class="form-grid">
              <div class="form-field">
                <label>${STATE.lang === 'ru' ? 'Текущий пароль' : 'Joriy parol'}</label>
                <input type="password" name="currentPassword" required />
              </div>
              <div class="form-field">
                <label>${STATE.lang === 'ru' ? 'Новый пароль' : 'Yangi parol'}</label>
                <input type="password" name="newPassword" minlength="6" required />
              </div>
            </div>
            <button type="submit" class="btn-secondary">${STATE.lang === 'ru' ? 'Обновить пароль' : 'Parolni yangilash'}</button>
          </form>
        `;
      } else if (tab === 'orders') {
        bodyHtml = STATE.myOrders.length
          ? STATE.myOrders
              .map(
                (o) => `
              <div class="order-card">
                <div class="order-card-head">
                  <div>
                    <strong>${escapeHtml(o.orderNumber)}</strong>
                    <span style="color:var(--text-light); font-size:0.8rem; margin-left:8px;">${new Date(o.createdAt).toLocaleString()}</span>
                  </div>
                  <span class="status-badge status-${escapeHtml(o.status)}">${escapeHtml(getStatusLabel(o.status))}</span>
                </div>
                ${UI.renderStatusStepper(o.status)}
                <div style="font-size:0.85rem; color:var(--text-muted); margin-bottom:8px;">
                  ${(o.items || []).map((i) => `${escapeHtml(STATE.lang === 'ru' ? i.productNameRu : i.productNameUz)} &times; ${i.quantity}`).join(', ')}
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <strong>${escapeHtml(formatPrice(o.totalAmount))}</strong>
                  ${['new', 'accepted'].includes(o.status) ? `<button type="button" class="cart-remove-btn" data-cancel-order="${o.id}">${STATE.lang === 'ru' ? 'Отменить заказ' : 'Buyurtmani bekor qilish'}</button>` : ''}
                </div>
              </div>
            `
              )
              .join('')
          : `<p style="color:var(--text-muted);">${STATE.lang === 'ru' ? 'У вас пока нет заказов.' : 'Sizda hali buyurtmalar mavjud emas.'}</p>`;
      } else if (tab === 'addresses') {
        bodyHtml = `
          <div style="margin-bottom:16px;">
            ${
              STATE.addresses.length
                ? STATE.addresses
                    .map(
                      (a) => `
                    <div class="order-card" style="display:flex; justify-content:space-between; align-items:center; gap:12px;">
                      <div>
                        <strong>${escapeHtml(a.label)}</strong> ${a.isDefault ? `<span class="mini-tag">${STATE.lang === 'ru' ? 'Основной' : 'Asosiy'}</span>` : ''}
                        <div style="font-size:0.86rem; color:var(--text-muted);">${escapeHtml(a.streetAddress)} ${a.apartment ? `, kv. ${escapeHtml(a.apartment)}` : ''}</div>
                      </div>
                      <button type="button" class="cart-remove-btn" data-del-addr="${a.id}">${STATE.lang === 'ru' ? 'Удалить' : 'O\'chirish'}</button>
                    </div>
                  `
                    )
                    .join('')
                : `<p style="color:var(--text-muted); margin-bottom:12px;">${STATE.lang === 'ru' ? 'Сохранённых адресов пока нет.' : 'Saqlangan manzillar hozircha yo\'q.'}</p>`
            }
          </div>
          <form id="addAddressForm" class="info-card">
            <h4 style="margin-bottom:10px;">${STATE.lang === 'ru' ? 'Добавить новый адрес' : 'Yangi manzil qo\'shish'}</h4>
            <div class="form-grid">
              <div class="form-field">
                <label>${STATE.lang === 'ru' ? 'Название (Дом, Офис)' : 'Nomi (Uy, Ishxona)'} *</label>
                <input type="text" name="label" required placeholder="Uy" />
              </div>
              <div class="form-field">
                <label>${STATE.lang === 'ru' ? 'Квартира / Офис' : 'Xonadon / Ofis'}</label>
                <input type="text" name="apartment" placeholder="28" />
              </div>
              <div class="form-field full">
                <label>${STATE.lang === 'ru' ? 'Улица и дом' : 'Ko\'cha va uy raqami'} *</label>
                <input type="text" name="streetAddress" required placeholder="Chilonzor 9-kvartal, 14-uy" />
              </div>
            </div>
            <button type="submit" class="btn-primary">${STATE.lang === 'ru' ? 'Добавить адрес' : 'Manzilni saqlash'}</button>
          </form>
        `;
      }

      const html = `
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:14px;">
          <h2 class="modal-title" style="margin:0;">${escapeHtml(t('account_title'))}</h2>
          <button type="button" class="btn-secondary" id="userLogoutBtn">${escapeHtml(t('logout_btn'))}</button>
        </div>
        <div class="tab-pills">
          <button type="button" class="tab-pill-btn ${tab === 'profile' ? 'active' : ''}" data-acc-tab="profile">${escapeHtml(t('account_profile_tab'))}</button>
          <button type="button" class="tab-pill-btn ${tab === 'orders' ? 'active' : ''}" data-acc-tab="orders">${escapeHtml(t('account_orders_tab'))} (${STATE.myOrders.length})</button>
          <button type="button" class="tab-pill-btn ${tab === 'addresses' ? 'active' : ''}" data-acc-tab="addresses">${escapeHtml(t('account_addresses_tab'))} (${STATE.addresses.length})</button>
        </div>
        <div>${bodyHtml}</div>
      `;

      UI.openModal(html);

      document.querySelectorAll('[data-acc-tab]').forEach((b) => {
        b.addEventListener('click', () => {
          tab = b.getAttribute('data-acc-tab');
          render();
        });
      });

      document.getElementById('userLogoutBtn')?.addEventListener('click', () => {
        localStorage.removeItem('mazza_user_token');
        STATE.user = null;
        STATE.addresses = [];
        STATE.myOrders = [];
        updateAccountButton();
        UI.closeModal();
        UI.showToast(STATE.lang === 'ru' ? 'Вы вышли из аккаунта' : 'Hisobdan chiqdingiz');
      });

      document.getElementById('profileUpdateForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        try {
          const res = await API.updateProfile({
            fullName: fd.get('fullName'),
            phone: fd.get('phone'),
            email: fd.get('email')
          });
          STATE.user = res.data;
          updateAccountButton();
          UI.showToast(res.message);
        } catch (err) {
          UI.showToast(err.message, 'error');
        }
      });

      document.getElementById('changePasswordForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        try {
          const res = await API.changePassword({
            currentPassword: fd.get('currentPassword'),
            newPassword: fd.get('newPassword')
          });
          e.target.reset();
          UI.showToast(res.message);
        } catch (err) {
          UI.showToast(err.message, 'error');
        }
      });

      document.querySelectorAll('[data-cancel-order]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          try {
            await API.cancelMyOrder(btn.getAttribute('data-cancel-order'));
            const ordRes = await API.getMyOrders();
            STATE.myOrders = ordRes.data || [];
            render();
            UI.showToast(STATE.lang === 'ru' ? 'Заказ отменён' : 'Buyurtma bekor qilindi');
          } catch (err) {
            UI.showToast(err.message, 'error');
          }
        });
      });

      document.querySelectorAll('[data-del-addr]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          try {
            await API.deleteAddress(btn.getAttribute('data-del-addr'));
            const addrRes = await API.getAddresses();
            STATE.addresses = addrRes.data || [];
            render();
          } catch (err) {
            UI.showToast(err.message, 'error');
          }
        });
      });

      document.getElementById('addAddressForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        try {
          await API.createAddress({
            label: fd.get('label'),
            streetAddress: fd.get('streetAddress'),
            apartment: fd.get('apartment')
          });
          const addrRes = await API.getAddresses();
          STATE.addresses = addrRes.data || [];
          render();
          UI.showToast(STATE.lang === 'ru' ? 'Адрес сохранён' : 'Manzil saqlandi');
        } catch (err) {
          UI.showToast(err.message, 'error');
        }
      });
    };

    render();
  }

  /* ---------------- INFO & ORDER TRACKER MODALS ---------------- */
  function openBranchesModal() {
    const branches = STATE.info.branches || [];
    const html = `
      <h2 class="modal-title">${escapeHtml(t('nav_branches'))}</h2>
      <p class="modal-subtitle">${STATE.lang === 'ru' ? 'Выберите ближайший ресторан MAZZA для посещения или самовывоза' : 'Tashrif buyurish yoki olib ketish uchun eng yaqin MAZZA filialini tanlang'}</p>
      <div class="info-cards-grid">
        ${branches
          .map(
            (b) => `
            <div class="info-card">
              <div style="font-size:0.76rem; font-weight:700; color:var(--green-dark); margin-bottom:4px;">${escapeHtml(langField(b, 'city'))}</div>
              <h4>${escapeHtml(langField(b, 'name'))}</h4>
              <p>${escapeHtml(langField(b, 'address'))}</p>
              <p><strong>&#128338; ${escapeHtml(b.hours)}</strong> &bull; ${escapeHtml(b.phone)}</p>
              <div class="tag-row">
                ${(STATE.lang === 'ru' ? b.featuresRu : b.featuresUz).map((f) => `<span class="mini-tag">${escapeHtml(f)}</span>`).join('')}
              </div>
              <button type="button" class="btn-secondary" style="margin-top:12px; width:100%;" data-pickup-branch="${escapeHtml(langField(b, 'name'))}">
                ${STATE.lang === 'ru' ? 'Забрать отсюда' : 'Shu filialdan olib ketish'}
              </button>
            </div>
          `
          )
          .join('')}
      </div>
    `;
    UI.openModal(html);

    document.querySelectorAll('[data-pickup-branch]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const branchName = btn.getAttribute('data-pickup-branch');
        if (STATE.cart.length) {
          openCheckoutModal(branchName);
        } else {
          UI.closeModal();
          UI.showToast(`${branchName} — ${STATE.lang === 'ru' ? 'сначала добавьте блюда в корзину' : 'avval savatga taom qo\'shing'}`);
        }
      });
    });
  }

  function openVacanciesModal() {
    const vacancies = STATE.info.vacancies || [];
    const html = `
      <h2 class="modal-title">${escapeHtml(t('nav_vacancies'))}</h2>
      <p class="modal-subtitle">${STATE.lang === 'ru' ? 'Присоединяйтесь к дружной команде MAZZA' : 'Ahil MAZZA jamoasiga qo\'shiling!'}</p>
      <div class="info-cards-grid" style="margin-bottom:18px;">
        ${vacancies
          .map(
            (v) => `
            <div class="info-card">
              <h4>${escapeHtml(langField(v, 'title'))}</h4>
              <p style="color:var(--green-dark); font-weight:800;">${escapeHtml(langField(v, 'salary'))}</p>
              <p>${escapeHtml(langField(v, 'schedule'))}</p>
              <p>${escapeHtml(langField(v, 'requirements'))}</p>
            </div>
          `
          )
          .join('')}
      </div>
      <form id="vacancyApplyForm" class="info-card">
        <h4 style="margin-bottom:10px;">${STATE.lang === 'ru' ? 'Отправить анкету' : 'Tezkor ariza yuborish'}</h4>
        <div class="form-grid">
          <div class="form-field">
            <label>${escapeHtml(t('customer_name'))}</label>
            <input type="text" required placeholder="Alisher" />
          </div>
          <div class="form-field">
            <label>${escapeHtml(t('customer_phone'))}</label>
            <input type="tel" required placeholder="+998 90 123 45 67" />
          </div>
        </div>
        <button type="submit" class="btn-primary">${STATE.lang === 'ru' ? 'Отправить заявку' : 'Ariza yuborish'}</button>
      </form>
    `;
    UI.openModal(html);

    document.getElementById('vacancyApplyForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      UI.closeModal();
      UI.showToast(STATE.lang === 'ru' ? 'Заявка отправлена! HR свяжется с вами.' : 'Arizangiz qabul qilindi! HR bo\'limi tez orada bog\'lanadi.');
    });
  }

  function openAboutModal() {
    const about = (STATE.info.about && STATE.info.about[STATE.lang]) || STATE.info.about?.uz || {};
    const html = `
      <h2 class="modal-title">${escapeHtml(about.title || 'MAZZA')}</h2>
      <p class="modal-subtitle">${escapeHtml(about.lead || '')}</p>
      <div class="info-cards-grid">
        ${(about.highlights || [])
          .map(
            (item) => `
            <div class="info-card">
              <div style="color:var(--green); font-weight:800; margin-bottom:4px;">&#10004;</div>
              <p style="color:var(--text); font-weight:600; margin:0;">${escapeHtml(item)}</p>
            </div>
          `
          )
          .join('')}
      </div>
    `;
    UI.openModal(html);
  }

  function openOrderTrackerModal() {
    const html = `
      <h2 class="modal-title">${escapeHtml(t('nav_track'))}</h2>
      <p class="modal-subtitle">${STATE.lang === 'ru' ? 'Введите номер заказа и телефон для проверки статуса' : 'Buyurtma holatini ko\'rish uchun raqam va telefonni kiriting'}</p>
      <form id="orderTrackerForm">
        <div class="form-field">
          <label>${escapeHtml(t('order_number_label'))}</label>
          <input type="text" name="orderNumber" required placeholder="MZZ-261111-1001" />
        </div>
        <div class="form-field">
          <label>${escapeHtml(t('customer_phone'))}</label>
          <input type="tel" name="phone" required placeholder="+998901234567" />
        </div>
        <button type="submit" class="btn-primary-full">${STATE.lang === 'ru' ? 'Проверить статус' : 'Holatni tekshirish'}</button>
      </form>
      <div id="trackerResultBox" style="margin-top:16px;"></div>
    `;
    UI.openModal(html, { narrow: true });

    document.getElementById('orderTrackerForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const box = document.getElementById('trackerResultBox');
      try {
        const res = await API.trackOrder(fd.get('orderNumber'), fd.get('phone'));
        const o = res.data;
        box.innerHTML = `
          <div class="order-card">
            <div class="order-card-head">
              <strong>${escapeHtml(o.orderNumber)}</strong>
              <span class="status-badge status-${escapeHtml(o.status)}">${escapeHtml(getStatusLabel(o.status))}</span>
            </div>
            ${UI.renderStatusStepper(o.status)}
            <div style="font-size:0.86rem; color:var(--text-muted);">${escapeHtml(formatPrice(o.totalAmount))}</div>
          </div>
        `;
      } catch (err) {
        box.innerHTML = `<p style="color:var(--danger); font-size:0.88rem;">${escapeHtml(err.message)}</p>`;
      }
    });
  }

  /* ---------------- EVENT BINDING ---------------- */
  function bindStaticEvents() {
    window.addEventListener('scroll', () => {
      document.getElementById('mainHeader').classList.toggle('scrolled', window.scrollY > 12);
    });

    // Brand logo resets catalog
    document.getElementById('brandLogo').addEventListener('click', (e) => {
      e.preventDefault();
      resetAllFilters();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Language switchers
    document.querySelectorAll('.lang-btn, .lang-btn-mobile').forEach((btn) => {
      btn.addEventListener('click', () => {
        STATE.lang = btn.getAttribute('data-lang');
        localStorage.setItem('mazza_lang', STATE.lang);
        applyStaticTranslations();
        renderBanners();
        renderCatalog();
        updateCartIndicators();
        if (!document.getElementById('cartDrawer').classList.contains('hidden')) {
          renderCartDrawer();
        }
      });
    });

    // Header & Utility actions
    document.body.addEventListener('click', (e) => {
      const actionEl = e.target.closest('[data-action]');
      if (actionEl) {
        const action = actionEl.getAttribute('data-action');
        if (action === 'open-branches') { UI.closeDrawer('mobileNavDrawer'); openBranchesModal(); }
        else if (action === 'open-vacancies') { UI.closeDrawer('mobileNavDrawer'); openVacanciesModal(); }
        else if (action === 'open-about') { UI.closeDrawer('mobileNavDrawer'); openAboutModal(); }
        else if (action === 'open-tracker') { UI.closeDrawer('mobileNavDrawer'); openOrderTrackerModal(); }
        else if (action === 'toggle-kids') {
          UI.closeDrawer('mobileNavDrawer');
          STATE.kidsMode = !STATE.kidsMode;
          STATE.searchQuery = '';
          STATE.activeCategorySlug = 'all';
          document.getElementById('kidsMenuBtn').classList.toggle('active', STATE.kidsMode);
          loadCatalogProducts();
          document.getElementById('productsContent').scrollIntoView({ behavior: 'smooth' });
        } else if (action === 'open-product') {
          openProductModal(actionEl.getAttribute('data-id'));
        } else if (action === 'add-cart') {
          const id = Number(actionEl.getAttribute('data-id'));
          const prod = STATE.products.find((p) => p.id === id) || STATE.allProductsCache.find((p) => p.id === id);
          if (prod) {
            STORE.addToCart(prod, 1);
            syncAfterCartChange();
            UI.showToast(`${langField(prod, 'name')} — ${t('cart_btn')}`);
          }
        } else if (action === 'inc-cart') {
          STORE.updateCartQuantity(actionEl.getAttribute('data-id'), 1);
          syncAfterCartChange();
        } else if (action === 'dec-cart') {
          STORE.updateCartQuantity(actionEl.getAttribute('data-id'), -1);
          syncAfterCartChange();
        }
      }

      const catBtn = e.target.closest('[data-category]');
      if (catBtn) {
        selectCategory(catBtn.getAttribute('data-category'));
      }

      const bannerSlide = e.target.closest('[data-banner-idx]');
      if (bannerSlide) {
        handleBannerClick(Number(bannerSlide.getAttribute('data-banner-idx')));
      }

      const dotBtn = e.target.closest('[data-dot]');
      if (dotBtn) {
        goToBanner(Number(dotBtn.getAttribute('data-dot')));
      }

      const copyCodeEl = e.target.closest('[data-copy-code]');
      if (copyCodeEl) {
        const code = copyCodeEl.getAttribute('data-copy-code');
        navigator.clipboard?.writeText(code).catch(() => {});
        document.getElementById('cartPromoInput').value = code;
        UI.showToast(`${t('promo_copied')}: ${code}`);
      }

      const closeTarget = e.target.closest('[data-close]');
      if (closeTarget) {
        UI.closeDrawer(closeTarget.getAttribute('data-close'));
      }

      const acCat = e.target.closest('[data-ac-category]');
      if (acCat) {
        hideAutocomplete();
        selectCategory(acCat.getAttribute('data-ac-category'));
      }

      const acProd = e.target.closest('[data-ac-product]');
      if (acProd) {
        hideAutocomplete();
        openProductModal(acProd.getAttribute('data-ac-product'));
      }

      // Cart drawer buttons
      const cartDec = e.target.closest('[data-cart-dec]');
      if (cartDec) { STORE.updateCartQuantity(cartDec.getAttribute('data-cart-dec'), -1); syncAfterCartChange(); }
      const cartInc = e.target.closest('[data-cart-inc]');
      if (cartInc) { STORE.updateCartQuantity(cartInc.getAttribute('data-cart-inc'), 1); syncAfterCartChange(); }
      const cartRem = e.target.closest('[data-cart-remove]');
      if (cartRem) { STORE.removeFromCart(cartRem.getAttribute('data-cart-remove')); syncAfterCartChange(); }
    });

    // Search events
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', handleSearchInput);
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        hideAutocomplete();
        STATE.searchQuery = searchInput.value.trim();
        STATE.kidsMode = false;
        STATE.activeCategorySlug = 'all';
        loadCatalogProducts();
      }
    });

    document.getElementById('searchClearBtn').addEventListener('click', () => {
      hideAutocomplete();
      resetAllFilters();
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('#headerSearchWrap')) {
        hideAutocomplete();
      }
    });

    document.getElementById('mobileSearchToggle').addEventListener('click', () => {
      const wrap = document.getElementById('headerSearchWrap');
      wrap.classList.toggle('mobile-open');
      if (wrap.classList.contains('mobile-open')) searchInput.focus();
    });

    // Banner arrows + hover pause + touch swipe
    document.getElementById('bannerPrev').addEventListener('click', () => goToBanner(bannerIndex - 1));
    document.getElementById('bannerNext').addEventListener('click', () => goToBanner(bannerIndex + 1));
    const carousel = document.getElementById('bannerCarousel');
    carousel.addEventListener('mouseenter', stopBannerAutoPlay);
    carousel.addEventListener('mouseleave', startBannerAutoPlay);

    let touchStartX = 0;
    carousel.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
    carousel.addEventListener('touchend', (e) => {
      const diff = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(diff) > 45) {
        goToBanner(diff < 0 ? bannerIndex + 1 : bannerIndex - 1);
      }
    }, { passive: true });

    // Filter reset buttons
    document.getElementById('resetFiltersBtn').addEventListener('click', resetAllFilters);
    document.getElementById('clearCatalogStatusBtn').addEventListener('click', resetAllFilters);

    // Promo copy button in sidebar
    document.getElementById('copyPromoBtn').addEventListener('click', (e) => {
      const code = e.currentTarget.getAttribute('data-code');
      navigator.clipboard?.writeText(code).catch(() => {});
      document.getElementById('cartPromoInput').value = code;
      UI.showToast(`${t('promo_copied')}: ${code}`);
    });

    // Cart Drawer open/close & promo apply
    document.getElementById('openCartBtn').addEventListener('click', () => {
      renderCartDrawer();
      UI.openDrawer('cartDrawer');
    });
    document.getElementById('mobileOpenCartBtn').addEventListener('click', () => {
      renderCartDrawer();
      UI.openDrawer('cartDrawer');
    });
    document.getElementById('cartDrawer').addEventListener('click', (e) => {
      if (e.target.id === 'cartDrawer') UI.closeDrawer('cartDrawer');
    });

    document.getElementById('applyPromoBtn').addEventListener('click', async () => {
      const code = document.getElementById('cartPromoInput').value.trim();
      if (!code) return;
      const totals = STORE.getCartTotals('delivery');
      try {
        const res = await API.validatePromo(code, totals.subtotal);
        STATE.appliedPromo = res.data.promotion;
        STORE.savePromo();
        renderCartDrawer();
        updateCartIndicators();
        UI.showToast(`${STATE.appliedPromo.promoCode} ${STATE.lang === 'ru' ? 'применён!' : 'qo\'llanildi!'}`);
      } catch (err) {
        UI.showToast(err.message, 'error');
      }
    });

    document.getElementById('proceedCheckoutBtn').addEventListener('click', () => openCheckoutModal());

    // Mobile Nav Drawer
    document.getElementById('mobileMenuBtn').addEventListener('click', () => UI.openDrawer('mobileNavDrawer'));
    document.getElementById('mobileNavDrawer').addEventListener('click', (e) => {
      if (e.target.id === 'mobileNavDrawer') UI.closeDrawer('mobileNavDrawer');
    });

    // Account Button
    document.getElementById('accountBtn').addEventListener('click', () => {
      if (STATE.user) {
        openUserAccountModal('profile');
      } else {
        openAuthModal('login');
      }
    });

    // Modal Close
    document.getElementById('appModalClose').addEventListener('click', UI.closeModal);
    document.getElementById('appModal').addEventListener('click', (e) => {
      if (e.target.id === 'appModal') UI.closeModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        UI.closeModal();
        UI.closeDrawer('cartDrawer');
        UI.closeDrawer('mobileNavDrawer');
      }
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
