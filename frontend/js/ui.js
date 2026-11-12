function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function showToast(message, type = 'success') {
  const stack = document.getElementById('toastContainer');
  if (!stack) return;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  stack.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(6px)';
    setTimeout(() => toast.remove(), 220);
  }, 3000);
}

function openModal(html, { narrow = false } = {}) {
  const backdrop = document.getElementById('appModal');
  const dialog = document.getElementById('appModalDialog');
  const content = document.getElementById('appModalContent');
  dialog.classList.toggle('modal-narrow', narrow);
  content.innerHTML = html;
  backdrop.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  const backdrop = document.getElementById('appModal');
  backdrop.classList.add('hidden');
  document.body.style.overflow = '';
}

function openDrawer(drawerId) {
  const el = document.getElementById(drawerId);
  if (el) {
    el.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }
}

function closeDrawer(drawerId) {
  const el = document.getElementById(drawerId);
  if (el) {
    el.classList.add('hidden');
    document.body.style.overflow = '';
  }
}

function getBadgeClass(product) {
  if (product.isKids) return 'badge-kids';
  if (product.isPromo || product.oldPrice) return 'badge-promo';
  if (product.isNew) return 'badge-new';
  return '';
}

function renderProductCard(product) {
  const qty = window.MAZZA_STORE.getCartItemQuantity(product.id);
  const name = escapeHtml(langField(product, 'name'));
  const desc = escapeHtml(langField(product, 'description'));
  const volume = escapeHtml(langField(product, 'volume'));
  const badge = escapeHtml(langField(product, 'badge'));

  const actionHtml =
    qty > 0
      ? `<div class="card-qty-stepper" data-product-id="${product.id}">
           <button type="button" data-action="dec-cart" data-id="${product.id}" aria-label="-">&minus;</button>
           <span>${qty}</span>
           <button type="button" data-action="inc-cart" data-id="${product.id}" aria-label="+">+</button>
         </div>`
      : `<button type="button" class="btn-add-cart" data-action="add-cart" data-id="${product.id}">
           <span>${escapeHtml(t('add_to_cart'))}</span>
         </button>`;

  return `
    <article class="product-card" data-product-id="${product.id}">
      <div class="product-media" data-action="open-product" data-id="${product.id}">
        ${badge ? `<span class="product-badge ${getBadgeClass(product)}">${badge}</span>` : ''}
        <img src="${escapeHtml(product.imageUrl)}" alt="${name}" loading="lazy" />
      </div>
      <div class="product-body">
        <h3 class="product-title" data-action="open-product" data-id="${product.id}">${name}</h3>
        <p class="product-desc">${desc}</p>
        <div class="product-meta">
          <span>${volume}</span>
          ${product.calories ? `<span>&bull;</span><span>${product.calories} ${escapeHtml(t('calories_unit'))}</span>` : ''}
        </div>
        <div class="product-price-row">
          <span class="product-price">${escapeHtml(formatPrice(product.price))}</span>
          ${product.oldPrice && product.oldPrice > product.price ? `<span class="product-old-price">${escapeHtml(formatPrice(product.oldPrice))}</span>` : ''}
        </div>
        ${actionHtml}
      </div>
    </article>
  `;
}

function renderStatusStepper(status) {
  if (status === 'cancelled') {
    return `<div class="status-badge status-cancelled" style="margin: 10px 0;">${escapeHtml(getStatusLabel('cancelled'))}</div>`;
  }
  const steps = ['new', 'accepted', 'preparing', 'delivering', 'completed'];
  const currentIdx = steps.indexOf(status);

  return `
    <div class="status-stepper">
      ${steps
        .map((step, idx) => {
          const isDone = idx < currentIdx || status === 'completed';
          const isCurrent = idx === currentIdx && status !== 'completed';
          const cls = isDone ? 'done' : isCurrent ? 'current' : '';
          return `
            <div class="stepper-step ${cls}">
              <div class="stepper-dot">${isDone ? '&#10003;' : idx + 1}</div>
              <div class="stepper-label">${escapeHtml(getStatusLabel(step))}</div>
            </div>
          `;
        })
        .join('')}
    </div>
  `;
}

window.MAZZA_UI = {
  escapeHtml,
  showToast,
  openModal,
  closeModal,
  openDrawer,
  closeDrawer,
  renderProductCard,
  renderStatusStepper
};
