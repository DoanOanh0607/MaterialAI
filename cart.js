/* Material AI — floating cart + checkout widget, backed by a per-customer
   server-side cart (requires a logged-in customer account). Placing an order
   snapshots the cart items for one seller into a real order record (with
   status tracking) and clears them from the cart. Payment is COD or manual
   bank transfer only — no online payment gateway is integrated. */
(function () {
  var TEX_COLORS = {
    'tex-son-1': 'linear-gradient(160deg,#9CB09E,#647B6C)',
    'tex-son-2': 'linear-gradient(160deg,#9BAEBD,#64798C)',
    'tex-son-3': 'linear-gradient(160deg,#C79170,#8F5D3D)',
    'tex-son-4': 'linear-gradient(160deg,#D9CDB6,#A89571)',
    'tex-kinh-1': 'linear-gradient(160deg,#eaf6ff,#a9d3f2)',
    'tex-go-1': 'linear-gradient(90deg,#a9713f,#96602f)'
  };

  var HINT_KEY = 'materialai_customer_hint';

  var cartCache = [];
  var authUser = null;      // logged-in customer, or null
  var authChecked = false;

  function readHint() {
    try { return JSON.parse(localStorage.getItem(HINT_KEY)); } catch (e) { return null; }
  }
  function writeHint(user) {
    try {
      if (user) localStorage.setItem(HINT_KEY, JSON.stringify({ name: user.name, email: user.email }));
      else localStorage.removeItem(HINT_KEY);
    } catch (e) { /* localStorage unavailable — safe to ignore, just no optimistic render next load */ }
  }

  function el(html) {
    var t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }
  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function t(key, fallback) {
    return (window.I18N && window.I18N.t) ? window.I18N.t(key) : fallback;
  }

  function parsePrice(text) {
    var m = String(text || '').match(/([\d.,]+)/);
    return m ? parseInt(m[1].replace(/[^\d]/g, ''), 10) || 0 : 0;
  }
  function formatVND(n) { return n.toLocaleString('vi-VN') + 'đ'; }

  function currentPage() {
    return window.location.pathname.split('/').pop() || 'materials.html';
  }
  function redirectToLogin() {
    window.location.href = 'login.html?next=' + encodeURIComponent(currentPage());
  }

  function initialsOf(name) {
    var parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    var letters = parts.length >= 2 ? [parts[0][0], parts[1][0]] : [parts[0][0], parts[0][1] || ''];
    return letters.join('').toUpperCase();
  }

  function renderNavIdentity() {
    var loginLinks = document.querySelectorAll('.nav-login-link');
    var customerBtns = document.querySelectorAll('.nav-customer-btn');
    if (authUser) {
      loginLinks.forEach(function (a) { a.classList.add('hidden'); });
      customerBtns.forEach(function (btn) {
        btn.classList.remove('hidden');
        btn.classList.add('flex');
        btn.title = t('common.logout', 'Đăng xuất');
        var avatar = btn.querySelector('.nav-customer-avatar');
        var name = btn.querySelector('.nav-customer-name');
        if (avatar) avatar.textContent = initialsOf(authUser.name || authUser.email);
        if (name) name.textContent = authUser.name || authUser.email;
      });
    } else {
      loginLinks.forEach(function (a) { a.classList.remove('hidden'); });
      customerBtns.forEach(function (btn) { btn.classList.add('hidden'); btn.classList.remove('flex'); });
    }
  }

  async function logoutCustomer() {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
    authUser = null; authChecked = true; cartCache = [];
    writeHint(null);
    updateBadge();
    renderNavIdentity();
    closeDrawer();
  }

  function closeCustomerMenu() {
    var menu = document.getElementById('customerMenu');
    if (menu) menu.classList.add('hidden');
  }

  function openCustomerMenu(btn) {
    var menu = document.getElementById('customerMenu');
    if (!menu) return;
    var rect = btn.getBoundingClientRect();
    var menuWidth = menu.offsetWidth || 224;
    var left = Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8);
    left = Math.max(8, left);
    menu.style.left = left + 'px';
    menu.style.top = (rect.bottom + 8) + 'px';
    menu.classList.remove('hidden');
  }

  function fmtOrderDate(iso) {
    if (!iso) return '';
    var d = new Date(iso.replace(' ', 'T') + 'Z');
    var locale = window.I18N && window.I18N.getLang() === 'en' ? 'en-US' : 'vi-VN';
    return d.toLocaleString(locale, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  var ORDER_STATUS_BADGE = {
    pending: 'bg-accent-50 text-accent-600',
    confirmed: 'bg-secondary-50 text-secondary',
    shipping: 'bg-secondary-50 text-secondary',
    completed: 'bg-green-50 text-green-700',
    cancelled: 'bg-red-50 text-red-600'
  };
  function orderStatusLabel(status) {
    return t('order_status.' + status, status);
  }
  function paymentMethodLabel(method) {
    return t('checkout.payment_' + (method === 'bank_transfer' ? 'bank' : 'cod'), method);
  }

  function orderCard(o) {
    var linesHtml = o.items.map(function (i) {
      return '<div class="flex items-center justify-between text-xs gap-2"><span class="truncate">' + escapeHtml(i.title) + ' × ' + i.qty + '</span><span class="text-muted shrink-0">' + escapeHtml(i.priceText || '') + '</span></div>';
    }).join('');
    var discountHtml = o.discount > 0
      ? '<div class="flex items-center justify-between text-xs text-green-700"><span>' + t('checkout.discount', 'Giảm giá') + (o.voucherCode ? ' (' + escapeHtml(o.voucherCode) + ')' : '') + '</span><span>−' + formatVND(o.discount) + '</span></div>'
      : '';
    return el(
      '<div class="border border-secondary-50 rounded-2xl p-4">' +
        '<div class="flex items-center justify-between mb-2 gap-2">' +
          '<p class="font-semibold text-sm truncate">' + escapeHtml(o.sellerName) + '</p>' +
          '<span class="text-[10px] font-semibold px-2.5 py-1 rounded-full shrink-0 ' + (ORDER_STATUS_BADGE[o.status] || 'bg-secondary-50 text-secondary') + '">' + escapeHtml(orderStatusLabel(o.status)) + '</span>' +
        '</div>' +
        '<p class="text-[11px] text-muted mb-2">' + fmtOrderDate(o.createdAt) + '</p>' +
        '<div class="space-y-1 mb-2">' + linesHtml + '</div>' +
        discountHtml +
        '<div class="flex items-center justify-between text-xs font-semibold pt-2 border-t border-secondary-50 mb-2">' +
          '<span>' + t('cart.grand_total', 'Tổng cộng') + '</span><span class="text-accent-600">' + formatVND(o.total) + '</span>' +
        '</div>' +
        '<p class="text-[11px] text-muted">' + escapeHtml(o.customerAddress) + ' · ' + escapeHtml(o.customerPhone) + '</p>' +
        '<p class="text-[11px] text-muted">' + paymentMethodLabel(o.paymentMethod) + '</p>' +
      '</div>'
    );
  }

  async function openOrdersModal() {
    document.getElementById('ordersTitle').textContent = t('nav_menu.order_history', 'Lịch sử đặt hàng');
    document.getElementById('ordersModal').classList.remove('hidden');
    var body = document.getElementById('ordersBody');
    body.innerHTML = '<div class="text-center text-sm text-muted py-6">' + t('orders.loading', 'Đang tải...') + '</div>';
    var data = await apiCart('/api/orders');
    if (!data) return;
    if (!data.orders.length) {
      body.innerHTML = '<div class="text-center text-sm text-muted py-6">' + t('orders.empty', 'Bạn chưa gửi yêu cầu mua nào.') + '</div>';
      return;
    }
    body.innerHTML = '';
    data.orders.forEach(function (o) { body.appendChild(orderCard(o)); });
  }
  function closeOrdersModal() { document.getElementById('ordersModal').classList.add('hidden'); }

  async function apiCart(url, options) {
    var res = await fetch(url, Object.assign({ credentials: 'same-origin' }, options || {}));
    if (res.status === 401 || res.status === 403) { redirectToLogin(); return null; }
    var data = await res.json().catch(function () { return {}; });
    if (!res.ok) throw new Error(data.error || 'Đã có lỗi xảy ra.');
    return data;
  }

  function fromServerItem(row) {
    return {
      id: row.itemKey, sellerId: row.sellerId, sellerName: row.sellerName,
      title: row.title, spec: row.spec, priceText: row.priceText,
      image: row.image, texClass: row.texClass, qty: row.qty
    };
  }

  async function ensureCustomerAuth() {
    if (authChecked) return authUser;
    try {
      var res = await fetch('/api/auth/me', { credentials: 'same-origin' });
      if (res.ok) {
        var data = await res.json();
        authUser = data.user.role === 'customer' ? data.user : null;
      } else {
        authUser = null;
      }
      writeHint(authUser);
    } catch (e) {
      // Network error, or the request was aborted because the page is
      // navigating away — we don't actually know the real auth state here,
      // so fall back to whatever hint is cached instead of confidently
      // overwriting it with "logged out" (that previously wiped a good
      // cached identity right before the next page load could use it).
      authUser = readHint();
    }
    authChecked = true;
    return authUser;
  }

  async function refreshFromServer() {
    // Render last-known state immediately (no flash of the wrong nav item
    // while the real /api/auth/me round-trip is in flight), then confirm.
    var hint = readHint();
    if (hint) { authUser = hint; renderNavIdentity(); }
    var user = await ensureCustomerAuth();
    renderNavIdentity();
    if (!user) { cartCache = []; updateBadge(); return; }
    var data = await apiCart('/api/cart');
    if (data) { cartCache = data.items.map(fromServerItem); updateBadge(); }
  }

  async function addItem(item) {
    var user = await ensureCustomerAuth();
    if (!user) { redirectToLogin(); return false; }
    var data = await apiCart('/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        itemKey: item.id, sellerId: item.sellerId, sellerName: item.sellerName,
        title: item.title, spec: item.spec, priceText: item.priceText,
        image: item.image, texClass: item.texClass, qty: item.qty || 1
      })
    });
    if (!data) return false;
    cartCache = data.items.map(fromServerItem);
    updateBadge();
    return true;
  }

  async function setQty(id, qty) {
    var data = await apiCart('/api/cart/' + encodeURIComponent(id), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qty: qty })
    });
    if (!data) return;
    cartCache = data.items.map(fromServerItem);
    renderBody();
  }
  async function removeItem(id) {
    var data = await apiCart('/api/cart/' + encodeURIComponent(id), { method: 'DELETE' });
    if (!data) return;
    cartCache = data.items.map(fromServerItem);
    renderBody();
  }
  async function clearAll() {
    var data = await apiCart('/api/cart', { method: 'DELETE' });
    if (!data) return;
    cartCache = [];
    renderBody();
  }
  function totalQty() { return cartCache.reduce(function (s, i) { return s + i.qty; }, 0); }

  function updateBadge() {
    var badge = document.getElementById('cartBadge');
    if (!badge) return;
    var n = totalQty();
    if (n > 0) { badge.textContent = n > 9 ? '9+' : n; badge.classList.remove('hidden'); }
    else badge.classList.add('hidden');
  }

  function thumbHtml(item) {
    if (item.image) return '<img src="' + escapeHtml(item.image) + '" alt="" class="w-full h-full object-cover">';
    var bg = TEX_COLORS[item.texClass] || '#E3DFDA';
    return '<div class="w-full h-full" style="background:' + bg + '"></div>';
  }

  function itemRow(item) {
    return el(
      '<div class="flex items-center gap-3">' +
        '<div class="w-12 h-12 rounded-lg shrink-0 bg-secondary-50 overflow-hidden">' + thumbHtml(item) + '</div>' +
        '<div class="flex-1 min-w-0">' +
          '<p class="text-xs font-semibold truncate">' + escapeHtml(item.title) + '</p>' +
          '<p class="text-[11px] text-muted truncate">' + escapeHtml(item.spec || '') + '</p>' +
          '<div class="flex items-center gap-2 mt-1">' +
            '<button type="button" class="cart-qty-btn w-5 h-5 rounded-full border border-secondary-100 text-xs leading-none flex items-center justify-center" data-id="' + escapeHtml(item.id) + '" data-delta="-1">−</button>' +
            '<span class="text-xs font-semibold w-4 text-center">' + item.qty + '</span>' +
            '<button type="button" class="cart-qty-btn w-5 h-5 rounded-full border border-secondary-100 text-xs leading-none flex items-center justify-center" data-id="' + escapeHtml(item.id) + '" data-delta="1">+</button>' +
            '<span class="text-[11px] text-accent-600 font-semibold ml-auto">' + escapeHtml(item.priceText || '') + '</span>' +
          '</div>' +
        '</div>' +
        '<button type="button" class="cart-remove-btn text-muted hover:text-red-600 shrink-0 text-sm" data-id="' + escapeHtml(item.id) + '" aria-label="Xóa">✕</button>' +
      '</div>'
    );
  }

  function renderBody() {
    var titleEl = document.getElementById('cartPanelTitle');
    if (titleEl) titleEl.textContent = t('cart.title', 'Giỏ hàng của bạn');
    var items = cartCache;
    var body = document.getElementById('cartBody');
    var footer = document.getElementById('cartFooter');
    if (!body || !footer) return;
    if (!items.length) {
      body.innerHTML = '<div class="p-6 text-center text-sm text-muted">' + t('cart.empty', 'Giỏ hàng đang trống. Bấm "Thêm vào giỏ hàng" trên vật liệu bạn quan tâm.') + '</div>';
      footer.classList.add('hidden');
      updateBadge();
      return;
    }
    var groups = {}, order = [];
    items.forEach(function (i) {
      if (!groups[i.sellerId]) { groups[i.sellerId] = []; order.push(i.sellerId); }
      groups[i.sellerId].push(i);
    });
    body.innerHTML = '';
    var grandTotal = 0;
    order.forEach(function (sellerId) {
      var groupItems = groups[sellerId];
      var subtotal = groupItems.reduce(function (s, i) { return s + parsePrice(i.priceText) * i.qty; }, 0);
      grandTotal += subtotal;
      var groupEl = el('<div class="mb-5 pb-5 border-b border-secondary-50 last:border-0 last:mb-0 last:pb-0"></div>');
      groupEl.appendChild(el('<p class="text-xs font-semibold text-secondary mb-3">' + escapeHtml(groupItems[0].sellerName) + '</p>'));
      var listWrap = el('<div class="space-y-3 mb-3"></div>');
      groupItems.forEach(function (i) { listWrap.appendChild(itemRow(i)); });
      groupEl.appendChild(listWrap);
      groupEl.appendChild(el('<div class="flex items-center justify-between text-xs text-muted mb-3"><span>' + t('cart.subtotal', 'Tạm tính') + '</span><span class="font-semibold text-ink">' + formatVND(subtotal) + '</span></div>'));
      groupEl.appendChild(el('<button type="button" class="cart-checkout-btn w-full bg-accent text-ink font-semibold py-2.5 rounded-full text-xs hover:-translate-y-0.5 hover:shadow-lg transition-all" data-seller-id="' + escapeHtml(String(sellerId)) + '">' + t('cart.checkout', 'Đặt hàng') + '</button>'));
      body.appendChild(groupEl);
    });
    footer.classList.remove('hidden');
    footer.innerHTML =
      '<div class="flex items-center justify-between text-sm font-semibold mb-2"><span>' + t('cart.grand_total', 'Tổng cộng') + '</span><span class="text-accent-600">' + formatVND(grandTotal) + '</span></div>' +
      '<p class="text-[11px] text-muted mb-3">' + t('cart.note', 'Bấm "Đặt hàng" cho từng nhà bán hàng để hoàn tất đơn — thanh toán khi nhận hàng hoặc chuyển khoản trực tiếp.') + '</p>' +
      '<button type="button" id="cartClearBtn" class="w-full text-xs font-semibold text-muted hover:text-red-600 underline">' + t('cart.clear', 'Xóa giỏ hàng') + '</button>';
    updateBadge();
    bindDynamicEvents();
  }

  function bindDynamicEvents() {
    document.querySelectorAll('.cart-qty-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.dataset.id, delta = parseInt(btn.dataset.delta, 10);
        var it = cartCache.filter(function (i) { return i.id === id; })[0];
        if (it) setQty(id, it.qty + delta);
      });
    });
    document.querySelectorAll('.cart-remove-btn').forEach(function (btn) {
      btn.addEventListener('click', function () { removeItem(btn.dataset.id); });
    });
    document.querySelectorAll('.cart-checkout-btn').forEach(function (btn) {
      btn.addEventListener('click', function () { openCheckoutModal(btn.dataset.sellerId); });
    });
    var clearBtn = document.getElementById('cartClearBtn');
    if (clearBtn) clearBtn.addEventListener('click', function () {
      if (window.confirm(t('cart.clear_confirm', 'Xóa toàn bộ giỏ hàng?'))) clearAll();
    });
  }

  // ===== Checkout modal =====
  var checkoutSellerId = null;
  var checkoutDiscount = 0;
  var checkoutVoucherCode = '';

  function checkoutItemsForSeller(sellerId) {
    return cartCache.filter(function (i) { return String(i.sellerId) === String(sellerId); });
  }
  function checkoutSubtotal(sellerId) {
    return checkoutItemsForSeller(sellerId).reduce(function (s, i) { return s + parsePrice(i.priceText) * i.qty; }, 0);
  }

  function renderCheckoutTotals() {
    var subtotal = checkoutSubtotal(checkoutSellerId);
    var total = Math.max(0, subtotal - checkoutDiscount);
    document.getElementById('checkoutSubtotalValue').textContent = formatVND(subtotal);
    var discountRow = document.getElementById('checkoutDiscountRow');
    if (checkoutDiscount > 0) {
      discountRow.classList.remove('hidden');
      document.getElementById('checkoutDiscountValue').textContent = '−' + formatVND(checkoutDiscount);
    } else {
      discountRow.classList.add('hidden');
    }
    document.getElementById('checkoutTotalValue').textContent = formatVND(total);
  }

  function openCheckoutModal(sellerId) {
    var items = checkoutItemsForSeller(sellerId);
    if (!items.length) return;
    checkoutSellerId = sellerId;
    checkoutDiscount = 0;
    checkoutVoucherCode = '';

    document.getElementById('checkoutFormView').classList.remove('hidden');
    document.getElementById('checkoutSuccessView').classList.add('hidden');
    document.getElementById('checkoutTitle').textContent = items[0].sellerName;
    document.getElementById('checkoutItemsList').innerHTML = items.map(function (i) {
      return '<div class="flex items-center justify-between gap-2"><span class="truncate">' + escapeHtml(i.title) + ' × ' + i.qty + '</span><span class="text-muted shrink-0">' + escapeHtml(i.priceText || '') + '</span></div>';
    }).join('');

    document.getElementById('checkoutSubtotalLabel').textContent = t('cart.subtotal', 'Tạm tính');
    document.getElementById('checkoutTotalLabel').textContent = t('checkout.total', 'Tổng thanh toán');
    document.getElementById('checkoutDiscountLabel').textContent = t('checkout.discount', 'Giảm giá');
    document.getElementById('checkoutVoucherLabel').textContent = t('checkout.voucher_label', 'Mã giảm giá (nếu có)');
    document.getElementById('checkoutVoucherApply').textContent = t('checkout.voucher_apply', 'Áp dụng');
    document.getElementById('checkoutVoucherInput').value = '';
    var voucherMsg = document.getElementById('checkoutVoucherMsg');
    voucherMsg.textContent = ''; voucherMsg.className = 'text-xs mt-1.5';
    document.getElementById('checkoutNameLabel').textContent = t('checkout.name_label', 'Họ tên người nhận');
    document.getElementById('checkoutPhoneLabel').textContent = t('checkout.phone_label', 'Số điện thoại');
    document.getElementById('checkoutAddressLabel').textContent = t('checkout.address_label', 'Địa chỉ giao hàng');
    document.getElementById('checkoutPaymentLabel').textContent = t('checkout.payment_label', 'Phương thức thanh toán');
    document.getElementById('checkoutPaymentCodLabel').textContent = t('checkout.payment_cod', 'Thanh toán khi nhận hàng (COD)');
    document.getElementById('checkoutPaymentBankLabel').textContent = t('checkout.payment_bank', 'Chuyển khoản ngân hàng');
    document.getElementById('checkoutSubmit').textContent = t('checkout.submit', 'Xác nhận đặt hàng');
    document.getElementById('checkoutName').value = (authUser && authUser.name) || '';
    document.getElementById('checkoutPhone').value = '';
    document.getElementById('checkoutAddress').value = '';
    document.querySelector('input[name="checkoutPayment"][value="cod"]').checked = true;
    var errEl = document.getElementById('checkoutError');
    errEl.classList.add('hidden'); errEl.textContent = '';

    renderCheckoutTotals();
    document.getElementById('checkoutModal').classList.remove('hidden');
  }
  function closeCheckoutModal() {
    document.getElementById('checkoutModal').classList.add('hidden');
    checkoutSellerId = null;
  }

  async function applyVoucher() {
    var code = document.getElementById('checkoutVoucherInput').value.trim();
    var msgEl = document.getElementById('checkoutVoucherMsg');
    if (!code) {
      checkoutDiscount = 0; checkoutVoucherCode = '';
      msgEl.textContent = ''; renderCheckoutTotals();
      return;
    }
    try {
      var res = await fetch('/api/vouchers/check', {
        method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sellerId: checkoutSellerId, code: code })
      });
      var data = await res.json().catch(function () { return {}; });
      if (!res.ok) {
        checkoutDiscount = 0; checkoutVoucherCode = '';
        msgEl.textContent = data.error || t('checkout.voucher_invalid', 'Mã giảm giá không hợp lệ.');
        msgEl.className = 'text-xs mt-1.5 text-red-600';
      } else {
        var subtotal = checkoutSubtotal(checkoutSellerId);
        checkoutDiscount = data.voucher.discountType === 'percent'
          ? Math.round(subtotal * data.voucher.discountValue / 100)
          : data.voucher.discountValue;
        checkoutDiscount = Math.min(checkoutDiscount, subtotal);
        checkoutVoucherCode = data.voucher.code;
        msgEl.textContent = t('checkout.voucher_applied', 'Đã áp dụng mã giảm giá.');
        msgEl.className = 'text-xs mt-1.5 text-green-700';
      }
    } catch (e) {
      checkoutDiscount = 0; checkoutVoucherCode = '';
      msgEl.textContent = t('checkout.voucher_invalid', 'Mã giảm giá không hợp lệ.');
      msgEl.className = 'text-xs mt-1.5 text-red-600';
    }
    renderCheckoutTotals();
  }

  async function submitCheckout(e) {
    e.preventDefault();
    var errEl = document.getElementById('checkoutError');
    errEl.classList.add('hidden');
    var name = document.getElementById('checkoutName').value.trim();
    var phone = document.getElementById('checkoutPhone').value.trim();
    var address = document.getElementById('checkoutAddress').value.trim();
    var payment = document.querySelector('input[name="checkoutPayment"]:checked').value;
    if (!name || !phone || !address) {
      errEl.textContent = t('checkout.missing_fields', 'Vui lòng điền đầy đủ thông tin giao hàng.');
      errEl.classList.remove('hidden');
      return;
    }
    var submitBtn = document.getElementById('checkoutSubmit');
    submitBtn.disabled = true;
    try {
      var data = await apiCart('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellerId: checkoutSellerId, customerName: name, customerPhone: phone, customerAddress: address,
          paymentMethod: payment, voucherCode: checkoutVoucherCode
        })
      });
      if (data) {
        cartCache = data.items.map(fromServerItem);
        updateBadge();
        renderBody();
        document.getElementById('checkoutFormView').classList.add('hidden');
        document.getElementById('checkoutSuccessView').classList.remove('hidden');
        document.getElementById('checkoutSuccessMsg').textContent = t('checkout.success_title', 'Đặt hàng thành công!');
        document.getElementById('checkoutSuccessSub').textContent = t('checkout.success_sub', 'Nhà bán hàng sẽ liên hệ xác nhận với bạn.');
        document.getElementById('checkoutSuccessClose').textContent = t('common.close', 'Đóng');
      }
    } catch (err) {
      errEl.textContent = err.message;
      errEl.classList.remove('hidden');
    }
    submitBtn.disabled = false;
  }

  async function openDrawer() {
    var user = await ensureCustomerAuth();
    if (!user) { redirectToLogin(); return; }
    document.getElementById('cartPanel').classList.remove('hidden');
    var data = await apiCart('/api/cart');
    if (data) cartCache = data.items.map(fromServerItem);
    renderBody();
  }
  function closeDrawer() { document.getElementById('cartPanel').classList.add('hidden'); }
  function toggleDrawer() {
    var panel = document.getElementById('cartPanel');
    if (panel.classList.contains('hidden')) openDrawer(); else closeDrawer();
  }

  function injectMarkup() {
    var wrap = el(
      '<div id="cartWidget" class="fixed bottom-5 left-5 z-[65] flex flex-col items-start">' +
        '<div id="cartPanel" class="hidden mb-3 w-[92vw] max-w-sm bg-white rounded-3xl shadow-soft overflow-hidden border border-secondary-50 flex flex-col" style="height:70vh;max-height:560px">' +
          '<div class="flex items-center justify-between px-4 py-3 border-b border-secondary-50 bg-secondary-50/40 shrink-0">' +
            '<p id="cartPanelTitle" class="font-semibold text-sm"></p>' +
            '<button id="cartCloseBtn" type="button" class="text-muted hover:text-ink text-lg leading-none" aria-label="Đóng">✕</button>' +
          '</div>' +
          '<div id="cartBody" class="flex-1 overflow-y-auto p-4"></div>' +
          '<div id="cartFooter" class="hidden border-t border-secondary-50 p-4 shrink-0"></div>' +
        '</div>' +
        '<button id="cartToggleBtn" type="button" class="relative w-14 h-14 rounded-full bg-white text-secondary shadow-soft border border-secondary-100 flex items-center justify-center hover:-translate-y-0.5 transition-transform" aria-label="Mở giỏ hàng">' +
          '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M3 3h2l2.4 12.4a2 2 0 0 0 2 1.9h8.4a2 2 0 0 0 2-1.6L22 8H6" stroke="#211E1A" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="9" cy="20" r="1.5" fill="#211E1A"/><circle cx="17" cy="20" r="1.5" fill="#211E1A"/></svg>' +
          '<span id="cartBadge" class="hidden absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">0</span>' +
        '</button>' +
      '</div>'
    );
    document.body.appendChild(wrap);
    document.getElementById('cartToggleBtn').addEventListener('click', toggleDrawer);
    document.getElementById('cartCloseBtn').addEventListener('click', closeDrawer);

    var customerMenu = el(
      '<div id="customerMenu" class="hidden fixed z-[80] w-56 bg-white rounded-2xl shadow-soft border border-secondary-50 py-2 text-sm">' +
        '<button type="button" id="customerMenuOrders" class="w-full text-left px-4 py-2.5 hover:bg-secondary-50/60"></button>' +
        '<div class="border-t border-secondary-50 my-1"></div>' +
        '<button type="button" id="customerMenuLogout" class="w-full text-left px-4 py-2.5 hover:bg-red-50 text-red-600"></button>' +
      '</div>'
    );
    document.body.appendChild(customerMenu);
    document.getElementById('customerMenuOrders').textContent = t('nav_menu.order_history', 'Lịch sử đặt hàng');
    document.getElementById('customerMenuLogout').textContent = t('common.logout', 'Đăng xuất');
    document.getElementById('customerMenuOrders').addEventListener('click', function () { closeCustomerMenu(); openOrdersModal(); });
    document.getElementById('customerMenuLogout').addEventListener('click', function () { closeCustomerMenu(); logoutCustomer(); });

    var ordersModal = el(
      '<div id="ordersModal" class="hidden fixed inset-0 z-[85] flex items-center justify-center p-4">' +
        '<div id="ordersBackdrop" class="absolute inset-0 bg-black/40"></div>' +
        '<div class="relative bg-white rounded-3xl shadow-soft max-w-md w-full flex flex-col" style="max-height:80vh">' +
          '<div class="flex items-center justify-between px-6 py-4 border-b border-secondary-50 shrink-0">' +
            '<h3 id="ordersTitle" class="font-bold text-lg"></h3>' +
            '<button type="button" id="ordersClose" class="text-muted hover:text-ink text-lg leading-none" aria-label="Đóng">✕</button>' +
          '</div>' +
          '<div id="ordersBody" class="flex-1 overflow-y-auto p-6 space-y-4"></div>' +
        '</div>' +
      '</div>'
    );
    document.body.appendChild(ordersModal);
    document.getElementById('ordersClose').addEventListener('click', closeOrdersModal);
    document.getElementById('ordersBackdrop').addEventListener('click', closeOrdersModal);

    var checkoutModal = el(
      '<div id="checkoutModal" class="hidden fixed inset-0 z-[85] flex items-center justify-center p-4">' +
        '<div id="checkoutBackdrop" class="absolute inset-0 bg-black/40"></div>' +
        '<div class="relative bg-white rounded-3xl shadow-soft max-w-md w-full flex flex-col" style="max-height:88vh">' +
          '<div class="flex items-center justify-between px-6 py-4 border-b border-secondary-50 shrink-0">' +
            '<h3 id="checkoutTitle" class="font-bold text-lg"></h3>' +
            '<button type="button" id="checkoutClose" class="text-muted hover:text-ink text-lg leading-none" aria-label="Đóng">✕</button>' +
          '</div>' +
          '<div class="flex-1 overflow-y-auto p-6">' +
            '<div id="checkoutFormView">' +
              '<div id="checkoutItemsList" class="space-y-1 mb-4 text-xs"></div>' +
              '<div class="border-t border-secondary-50 pt-3 mb-4 space-y-1.5 text-sm">' +
                '<div class="flex items-center justify-between"><span id="checkoutSubtotalLabel" class="text-muted"></span><span id="checkoutSubtotalValue" class="font-medium"></span></div>' +
                '<div id="checkoutDiscountRow" class="hidden flex items-center justify-between text-green-700"><span id="checkoutDiscountLabel"></span><span id="checkoutDiscountValue"></span></div>' +
                '<div class="flex items-center justify-between font-bold text-base pt-1.5 border-t border-secondary-50"><span id="checkoutTotalLabel"></span><span id="checkoutTotalValue" class="text-accent-600"></span></div>' +
              '</div>' +
              '<div class="mb-4">' +
                '<label id="checkoutVoucherLabel" class="text-xs font-semibold block mb-1.5"></label>' +
                '<div class="flex gap-2">' +
                  '<input id="checkoutVoucherInput" type="text" class="flex-1 rounded-xl border border-secondary-100 px-3 py-2 text-sm outline-none focus:border-secondary" autocomplete="off">' +
                  '<button type="button" id="checkoutVoucherApply" class="px-4 py-2 rounded-xl border border-secondary-100 text-sm font-semibold hover:bg-secondary-50 shrink-0"></button>' +
                '</div>' +
                '<p id="checkoutVoucherMsg" class="text-xs mt-1.5"></p>' +
              '</div>' +
              '<form id="checkoutForm" class="space-y-3">' +
                '<div>' +
                  '<label id="checkoutNameLabel" class="text-xs font-semibold block mb-1.5"></label>' +
                  '<input id="checkoutName" required type="text" class="w-full rounded-xl border border-secondary-100 px-3 py-2 text-sm outline-none focus:border-secondary">' +
                '</div>' +
                '<div>' +
                  '<label id="checkoutPhoneLabel" class="text-xs font-semibold block mb-1.5"></label>' +
                  '<input id="checkoutPhone" required type="tel" class="w-full rounded-xl border border-secondary-100 px-3 py-2 text-sm outline-none focus:border-secondary">' +
                '</div>' +
                '<div>' +
                  '<label id="checkoutAddressLabel" class="text-xs font-semibold block mb-1.5"></label>' +
                  '<input id="checkoutAddress" required type="text" class="w-full rounded-xl border border-secondary-100 px-3 py-2 text-sm outline-none focus:border-secondary">' +
                '</div>' +
                '<div>' +
                  '<label id="checkoutPaymentLabel" class="text-xs font-semibold block mb-2"></label>' +
                  '<div class="space-y-2">' +
                    '<label class="flex items-center gap-2 text-sm"><input type="radio" name="checkoutPayment" value="cod" checked> <span id="checkoutPaymentCodLabel"></span></label>' +
                    '<label class="flex items-center gap-2 text-sm"><input type="radio" name="checkoutPayment" value="bank_transfer"> <span id="checkoutPaymentBankLabel"></span></label>' +
                  '</div>' +
                '</div>' +
                '<p id="checkoutError" class="hidden text-xs text-red-600 font-medium"></p>' +
                '<button type="submit" id="checkoutSubmit" class="w-full bg-accent text-ink font-semibold py-3 rounded-full hover:-translate-y-0.5 hover:shadow-lg transition-all"></button>' +
              '</form>' +
            '</div>' +
            '<div id="checkoutSuccessView" class="hidden text-center py-8">' +
              '<div class="w-14 h-14 rounded-full bg-accent-50 text-accent-600 flex items-center justify-center mx-auto mb-4 text-2xl">✓</div>' +
              '<p id="checkoutSuccessMsg" class="font-semibold mb-1"></p>' +
              '<p id="checkoutSuccessSub" class="text-sm text-muted mb-6"></p>' +
              '<button type="button" id="checkoutSuccessClose" class="px-6 py-2.5 rounded-full bg-secondary text-white font-semibold text-sm"></button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
    document.body.appendChild(checkoutModal);
    document.getElementById('checkoutClose').addEventListener('click', closeCheckoutModal);
    document.getElementById('checkoutBackdrop').addEventListener('click', closeCheckoutModal);
    document.getElementById('checkoutSuccessClose').addEventListener('click', closeCheckoutModal);
    document.getElementById('checkoutVoucherApply').addEventListener('click', applyVoucher);
    document.getElementById('checkoutForm').addEventListener('submit', submitCheckout);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { closeDrawer(); closeCustomerMenu(); closeOrdersModal(); closeCheckoutModal(); }
    });
    document.addEventListener('click', function (e) {
      var menu = document.getElementById('customerMenu');
      if (!menu.classList.contains('hidden') && !menu.contains(e.target) && !e.target.closest('.nav-customer-btn')) {
        closeCustomerMenu();
      }
    });
    document.querySelectorAll('.nav-customer-btn').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var menu = document.getElementById('customerMenu');
        if (menu.classList.contains('hidden')) openCustomerMenu(btn); else closeCustomerMenu();
      });
    });
  }

  window.Cart = {
    addItem: addItem,
    removeItem: removeItem,
    clearAll: clearAll,
    open: openDrawer,
    getItems: function () { return cartCache; }
  };

  document.addEventListener('i18n:change', function () {
    renderNavIdentity();
    var panel = document.getElementById('cartPanel');
    if (panel && !panel.classList.contains('hidden')) renderBody();
    var ordersBtn = document.getElementById('customerMenuOrders');
    if (ordersBtn) ordersBtn.textContent = t('nav_menu.order_history', 'Lịch sử đặt hàng');
    var logoutBtn = document.getElementById('customerMenuLogout');
    if (logoutBtn) logoutBtn.textContent = t('common.logout', 'Đăng xuất');
    var ordersModal = document.getElementById('ordersModal');
    if (ordersModal && !ordersModal.classList.contains('hidden')) openOrdersModal();
  });

  document.addEventListener('DOMContentLoaded', function () {
    injectMarkup();
    refreshFromServer();
  });
})();
