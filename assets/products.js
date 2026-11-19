/* Trang quản lý sản phẩm affiliate: dán link → lấy metadata → tạo affiliate link → xếp vào bộ sưu tập. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var Store = window.LinkStore, Meta = window.LinkMeta, LB = window.LinkBio;
  var MAX = Store.MAX;
  var USD_VND = 25000, CONV = 0.03; // giả định: 1 USD ≈ 25.000₫, tỉ lệ chuyển đổi 3%
  var db = Store.load();
  var active = 'all';      // 'all' hoặc id bộ sưu tập
  var pending = null;      // link đang lấy metadata
  var editing = null;      // sản phẩm đang sửa trong modal (null = tạo mới)
  var flashId = null;

  // ---------- helpers ----------
  function h(tag, attrs, kids) {
    var n = document.createElement(tag);
    for (var k in attrs || {}) {
      if (k === 'text') n.textContent = attrs[k];
      else if (k === 'on') for (var ev in attrs.on) n.addEventListener(ev, attrs.on[ev]);
      else if (attrs[k] != null) n.setAttribute(k, attrs[k]);
    }
    (kids || []).forEach(function (c) { if (c) n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return n;
  }
  function save() { Store.save(db); }
  function prod(id) { return db.products.filter(function (p) { return p.id === id; })[0]; }
  function col(id) { return db.collections.filter(function (c) { return c.id === id; })[0]; }
  function colsOf(pid) { return db.collections.filter(function (c) { return c.items.indexOf(pid) >= 0; }); }
  function price(p) { return LB.formatPrice(p.price, p.currency); }
  function vnd(p) { return (Number(p.price) || 0) * (p.currency === 'USD' ? USD_VND : 1); }
  function money(n) {
    if (n >= 1e6) return (n / 1e6).toFixed(1).replace('.', ',') + 'tr₫';
    return Math.round(n).toLocaleString('vi-VN') + '₫';
  }
  var toastT;
  function toast(msg, err) {
    var t = $('toast'); t.textContent = msg; t.classList.toggle('err', !!err); t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove('show'); }, 2600);
  }
  function copy(text, what) {
    (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(
      function () { toast('Đã copy ' + (what || '')); },
      function () { window.prompt('Copy thủ công:', text); });
  }

  // ---------- render ----------
  function renderAll() { renderStats(); renderAddTo(); renderCols(); renderList(); renderPreview(); }

  function renderStats() {
    var clicks = 0, est = 0;
    db.products.forEach(function (p) {
      clicks += p.clicks || 0;
      est += (p.clicks || 0) * CONV * vnd(p) * Meta.network(p.network).rate;
    });
    var box = $('stats'); box.innerHTML = '';
    [['Sản phẩm', db.products.length, ''], ['Bộ sưu tập', db.collections.length, ''],
     ['Click', clicks.toLocaleString('vi-VN'), ''], ['Hoa hồng ước tính', money(est), 'olive']].forEach(function (s) {
      box.appendChild(h('div', { 'class': 'stat ' + s[2] }, [h('small', { text: s[0] }), h('b', { text: String(s[1]) })]));
    });
    box.lastChild.title = 'Ước tính = click × ' + (CONV * 100) + '% chuyển đổi × giá × % hoa hồng của mạng';
  }

  function renderAddTo() {
    var sel = $('addTo'), cur = sel.value || (active !== 'all' ? active : (db.collections[0] || {}).id);
    sel.innerHTML = '';
    db.collections.forEach(function (c) {
      sel.appendChild(h('option', { value: c.id, text: 'Vào: ' + c.name + ' (' + c.items.length + '/' + MAX + ')' }));
    });
    sel.appendChild(h('option', { value: '', text: 'Chỉ thêm vào thư viện' }));
    sel.value = col(cur) ? cur : '';
  }

  function renderCols() {
    var box = $('cols'); box.innerHTML = '';
    var chip = function (id, name, count, max) {
      var b = h('button', { 'class': 'chip' + (active === id ? ' on' : '') + (max && count >= max ? ' full' : ''), type: 'button',
        on: { click: function () { active = id; renderAddTo(); renderCols(); renderList(); } } },
        [name, h('em', { text: max ? count + '/' + max : String(count) })]);
      box.appendChild(b);
    };
    chip('all', 'Tất cả', db.products.length);
    db.collections.forEach(function (c) { chip(c.id, c.name, c.items.length, MAX); });
    box.appendChild(h('button', { 'class': 'chip ghost', type: 'button', text: '+ Bộ sưu tập', on: { click: addCollection } }));
    var c = col(active);
    if (c) {
      box.appendChild(h('span', { 'class': 'acts' }, [
        h('button', { 'class': 'btn sm', type: 'button', text: 'Đổi tên', on: { click: function () {
          var n = prompt('Tên bộ sưu tập', c.name); if (n && n.trim()) { c.name = n.trim(); save(); renderAll(); }
        } } }),
        h('button', { 'class': 'btn sm', type: 'button', text: 'Xóa', on: { click: function () {
          if (!confirm('Xóa bộ sưu tập "' + c.name + '"? Sản phẩm vẫn còn trong thư viện.')) return;
          db.collections.splice(db.collections.indexOf(c), 1); active = 'all'; save(); renderAll();
        } } })
      ]));
    }
  }

  function addCollection() {
    var n = prompt('Tên bộ sưu tập mới (vd. Phụ kiện)');
    if (!n || !n.trim()) return;
    var id = 'c' + Date.now().toString(36);
    db.collections.push({ id: id, name: n.trim(), items: [] });
    active = id; save(); renderAll();
    toast('Đã tạo "' + n.trim() + '". Thêm vào block Shop trong Editor để hiện trên trang');
  }

  function visibleList() {
    var c = col(active);
    return c ? c.items.map(prod).filter(Boolean) : db.products.slice();
  }

  var drag = null;
  function renderList() {
    var box = $('list'); box.innerHTML = '';
    var c = col(active);
    if (pending) {
      box.appendChild(h('div', { 'class': 'pending' }, [h('span', { 'class': 'spin' }),
        h('div', {}, [h('b', { text: 'Đang lấy ảnh, tên, giá… ' }), h('span', { text: pending })])]));
    }
    var items = visibleList();
    if (!items.length && !pending) {
      box.appendChild(h('div', { 'class': 'empty', text: c ? 'Bộ sưu tập trống. Dán link ở trên để thêm sản phẩm.' : 'Chưa có sản phẩm.' }));
    }
    items.forEach(function (p) {
      var net = Meta.network(p.network);
      var thumb = h('div', { 'class': 'thumb' });
      if (p.image) thumb.style.backgroundImage = 'url("' + String(p.image).replace(/"/g, '') + '")'; else thumb.textContent = '🛍';
      var sw = h('input', { type: 'checkbox', title: 'Hiển thị trên trang' }); sw.checked = p.visible !== false;
      sw.addEventListener('change', function () { p.visible = sw.checked; save(); renderList(); renderPreview(); toast(sw.checked ? 'Đã hiện sản phẩm' : 'Đã ẩn sản phẩm khỏi mọi trang'); });
      var handle = h('span', { 'class': 'handle' + (c ? '' : ' na'), title: 'Kéo để đổi thứ tự', text: '⋮⋮' });
      var row = h('div', { 'class': 'row' + (p.visible === false ? ' off' : '') + (p.id === flashId ? ' flash' : ''), 'data-id': p.id }, [
        handle, thumb,
        h('div', { style: 'min-width:0' }, [
          h('div', { 'class': 'pname', text: p.title, title: p.title }),
          h('div', { 'class': 'pmeta' }, [
            h('span', { 'class': 'net', text: net.name }),
            p.price != null && p.price !== '' ? h('span', { 'class': 'price', text: price(p) }) : null,
            h('span', { text: 'HH ' + net.label }),
            p.source === 'mock' ? h('span', { 'class': 'net mock', text: 'metadata giả lập', title: 'Chưa chạy tools/meta-server.js nên dữ liệu được giả lập' }) : null,
            p.source === 'manual' ? h('span', { 'class': 'net mock', text: 'điền tay' }) : null
          ])
        ]),
        h('div', { 'class': 'aff', title: p.affiliateUrl }, [h('span', { text: p.affiliateUrl.replace(/^https?:\/\//, '') }),
          h('button', { 'class': 'rb', type: 'button', title: 'Copy affiliate link', text: '⧉', on: { click: function () { copy(p.affiliateUrl, 'affiliate link'); } } })]),
        h('div', { 'class': 'clicks' }, [h('b', { text: String(p.clicks || 0) }), h('small', { text: 'click' })]),
        h('label', { 'class': 'switch' }, [sw, h('i')]),
        h('button', { 'class': 'more', type: 'button', title: 'Thêm', text: '⋯', on: { click: function (e) { openMenu(e.currentTarget, p); } } })
      ]);
      if (c) {
        handle.addEventListener('mousedown', function () { row.draggable = true; });
        row.addEventListener('dragstart', function (e) { drag = p.id; e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', p.id); setTimeout(function () { row.classList.add('dragging'); }, 0); });
        row.addEventListener('dragend', function () { row.draggable = false; drag = null; renderList(); });
        row.addEventListener('dragover', function (e) {
          if (!drag || drag === p.id) return; e.preventDefault();
          var r = row.getBoundingClientRect(), before = e.clientY < r.top + r.height / 2;
          row.classList.toggle('drop-before', before); row.classList.toggle('drop-after', !before);
        });
        row.addEventListener('dragleave', function () { row.classList.remove('drop-before', 'drop-after'); });
        row.addEventListener('drop', function (e) {
          if (!drag || drag === p.id) return; e.preventDefault();
          var r = row.getBoundingClientRect(), before = e.clientY < r.top + r.height / 2;
          c.items.splice(c.items.indexOf(drag), 1);
          c.items.splice(c.items.indexOf(p.id) + (before ? 0 : 1), 0, drag);
          flashId = drag; drag = null; save(); renderList(); renderPreview(); flashId = null;
        });
      }
      box.appendChild(row);
    });
    flashId = null;
  }

  // ---------- preview ----------
  function slugData(slug) {
    try { var d = localStorage.getItem(window.LinkVersions.DRAFT_PREFIX + slug); if (d) return JSON.parse(d); } catch (e) {}
    return window.LinkVersions.current(slug) || JSON.parse(JSON.stringify(window.LINK_SITES[slug]));
  }
  function hasShop(site) { return (site.blocks || []).some(function (b) { return b.type === 'shop'; }); }
  function renderPreview() {
    var slug = $('slugSel').value;
    if (!slug) return;
    var root = $('pv'), top = root.scrollTop;
    LB.render(slugData(slug), root, {
      products: db, preventNav: true,
      onTrack: function (ev) {
        var p = prod(ev.blockId);
        if (!p) { $('log').textContent = 'click: ' + ev.blockId; return; }
        p.clicks = (p.clicks || 0) + 1; save(); renderStats(); renderList();
        $('log').textContent = '+1 click · ' + p.title;
      }
    });
    root.scrollTop = top;
  }
  function scrollPreviewToShop() {
    var n = $('pv').querySelector('.lb-shop');
    if (n) n.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ---------- menu "…" ----------
  function closeMenu() { $('menu').classList.remove('open'); }
  function openMenu(btn, p) {
    var m = $('menu'); m.innerHTML = '';
    var item = function (text, fn, cls) { m.appendChild(h('button', { type: 'button', 'class': cls || '', text: text, on: { click: function () { closeMenu(); fn(); } } })); };
    item('Sửa thông tin', function () { openModal(p); });
    item('Lấy lại ảnh, tên, giá', function () { refetch(p); });
    item('Copy affiliate link', function () { copy(p.affiliateUrl, 'affiliate link'); });
    item('Mở link gốc ↗', function () { window.open(p.url, '_blank', 'noopener'); });
    m.appendChild(h('hr'));
    m.appendChild(h('div', { 'class': 'lbl', text: 'Bộ sưu tập' }));
    db.collections.forEach(function (c) {
      var inIt = c.items.indexOf(p.id) >= 0;
      item((inIt ? '✓ ' : '+ ') + c.name + ' (' + c.items.length + '/' + MAX + ')', function () { toggleIn(c, p); });
    });
    m.appendChild(h('hr'));
    var c = col(active);
    if (c) item('Gỡ khỏi "' + c.name + '"', function () { toggleIn(c, p); });
    item('Xóa sản phẩm', function () {
      if (!confirm('Xóa "' + p.title + '" khỏi thư viện và mọi bộ sưu tập?')) return;
      db.products.splice(db.products.indexOf(p), 1);
      db.collections.forEach(function (cc) { var i = cc.items.indexOf(p.id); if (i >= 0) cc.items.splice(i, 1); });
      save(); renderAll(); toast('Đã xóa sản phẩm');
    }, 'danger');
    var r = btn.getBoundingClientRect();
    m.classList.add('open');
    var left = Math.min(r.right - m.offsetWidth, window.innerWidth - m.offsetWidth - 12);
    var topPos = r.bottom + 6 + m.offsetHeight > window.innerHeight ? r.top - m.offsetHeight - 6 : r.bottom + 6;
    m.style.left = Math.max(12, left) + 'px'; m.style.top = Math.max(12, topPos) + 'px';
  }
  document.addEventListener('click', function (e) { if (!e.target.closest('.menu') && !e.target.closest('.more')) closeMenu(); });
  window.addEventListener('scroll', closeMenu, true);

  function toggleIn(c, p) {
    var i = c.items.indexOf(p.id);
    if (i >= 0) { c.items.splice(i, 1); toast('Đã gỡ khỏi "' + c.name + '"'); }
    else if (c.items.length >= MAX) { toast('"' + c.name + '" đã đủ ' + MAX + ' sản phẩm', true); return; }
    else { c.items.push(p.id); toast('Đã thêm vào "' + c.name + '"'); }
    save(); renderAll();
  }

  // ---------- thêm bằng link ----------
  function createProduct(url, meta, colId, extra) {
    var id = 'p' + Date.now().toString(36);
    var a = Meta.affiliate(url, id);
    var p = Object.assign({
      id: id, url: url, title: meta.title, image: meta.image || '',
      price: meta.price != null ? meta.price : null, currency: meta.currency || 'VND',
      network: a.network.id, affiliateUrl: a.url, visible: true, clicks: 0,
      createdAt: new Date().toISOString().slice(0, 10), source: meta.source || 'manual'
    }, extra || {});
    db.products.unshift(p);
    var c = col(colId);
    if (c) c.items.unshift(id);
    return p;
  }

  $('addForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var url = Meta.normalizeUrl($('url').value);
    if (!url) { toast('Link không hợp lệ', true); return; }
    var dup = db.products.filter(function (p) { return p.url === url; })[0];
    if (dup) { toast('Sản phẩm này đã có trong thư viện'); active = 'all'; flashId = dup.id; renderCols(); renderList(); return; }
    var colId = $('addTo').value, c = col(colId);
    if (c && c.items.length >= MAX) { toast('"' + c.name + '" đã đủ ' + MAX + ' sản phẩm. Chọn bộ sưu tập khác.', true); return; }
    pending = new URL(url).hostname.replace(/^www\./, '');
    $('addBtn').disabled = true; renderList();
    Meta.fetchMeta(url).then(function (meta) {
      pending = null;
      var p = createProduct(url, meta, colId);
      $('url').value = '';
      if (active !== 'all' && active !== colId) active = colId || 'all';
      flashId = p.id; save(); renderAll(); scrollPreviewToShop();
      toast('Đã thêm "' + p.title + '" · affiliate link đã tạo (' + Meta.network(p.network).name + ')');
    }).catch(function () {
      pending = null; renderList();
      openModal(null, { url: url, colId: colId });
    }).then(function () { $('addBtn').disabled = false; });
  });

  function refetch(p) {
    toast('Đang lấy lại thông tin…');
    Meta.fetchMeta(p.url).then(function (meta) {
      p.title = meta.title || p.title; p.image = meta.image || p.image;
      if (meta.price != null) { p.price = meta.price; p.currency = meta.currency || p.currency; }
      p.source = meta.source; flashId = p.id; save(); renderAll(); toast('Đã cập nhật "' + p.title + '"');
    }).catch(function () { openModal(p, { warn: true }); });
  }

  // ---------- modal sửa / điền tay ----------
  function setPv(url) {
    var pv = $('fPv');
    pv.style.backgroundImage = url ? 'url("' + String(url).replace(/"/g, '') + '")' : '';
    pv.textContent = url ? '' : 'Chưa có ảnh';
  }
  function regenAff() {
    var url = Meta.normalizeUrl($('fUrl').value);
    $('fAff').value = url ? Meta.affiliate(url, editing ? editing.id : 'new').url : '';
  }
  function openModal(p, opt) {
    opt = opt || {};
    editing = p;
    var manual = !p;
    $('dlgTitle').textContent = p ? 'Sửa sản phẩm' : 'Thêm sản phẩm (điền tay)';
    $('dlgWarn').classList.toggle('show', manual || !!opt.warn);
    $('fUrl').value = p ? p.url : (opt.url || '');
    $('fTitle').value = p ? p.title : '';
    $('fPrice').value = p && p.price != null ? p.price : '';
    $('fCur').value = p ? (p.currency || 'VND') : (Meta.detect(opt.url || '').id === 'amazon' ? 'USD' : 'VND');
    $('fImg').value = p ? (p.image || '') : '';
    $('fVis').checked = p ? p.visible !== false : true;
    setPv($('fImg').value); regenAff();
    var box = $('fCols'); box.innerHTML = '';
    db.collections.forEach(function (c) {
      var checked = p ? c.items.indexOf(p.id) >= 0 : c.id === opt.colId;
      var full = !checked && c.items.length >= MAX;
      var cb = h('input', { type: 'checkbox', value: c.id }); cb.checked = checked; cb.disabled = full;
      box.appendChild(h('label', { 'class': full ? 'dis' : '', title: full ? 'Đã đủ ' + MAX + ' sản phẩm' : '' }, [cb, c.name + ' ' + c.items.length + '/' + MAX]));
    });
    $('dlg').showModal();
    setTimeout(function () { (manual ? $('fTitle') : $('fTitle')).focus(); }, 50);
  }
  $('fImg').addEventListener('input', function () { setPv(this.value.trim()); });
  $('fUrl').addEventListener('input', regenAff);
  $('fCopy').addEventListener('click', function () { if ($('fAff').value) copy($('fAff').value, 'affiliate link'); });
  $('dlgCancel').addEventListener('click', function () { $('dlg').close(); });
  $('dlgForm').addEventListener('submit', function (e) {
    var url = Meta.normalizeUrl($('fUrl').value), title = $('fTitle').value.trim();
    if (!url || !title) { e.preventDefault(); toast(!url ? 'Link không hợp lệ' : 'Cần nhập tên sản phẩm', true); return; }
    var priceVal = $('fPrice').value === '' ? null : Number($('fPrice').value);
    var chosen = Array.prototype.filter.call($('fCols').querySelectorAll('input'), function (i) { return i.checked; }).map(function (i) { return i.value; });
    var p = editing;
    if (!p) {
      p = createProduct(url, { title: title, image: $('fImg').value.trim(), price: priceVal, currency: $('fCur').value, source: 'manual' }, null);
      $('url').value = '';
    } else {
      if (p.url !== url) { p.url = url; var a = Meta.affiliate(url, p.id); p.affiliateUrl = a.url; p.network = a.network.id; }
      p.title = title; p.image = $('fImg').value.trim(); p.price = priceVal; p.currency = $('fCur').value;
      if (p.source !== 'server') p.source = 'manual';
    }
    p.visible = $('fVis').checked;
    db.collections.forEach(function (c) {
      var i = c.items.indexOf(p.id), want = chosen.indexOf(c.id) >= 0;
      if (want && i < 0) c.items.unshift(p.id);
      if (!want && i >= 0) c.items.splice(i, 1);
    });
    flashId = p.id; save(); renderAll();
    toast(editing ? 'Đã lưu' : 'Đã thêm "' + p.title + '" · affiliate link đã tạo');
    editing = null;
  });

  // ---------- khác ----------
  $('nets').appendChild(h('span', { text: 'Hỗ trợ:' }));
  Meta.NETWORKS.forEach(function (n) { $('nets').appendChild(h('span', {}, [h('b', { text: n.name }), ' · HH ' + n.label])); });
  $('nets').appendChild(h('span', { text: 'Mẹo: link có chữ "fail" để thử popup điền tay' }));

  $('resetBtn').addEventListener('click', function () {
    if (!confirm('Khôi phục thư viện sản phẩm mẫu? Sản phẩm bạn đã thêm sẽ mất.')) return;
    db = Store.reset(); active = 'all'; renderAll(); toast('Đã khôi phục dữ liệu mẫu');
  });

  // Slug xem trước: ưu tiên slug có block Shop
  var slugs = Object.keys(window.LINK_SITES).sort(function (a, b) { return hasShop(slugData(b)) - hasShop(slugData(a)); });
  slugs.forEach(function (s) { $('slugSel').appendChild(h('option', { value: s, text: '/' + s + (hasShop(slugData(s)) ? '' : ' (chưa có Shop)') })); });
  $('slugSel').addEventListener('change', function () { renderPreview(); scrollPreviewToShop(); });
  $('copySlug').addEventListener('click', function () { copy('https://links.example.com/' + $('slugSel').value, 'link trang'); });
  $('openSlug').addEventListener('click', function () { window.open('page.html?slug=' + encodeURIComponent($('slugSel').value), '_blank'); });

  // Kiểm tra server metadata có chạy không
  (function () {
    var ep = window.LINK_META_ENDPOINT || 'http://localhost:8787/meta';
    var st = $('status');
    var set = function (up) {
      st.innerHTML = '';
      st.appendChild(h('span', { 'class': 'dot' + (up ? ' up' : '') }));
      if (up) st.appendChild(h('span', { text: 'Server metadata đang chạy: đọc ảnh, tên, giá từ trang thật.' }));
      else st.appendChild(h('span', {}, ['Chưa chạy server metadata → dùng dữ liệu giả lập. Để đọc trang thật: ', h('code', { text: 'node demo/tools/meta-server.js' })]));
    };
    fetch(ep).then(function () { set(true); }, function () { set(false); });
  })();

  renderAll();
  setTimeout(scrollPreviewToShop, 300);
})();
