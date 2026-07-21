/* Material AI — floating chat widget (customer <-> seller), shared by materials.html and sellers.html */
(function () {
  var KEY_ID = 'materialai_customer_key';
  var KEY_NAME = 'materialai_customer_name';
  var POLL_MS = 4000;

  function getCustomerKey() {
    var key = localStorage.getItem(KEY_ID);
    if (!key) {
      key = 'c_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
      localStorage.setItem(KEY_ID, key);
    }
    return key;
  }
  function getCustomerName() { return localStorage.getItem(KEY_NAME) || ''; }
  function setCustomerName(name) { localStorage.setItem(KEY_NAME, name); }

  async function api(url, options) {
    options = options || {};
    var res = await fetch(url, {
      method: options.method || 'GET',
      headers: { 'Content-Type': 'application/json' },
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    var data = await res.json().catch(function () { return {}; });
    if (!res.ok) throw new Error(data.error || 'Đã có lỗi xảy ra.');
    return data;
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

  var state = { view: 'list', activeConvId: null, activeSeller: null, pollTimer: null, pendingSellerId: null };

  function injectMarkup() {
    var wrap = el(
      '<div id="chatWidget" class="fixed bottom-5 right-5 z-[70] flex flex-col items-end">' +
        '<div id="chatPanel" class="hidden mb-3 w-[92vw] max-w-sm bg-white rounded-3xl shadow-soft overflow-hidden border border-secondary-50" style="height:70vh;max-height:520px">' +
          '<div id="chatHeader" class="flex items-center gap-3 px-4 py-3 border-b border-secondary-50 bg-secondary-50/40"></div>' +
          '<div id="chatBody" class="flex-1 overflow-y-auto"></div>' +
        '</div>' +
        '<button id="chatToggleBtn" class="relative w-14 h-14 rounded-full bg-accent text-ink shadow-soft flex items-center justify-center hover:-translate-y-0.5 transition-transform" aria-label="Mở khung chat">' +
          '<svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" stroke="#211E1A" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
          '<span id="chatUnreadBadge" class="hidden absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">0</span>' +
        '</button>' +
      '</div>'
    );
    document.body.appendChild(wrap);
    document.getElementById('chatToggleBtn').addEventListener('click', togglePanel);
  }

  function togglePanel(forceOpen) {
    var panel = document.getElementById('chatPanel');
    var willOpen = forceOpen === true || panel.classList.contains('hidden');
    if (forceOpen === false) willOpen = false;
    panel.classList.toggle('hidden', !willOpen);
    if (willOpen) {
      if (state.pendingSellerId) {
        openSellerChat(state.pendingSellerId);
        state.pendingSellerId = null;
      } else if (!getCustomerName()) {
        renderNamePrompt();
      } else {
        renderList();
      }
    } else {
      stopPolling();
    }
  }

  function stopPolling() { if (state.pollTimer) { clearInterval(state.pollTimer); state.pollTimer = null; } }

  function renderHeader(html) { document.getElementById('chatHeader').innerHTML = html; }

  function renderNamePrompt(afterSellerId) {
    stopPolling();
    renderHeader('<p class="font-semibold text-sm">Bắt đầu trò chuyện</p>');
    var body = document.getElementById('chatBody');
    body.innerHTML =
      '<div class="p-5">' +
        '<p class="text-sm text-muted mb-4">Nhập tên của bạn để bắt đầu nhắn tin với nhà bán hàng.</p>' +
        '<input id="chatNameInput" type="text" placeholder="Tên của bạn" class="w-full rounded-xl border border-secondary-100 px-4 py-3 text-sm outline-none focus:border-secondary mb-3">' +
        '<button id="chatNameSubmit" class="w-full bg-accent text-ink font-semibold py-3 rounded-full text-sm">Tiếp tục</button>' +
      '</div>';
    document.getElementById('chatNameSubmit').addEventListener('click', function () {
      var val = document.getElementById('chatNameInput').value.trim();
      if (!val) return;
      setCustomerName(val);
      if (afterSellerId) openSellerChat(afterSellerId); else renderList();
    });
  }

  function fmtTime(iso) {
    if (!iso) return '';
    var d = new Date(iso.replace(' ', 'T') + 'Z');
    return d.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
  }

  async function refreshBadge() {
    var name = getCustomerName();
    if (!name) return;
    try {
      var data = await api('/api/chat/conversations?customerKey=' + encodeURIComponent(getCustomerKey()));
      var unread = data.conversations.reduce(function (sum, c) { return sum + c.unread; }, 0);
      var badge = document.getElementById('chatUnreadBadge');
      if (unread > 0) { badge.textContent = unread > 9 ? '9+' : unread; badge.classList.remove('hidden'); }
      else badge.classList.add('hidden');
    } catch (e) { /* ignore */ }
  }

  async function renderList() {
    stopPolling();
    state.view = 'list';
    renderHeader('<p class="font-semibold text-sm">Tin nhắn của bạn</p>');
    var body = document.getElementById('chatBody');
    body.innerHTML = '<div class="p-5 text-sm text-muted">Đang tải...</div>';
    try {
      var data = await api('/api/chat/conversations?customerKey=' + encodeURIComponent(getCustomerKey()));
      if (!data.conversations.length) {
        body.innerHTML = '<div class="p-6 text-center text-sm text-muted">Chưa có hội thoại nào.<br>Bấm "Nhắn tin" trên trang nhà bán hàng để bắt đầu.</div>';
      } else {
        body.innerHTML = '';
        data.conversations.forEach(function (c) {
          var row = el(
            '<button class="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary-50/50 text-left border-b border-secondary-50">' +
              '<span class="w-10 h-10 shrink-0 rounded-full bg-accent-50 flex items-center justify-center text-xs font-bold text-accent-600">' + escapeHtml(c.sellerInitials) + '</span>' +
              '<span class="flex-1 min-w-0">' +
                '<span class="flex items-center justify-between gap-2"><span class="text-sm font-semibold truncate">' + escapeHtml(c.sellerName) + '</span><span class="text-[10px] text-muted shrink-0">' + fmtTime(c.lastMessageAt) + '</span></span>' +
                '<span class="block text-xs text-muted truncate">' + escapeHtml(c.lastMessage) + '</span>' +
              '</span>' +
              (c.unread > 0 ? '<span class="shrink-0 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">' + c.unread + '</span>' : '') +
            '</button>'
          );
          row.addEventListener('click', function () { openThread(c.id, c.sellerName, c.sellerInitials); });
          body.appendChild(row);
        });
      }
    } catch (e) {
      body.innerHTML = '<div class="p-5 text-sm text-red-600">' + escapeHtml(e.message) + '</div>';
    }
    refreshBadge();
  }

  function messageBubble(m) {
    var mine = m.sender_role === 'customer';
    return el(
      '<div class="flex ' + (mine ? 'justify-end' : 'justify-start') + ' px-4 py-1">' +
        '<div class="max-w-[75%] ' + (mine ? 'bg-accent text-ink' : 'bg-secondary-50 text-ink') + ' rounded-2xl px-4 py-2 text-sm">' +
          '<p>' + escapeHtml(m.body) + '</p>' +
          '<p class="text-[10px] opacity-60 mt-0.5">' + fmtTime(m.created_at) + '</p>' +
        '</div>' +
      '</div>'
    );
  }

  async function loadThreadMessages(convId) {
    var data = await api('/api/chat/conversations/' + convId + '/messages?customerKey=' + encodeURIComponent(getCustomerKey()));
    var body = document.getElementById('chatBody');
    var list = body.querySelector('#chatMsgList');
    if (!list) return;
    list.innerHTML = '';
    data.messages.forEach(function (m) { list.appendChild(messageBubble(m)); });
    list.scrollTop = list.scrollHeight;
    refreshBadge();
  }

  function openThread(convId, sellerName, sellerInitials) {
    stopPolling();
    state.view = 'thread';
    state.activeConvId = convId;
    renderHeader(
      '<button id="chatBackBtn" class="text-secondary shrink-0" aria-label="Quay lại"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 19l-7-7 7-7" stroke="#211E1A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
      '<span class="w-8 h-8 shrink-0 rounded-full bg-accent-50 flex items-center justify-center text-[10px] font-bold text-accent-600">' + escapeHtml(sellerInitials) + '</span>' +
      '<span class="font-semibold text-sm truncate">' + escapeHtml(sellerName) + '</span>'
    );
    document.getElementById('chatBackBtn').addEventListener('click', renderList);
    var body = document.getElementById('chatBody');
    body.innerHTML =
      '<div class="flex flex-col h-full">' +
        '<div id="chatMsgList" class="flex-1 overflow-y-auto py-3"></div>' +
        '<form id="chatSendForm" class="flex items-center gap-2 p-3 border-t border-secondary-50">' +
          '<input id="chatMsgInput" type="text" placeholder="Nhập tin nhắn..." class="flex-1 rounded-full border border-secondary-100 px-4 py-2.5 text-sm outline-none focus:border-secondary" autocomplete="off">' +
          '<button type="submit" class="bg-accent text-ink font-semibold px-4 py-2.5 rounded-full text-sm shrink-0">Gửi</button>' +
        '</form>' +
      '</div>';
    document.getElementById('chatBody').style.display = 'flex';
    document.getElementById('chatSendForm').addEventListener('submit', async function (e) {
      e.preventDefault();
      var input = document.getElementById('chatMsgInput');
      var val = input.value.trim();
      if (!val) return;
      input.value = '';
      try {
        await api('/api/chat/conversations/' + convId + '/messages', { method: 'POST', body: { customerKey: getCustomerKey(), body: val } });
        loadThreadMessages(convId);
      } catch (err) { alert(err.message); }
    });
    loadThreadMessages(convId);
    state.pollTimer = setInterval(function () { loadThreadMessages(convId); }, POLL_MS);
  }

  async function openSellerChat(sellerId) {
    if (!getCustomerName()) { renderNamePrompt(sellerId); return; }
    document.getElementById('chatPanel').classList.remove('hidden');
    var body = document.getElementById('chatBody');
    body.style.display = 'block';
    body.innerHTML = '<div class="p-5 text-sm text-muted">Đang kết nối...</div>';
    try {
      var data = await api('/api/chat/start', { method: 'POST', body: { sellerId: sellerId, customerKey: getCustomerKey(), customerName: getCustomerName() } });
      openThread(data.conversation.id, data.conversation.sellerName, data.conversation.sellerInitials);
    } catch (e) {
      body.innerHTML = '<div class="p-5 text-sm text-red-600">' + escapeHtml(e.message) + '</div>';
    }
  }

  window.ChatWidget = {
    openWithSeller: function (sellerId) {
      var panel = document.getElementById('chatPanel');
      panel.classList.remove('hidden');
      openSellerChat(sellerId);
    }
  };

  document.addEventListener('DOMContentLoaded', function () {
    injectMarkup();
    var bodyEl = document.getElementById('chatBody');
    bodyEl.classList.add('flex', 'flex-col');
    refreshBadge();
    setInterval(refreshBadge, 15000);
  });
})();
