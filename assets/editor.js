/* Editor (mock dashboard): chọn template, ghi đè theme, kéo block vào vùng theo allow/max,
   preview mobile/desktop, Draft → Publish, lịch sử phiên bản + rollback. */
(function () {
  'use strict';
  var SITES = window.LINK_SITES, TEMPLATES = window.LINK_TEMPLATES;
  var LB = window.LinkBio, V = window.LinkVersions;
  var REGIONS = LB.REGIONS; // hero, main, footer
  var $ = function (id) { return document.getElementById(id); };
  var params = new URLSearchParams(location.search);
  var slug = SITES[params.get('slug')] ? params.get('slug') : Object.keys(SITES)[0];
  var site, device = 'mobile', collapsed = {}, flashId = null, drag = null;
  try { device = localStorage.getItem('linkbio-device') || 'mobile'; } catch (e) {}

  var TYPE_LABEL = {
    'hero-video': 'Hero video', 'card': 'Card', 'carousel': 'Carousel', 'banner': 'Banner', 'link': 'Link',
    'release': 'Release', 'video': 'Video slider', 'events': 'Tour/Events', 'products': 'Merch', 'subscribe': 'Subscribe', 'shop': 'Shop (affiliate)'
  };
  var VARIANT_LABEL = { 'list': 'Danh sách', 'grid-2': 'Lưới 2 cột', 'carousel': 'Vuốt ngang' };
  var DESK_LABEL = { 'center': 'desktop: cột giữa', 'split': 'desktop: chia đôi', 'grid': 'desktop: lưới' };
  var SIZE_OPTS = [['', 'Tự động'], ['wide', 'Cả hàng'], ['normal', '1 ô']];
  var FIELDS = {
    'hero-video': [['text', 'Text'], ['badge', 'Badge'], ['url', 'URL', 'full'], ['thumbnail', 'Thumbnail URL', 'full'], ['pinned', 'Ghim', 'checkbox']],
    'card': [['text', 'Text'], ['subtext', 'Mô tả'], ['url', 'URL', 'full'], ['thumbnail', 'Thumbnail URL (trống = icon)', 'full'], ['metric', 'Số liệu lớn (vd. 816)'], ['unit', 'Đơn vị (vd. kwh)'], ['score', 'Viral score', 'number'], ['publishedAt', 'Ngày đăng', 'date'], ['size', 'Độ rộng trong lưới', SIZE_OPTS], ['pinned', 'Ghim', 'checkbox']],
    'carousel': [['title', 'Tiêu đề'], ['viewAll', 'Link "View all"'], ['navLabel', 'Tên trên dock'], ['score', 'Viral score', 'number'], ['pinned', 'Ghim', 'checkbox']],
    'banner': [['text', 'Text'], ['subtext', 'Mô tả'], ['url', 'URL', 'full'], ['pinned', 'Ghim', 'checkbox']],
    'link': [['text', 'Text'], ['url', 'URL'], ['icon', 'Icon (kiểu nổi bật)', [['', 'bolt'], ['link', 'link'], ['bag', 'bag'], ['play', 'play'], ['mail', 'mail'], ['ticket', 'ticket'], ['grid', 'grid']]], ['size', 'Độ rộng trong lưới', SIZE_OPTS], ['primary', 'Kiểu nổi bật (pill sọc tối)', 'checkbox'], ['pinned', 'Ghim', 'checkbox']],
    'release': [['title', 'Tiêu đề section'], ['navLabel', 'Tên trên dock'], ['cta', 'Nút CTA'], ['bg', 'Màu nền', 'color'], ['url', 'URL', 'full'], ['thumbnail', 'Ảnh bìa URL', 'full'], ['pinned', 'Ghim', 'checkbox']],
    'video': [['title', 'Tiêu đề section'], ['viewAll', 'Link "View all"'], ['navLabel', 'Tên trên dock'], ['score', 'Viral score', 'number'], ['pinned', 'Ghim', 'checkbox']],
    'events': [['title', 'Tiêu đề section'], ['viewAll', 'Link "View all"'], ['navLabel', 'Tên trên dock'], ['pinned', 'Ghim', 'checkbox']],
    'products': [['title', 'Tiêu đề section'], ['viewAll', 'Link "View all"'], ['navLabel', 'Tên trên dock'], ['pinned', 'Ghim', 'checkbox']],
    'subscribe': [['title', 'Tiêu đề section'], ['navLabel', 'Tên trên dock'], ['text', 'Mô tả', 'full'], ['placeholder', 'Placeholder'], ['cta', 'Nút']],
    'shop': [['title', 'Tiêu đề section'], ['navLabel', 'Tên trên dock'], ['viewAll', 'Link "View all"'], ['limit', 'Số sản phẩm / tab', 'number'], ['pinned', 'Ghim', 'checkbox']]
  };
  var ITEM_FIELDS = {
    'carousel': [['text', 'Text'], ['url', 'URL'], ['thumbnail', 'Ảnh URL']],
    'video': [['text', 'Caption'], ['url', 'URL'], ['thumbnail', 'Ảnh URL'], ['bg', 'Nền', 'color']],
    'events': [['date', 'Ngày', 'date'], ['venue', 'Địa điểm'], ['city', 'Thành phố'], ['url', 'Link vé']],
    'products': [['text', 'Tên'], ['price', 'Giá'], ['url', 'URL'], ['thumbnail', 'Ảnh URL']]
  };
  var DEFAULTS = {
    'hero-video': { 'text': 'Video mới', 'badge': '🔥 Đang viral', 'url': 'https://', 'thumbnail': '' },
    'card': { 'text': 'Sản phẩm mới', 'subtext': '', 'url': 'https://', 'thumbnail': '', 'score': 0, 'publishedAt': new Date().toISOString().slice(0, 10) },
    'carousel': { 'title': 'Carousel', 'items': [{ 'id': '', 'text': 'Item 1', 'url': 'https://', 'thumbnail': '' }] },
    'banner': { 'text': 'Khuyến mãi', 'subtext': '', 'url': 'https://' },
    'link': { 'text': 'Link mới', 'url': 'https://' },
    'release': { 'title': 'Latest release', 'cta': 'Listen now', 'bg': '#E6CA9A', 'url': 'https://', 'thumbnail': 'data/img/cassette.svg' },
    'video': { 'title': 'Videos', 'viewAll': '', 'items': [{ 'id': '', 'text': 'Video 1', 'url': 'https://', 'thumbnail': 'data/img/cassette-yellow.svg', 'bg': '#CBD77E' }] },
    'events': { 'title': 'Tour Dates', 'viewAll': '', 'items': [{ 'id': '', 'date': '2027-06-23', 'venue': 'Venue', 'city': 'City', 'url': 'https://' }] },
    'products': { 'title': 'Merch', 'viewAll': '', 'items': [{ 'id': '', 'text': 'Sản phẩm', 'price': '$10.00', 'url': 'https://', 'thumbnail': 'data/img/tshirt.svg' }] },
    'subscribe': { 'title': 'Mailing List', 'text': 'Đăng ký để nhận tin mới nhất.', 'placeholder': 'name@email.com', 'cta': 'Subscribe' },
    'shop': { 'title': 'Shop của mình', 'navLabel': 'Shop', 'collections': [], 'limit': 6 }
  };
  var PREFIX = { 'hero-video': 'v', 'card': 'p', 'carousel': 'c', 'banner': 'b', 'link': 'l', 'release': 'r', 'video': 'vd', 'events': 't', 'products': 'm', 'subscribe': 's', 'shop': 'sh' };
  var THEME_KEYS = [
    ['bg', 'Màu nền', 'color'], ['accent', 'Màu nhấn', 'color'], ['radius', 'Bo góc', 'range'],
    ['button', 'Kiểu nút', [['pill', 'Pill'], ['rounded', 'Bo vừa']]],
    ['font', 'Font', [['Sora', 'Sora'], ['Manrope', 'Manrope'], ['Inter', 'Inter'], ['DM Sans', 'DM Sans'], ['Be Vietnam Pro', 'Be Vietnam Pro']]]
  ];

  // ---------- dữ liệu ----------
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function draftKey() { return V.DRAFT_PREFIX + slug; }
  function log(msg) { $('log').textContent = msg; }
  function tpl() { return LB.templateOf(site); }
  function spec(r) { return tpl().regions[r] || {}; }
  function region(r) { site.layout[r] = site.layout[r] || { blocks: [] }; site.layout[r].blocks = site.layout[r].blocks || []; return site.layout[r]; }
  function byId(id) { return site.blocks.filter(function (b) { return b.id === id; })[0]; }
  function regionOf(id) { for (var i = 0; i < REGIONS.length; i++) if (region(REGIONS[i]).blocks.indexOf(id) >= 0) return REGIONS[i]; return null; }
  function unplaced() { return site.blocks.filter(function (b) { return !regionOf(b.id); }); }

  function load() {
    site = null;
    try { var d = localStorage.getItem(draftKey()); if (d) site = JSON.parse(d); } catch (e) {}
    if (!site) site = V.current(slug) || clone(SITES[slug]);
    site.theme = site.theme || {};
    site.profile = site.profile || {};
    site.blocks = site.blocks || [];
    site.layout = clone(LB.layoutOf(site)); // JSON kiểu cũ → dồn vào main
    REGIONS.forEach(region);
    if (!TEMPLATES[site.template]) site.template = 'classic';
    collapsed = {};
  }
  function newBlock(type) {
    var p = PREFIX[type], n = 1;
    var used = site.blocks.map(function (b) { return b.id; });
    while (used.indexOf(p + n) >= 0) n++;
    var blk = Object.assign({ type: type, id: p + n }, clone(DEFAULTS[type]));
    if (blk.items) blk.items[0].id = blk.id + '-1';
    return blk;
  }
  function get(path) { return path.split('.').reduce(function (o, k) { return o && o[k]; }, site); }
  function set(path, v) {
    var ks = path.split('.'), o = site;
    for (var i = 0; i < ks.length - 1; i++) { o[ks[i]] = o[ks[i]] || {}; o = o[ks[i]]; }
    o[ks[ks.length - 1]] = v;
  }

  // ---------- luật vùng (allow / max) ----------
  /** Trả về null nếu thả được, ngược lại là lý do không thả được. */
  function denyReason(type, r, movingId) {
    if (!r) return null; // vùng "chưa đặt" nhận mọi block
    var s = spec(r);
    if (s.allow && s.allow.indexOf(type) < 0) return 'Vùng ' + (s.label || r) + ' của template "' + tpl().name + '" không nhận ' + (TYPE_LABEL[type] || type);
    if (s.max) {
      var n = region(r).blocks.filter(function (id) { return id !== movingId; }).length;
      if (n >= s.max) return 'Vùng ' + (s.label || r) + ' chỉ chứa tối đa ' + s.max + ' block';
    }
    return null;
  }
  /** Đặt block vào vùng r (null = chưa đặt), trước/sau targetId. */
  function place(block, r, targetId, before) {
    var why = denyReason(block.type, r, block.id);
    if (why) { log('⛔ ' + why); return false; }
    if (!byId(block.id)) { site.blocks.push(block); collapsed[block.id] = false; } // block mới: mở sẵn form
    REGIONS.forEach(function (x) { var l = region(x).blocks, i = l.indexOf(block.id); if (i >= 0) l.splice(i, 1); });
    if (r) {
      var list = region(r).blocks, idx = list.length;
      if (targetId && list.indexOf(targetId) >= 0) idx = list.indexOf(targetId) + (before ? 0 : 1);
      list.splice(idx, 0, block.id);
      if (LB.rankOf(site, r) && list.length > 1) log('Vùng ' + (spec(r).label || r) + ' đang tự xếp theo viral: vị trí hiển thị do Ghim → score → ngày đăng quyết định.');
      else log('Đã đặt ' + block.id + ' vào ' + (spec(r).label || r));
    } else log(block.id + ' chuyển sang "Chưa đặt" (không hiển thị)');
    flashId = block.id;
    renderZones(); refresh();
    return true;
  }
  /** Vùng mặc định khi bấm nút "+": ưu tiên main → hero → footer, còn lại thì chưa đặt. */
  function defaultRegion(type) {
    var order = ['main', 'hero', 'footer'];
    for (var i = 0; i < order.length; i++) if (!denyReason(type, order[i], null)) return order[i];
    return null;
  }
  /** Đổi template: block không hợp lệ ở vùng mới → chuyển vùng khác hoặc "chưa đặt". */
  function applyTemplate(id) {
    if (site.template === id) return;
    site.template = id;
    var moved = [];
    REGIONS.forEach(function (r) {
      var keep = [];
      region(r).blocks.slice().forEach(function (bid) {
        var b = byId(bid); if (!b) return;
        var s = spec(r);
        var ok = (!s.allow || s.allow.indexOf(b.type) >= 0) && (!s.max || keep.length < s.max);
        if (ok) keep.push(bid); else moved.push(b);
      });
      region(r).blocks = keep;
    });
    moved.forEach(function (b) {
      var to = defaultRegion(b.type);
      if (to) region(to).blocks.push(b.id);
      b._moved = to || 'chưa đặt';
    });
    var mv = site.layout.main.variant;
    if (mv && (spec('main').variants || []).indexOf(mv) < 0) delete site.layout.main.variant;
    var msg = 'Đã đổi sang template "' + tpl().name + '".';
    if (moved.length) msg += ' Chuyển: ' + moved.map(function (b) { var s = b.id + ' → ' + b._moved; delete b._moved; return s; }).join(', ');
    log(msg);
    renderTemplates(); renderTheme(); renderZones(); refresh();
  }

  // ---------- preview ----------
  function screen() { return device === 'desktop' ? $('pvDesk') : $('pvMobile'); }
  function fit() {
    var vp = $('vp'), s = vp.clientWidth / 1280;
    $('pvDesk').style.transform = 'scale(' + s + ')';
    vp.style.height = Math.round(800 * s) + 'px';
  }
  function refresh() {
    site.updatedAt = new Date().toISOString().slice(0, 19) + 'Z';
    var root = screen(), top = root.scrollTop;
    LB.render(clone(site), root, {
      preventNav: true, highlight: flashId, showEmpty: true,
      onTrack: function (p) { log('track → block=' + p.blockId + ' pos=' + p.position); }
    });
    root.scrollTop = top;
    enablePreviewDnd(root);
    flashId = null;
    $('url').textContent = 'links.example.com/' + slug;
    $('json').textContent = JSON.stringify(site, null, 2);
    try { localStorage.setItem(draftKey(), JSON.stringify(site)); } catch (e) {}
    renderStatus();
  }
  function clearMarks(scope) {
    scope.querySelectorAll('.dnd-before,.dnd-after,.dnd-over,.dnd-deny,.drop-before,.drop-after,.over').forEach(function (n) {
      n.classList.remove('dnd-before', 'dnd-after', 'dnd-over', 'dnd-deny', 'drop-before', 'drop-after', 'over');
    });
  }
  function dragType() { return drag ? (drag.type || (byId(drag.id) || {}).type) : null; }

  function enablePreviewDnd(root) {
    root.querySelectorAll('.lb-region [data-block-id]').forEach(function (n) {
      n.draggable = true;
      n.addEventListener('dragstart', function (e) {
        e.stopPropagation();
        drag = { id: n.getAttribute('data-block-id') };
        e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', drag.id);
        setTimeout(function () { n.classList.add('dnd-src'); }, 0);
        markZones();
      });
      n.addEventListener('dragend', function () { drag = null; n.classList.remove('dnd-src'); clearMarks(root); unmarkZones(); });
    });
    root.querySelectorAll('.lb-region[data-region]').forEach(function (reg) {
      var r = reg.getAttribute('data-region');
      var pos = function (e) {
        var t = e.target.closest && e.target.closest('[data-block-id]');
        if (!t || !reg.contains(t)) return null;
        var rc = t.getBoundingClientRect();
        var horiz = rc.width < reg.getBoundingClientRect().width * 0.9;
        return { el: t, id: t.getAttribute('data-block-id'), before: horiz ? e.clientX < rc.left + rc.width / 2 : e.clientY < rc.top + rc.height / 2 };
      };
      reg.addEventListener('dragover', function (e) {
        if (!drag) return;
        clearMarks(root);
        if (denyReason(dragType(), r, drag.id)) { reg.classList.add('dnd-deny'); return; }
        e.preventDefault();
        reg.classList.add('dnd-over');
        var p = pos(e);
        if (p && p.id !== drag.id) p.el.classList.add(p.before ? 'dnd-before' : 'dnd-after');
      });
      reg.addEventListener('drop', function (e) {
        if (!drag) return;
        e.preventDefault(); e.stopPropagation();
        var p = pos(e), block = drag.type ? newBlock(drag.type) : byId(drag.id);
        drag = null; clearMarks(root); unmarkZones();
        if (p && p.id === block.id) return;
        place(block, r, p ? p.id : null, p ? p.before : false);
      });
    });
  }

  // ---------- form helpers ----------
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
  function btn(text, fn, title, cls) { return h('button', { 'class': 'btn sm ' + (cls || ''), type: 'button', text: text, title: title || '', on: { click: fn } }); }

  function fieldInput(obj, key, label, kind) {
    var inp;
    if (Array.isArray(kind)) {
      inp = h('select');
      kind.forEach(function (o) { var op = h('option', { value: o[0], text: o[1] }); if ((obj[key] || '') === o[0]) op.selected = true; inp.appendChild(op); });
      inp.addEventListener('change', function () { if (inp.value) obj[key] = inp.value; else delete obj[key]; flashId = obj.id; refresh(); });
      return h('label', { 'class': 'f' }, [label, inp]);
    }
    inp = h('input', { type: ['checkbox', 'number', 'date', 'color'].indexOf(kind) >= 0 ? kind : 'text' });
    if (kind === 'checkbox') inp.checked = !!obj[key];
    else inp.value = obj[key] == null ? '' : obj[key];
    inp.addEventListener(kind === 'checkbox' ? 'change' : 'input', function () {
      if (kind === 'checkbox') { if (inp.checked) obj[key] = true; else delete obj[key]; }
      else if (kind === 'number') { if (inp.value === '') delete obj[key]; else obj[key] = Number(inp.value); }
      else obj[key] = inp.value;
      if (kind === 'checkbox' || kind === 'number') flashId = obj.id;
      if (['text', 'title', 'score', 'pinned'].indexOf(key) >= 0) updateSummary(obj);
      refresh();
    });
    var cls = 'f' + (kind === 'checkbox' ? ' ck' : '') + (kind === 'full' ? ' full' : '');
    if (kind === 'checkbox') return h('label', { 'class': cls }, [inp, label]);
    return h('label', { 'class': cls }, [label, inp]);
  }
  function summary(b) { return (b.pinned ? '📌 ' : '') + (b.text || b.title || '') + (typeof b.score === 'number' ? ' · score ' + b.score : ''); }
  function updateSummary(b) { var n = $('zones').querySelector('[data-id="' + b.id + '"] .sum'); if (n) n.textContent = summary(b); }

  // ---------- template + theme ----------
  function miniFor(t) {
    var m = h('div', { 'class': 'mini' });
    var cells = { 'classic': ['h', '', '', ''], 'video-first': ['o', '', '', ''], 'shop-grid': ['h', '', '', '', ''] }[t.id] || ['', '', ''];
    if (t.id === 'shop-grid') { m.style.gridTemplateColumns = '1fr 1fr'; m.style.gridTemplateRows = '14px 1fr 1fr'; }
    if (t.id === 'video-first') m.style.gridTemplateRows = '2fr 1fr 1fr';
    cells.forEach(function (c, i) { var x = h('i', { 'class': c }); if (t.id === 'shop-grid' && i === 0) x.style.gridColumn = '1/-1'; m.appendChild(x); });
    return m;
  }
  function renderTemplates() {
    var box = $('tpls'); box.innerHTML = '';
    Object.keys(TEMPLATES).forEach(function (id) {
      var t = TEMPLATES[id];
      var r = h('input', { type: 'radio', name: 'tpl', value: id }); r.checked = site.template === id;
      r.addEventListener('change', function () { applyTemplate(id); });
      box.appendChild(h('label', { 'class': 'tpl' }, [r, miniFor(t), t.name, h('small', { text: t.description }),
        h('em', { text: (DESK_LABEL[t.desktop] || t.desktop) + ' · main: ' + (VARIANT_LABEL[t.regions.main.defaultVariant] || '') })]));
    });
  }
  function renderTheme() {
    var box = $('themeOv'), defs = tpl().themeDefaults || {};
    box.innerHTML = '';
    THEME_KEYS.forEach(function (k) {
      var key = k[0], over = site.theme[key] != null && site.theme[key] !== '';
      var val = over ? site.theme[key] : defs[key];
      var ck = h('input', { type: 'checkbox', title: 'Ghi đè giá trị của template' }); ck.checked = over;
      var inp;
      if (Array.isArray(k[2])) {
        inp = h('select');
        k[2].forEach(function (o) { var op = h('option', { value: o[0], text: o[1] }); if (String(val) === o[0]) op.selected = true; inp.appendChild(op); });
      } else if (k[2] === 'range') {
        inp = h('input', { type: 'range', min: 0, max: 40, step: 2 }); inp.value = val;
      } else { inp = h('input', { type: 'color' }); inp.value = val || '#000000'; }
      inp.disabled = !over;
      var note = h('small', { text: over ? '' : 'theo template: ' + val });
      var write = function () { site.theme[key] = k[2] === 'range' ? Number(inp.value) : inp.value; note.textContent = k[2] === 'range' ? inp.value + 'px' : ''; refresh(); };
      ck.addEventListener('change', function () {
        if (ck.checked) { inp.disabled = false; write(); }
        else { delete site.theme[key]; renderTheme(); refresh(); }
      });
      inp.addEventListener('input', write);
      var cell = h('div', { style: 'display:flex;gap:8px;align-items:center' }, [inp, note]);
      box.appendChild(h('span', { 'class': 'k', text: k[1] })); box.appendChild(ck); box.appendChild(cell);
    });
  }

  // ---------- vùng & block ----------
  function renderPalette() {
    var box = $('palette'); box.innerHTML = '';
    Object.keys(TYPE_LABEL).forEach(function (type) {
      var b = h('button', { 'class': 'btn sm' + (type === 'shop' ? ' olive' : ''), type: 'button', draggable: 'true', text: '+ ' + TYPE_LABEL[type] });
      var to = defaultRegion(type);
      b.title = to ? 'Bấm: thêm vào ' + (spec(to).label || to) + ' · hoặc kéo vào vùng' : 'Template này không có vùng nhận loại block này';
      b.addEventListener('click', function () {
        var blk = newBlock(type), r = defaultRegion(type);
        if (!r) { site.blocks.push(blk); flashId = blk.id; renderZones(); refresh(); log(TYPE_LABEL[type] + ' không hợp với template này → để ở "Chưa đặt"'); return; }
        place(blk, r, null, false);
      });
      b.addEventListener('dragstart', function (e) { drag = { type: type }; e.dataTransfer.effectAllowed = 'copy'; e.dataTransfer.setData('text/plain', type); markZones(); });
      b.addEventListener('dragend', function () { drag = null; unmarkZones(); clearMarks(document); });
      box.appendChild(b);
    });
  }
  function markZones() {
    var t = dragType();
    document.querySelectorAll('.zone').forEach(function (z) {
      var r = z.getAttribute('data-zone') || null;
      z.classList.toggle('can', !denyReason(t, r, drag && drag.id));
      z.classList.toggle('deny', !!denyReason(t, r, drag && drag.id));
    });
  }
  function unmarkZones() { document.querySelectorAll('.zone').forEach(function (z) { z.classList.remove('can', 'deny', 'over'); }); }

  function renderZones() {
    var box = $('zones'); box.innerHTML = '';
    REGIONS.forEach(function (r) { box.appendChild(zone(r)); });
    box.appendChild(zone(null));
    renderPalette();
  }
  function zone(r) {
    var s = r ? spec(r) : {};
    var list = r ? region(r).blocks.map(byId).filter(Boolean) : unplaced();
    var z = h('div', { 'class': 'zone' + (r ? '' : ' unplaced'), 'data-zone': r || '' });
    var head = h('div', { 'class': 'zone-h' }, [
      h('b', { text: r ? (s.label || r) : 'Chưa đặt (không hiển thị)' }),
      h('span', { 'class': 'cnt', text: r && s.max ? list.length + '/' + s.max : String(list.length) })
    ]);
    if (r) {
      var ctl = h('span', { 'class': 'ctl' });
      if ((s.variants || []).length > 1) {
        var sel = h('select', { title: 'Kiểu hiển thị của vùng' });
        s.variants.forEach(function (v) { var o = h('option', { value: v, text: VARIANT_LABEL[v] || v }); if (LB.variantOf(site, r) === v) o.selected = true; sel.appendChild(o); });
        sel.addEventListener('change', function () { region(r).variant = sel.value; refresh(); });
        ctl.appendChild(sel);
      }
      var rk = h('input', { type: 'checkbox' }); rk.checked = LB.rankOf(site, r);
      rk.addEventListener('change', function () {
        var def = s.rank != null ? !!s.rank : r === 'main';
        if (rk.checked === def) delete region(r).rank; else region(r).rank = rk.checked;
        log(rk.checked ? 'Vùng ' + (s.label || r) + ': tự xếp theo Ghim → viral score → ngày đăng' : 'Vùng ' + (s.label || r) + ': giữ đúng thứ tự kéo thả');
        refresh();
      });
      ctl.appendChild(h('label', { title: 'Tự xếp theo ghim → viral score → ngày đăng' }, [rk, 'Tự xếp']));
      head.appendChild(ctl);
      head.appendChild(h('span', { 'class': 'allow', text: 'Nhận: ' + (s.allow || []).map(function (t) { return TYPE_LABEL[t] || t; }).join(', ') }));
    } else {
      head.appendChild(h('span', { 'class': 'allow', text: 'Block không nằm trong vùng nào. Kéo vào vùng để hiển thị.' }));
    }
    z.appendChild(head);
    var body = h('div', { 'class': 'zone-list' });
    if (!list.length) body.appendChild(h('div', { 'class': 'empty', text: r ? 'Thả block vào đây' : 'Trống' }));
    list.forEach(function (b) { body.appendChild(blockCard(b, r)); });
    z.appendChild(body);

    // Thả vào vùng trong form
    var pos = function (e) {
      var t = e.target.closest && e.target.closest('.blk');
      if (!t || !z.contains(t)) return null;
      var rc = t.getBoundingClientRect();
      return { el: t, id: t.getAttribute('data-id'), before: e.clientY < rc.top + rc.height / 2 };
    };
    z.addEventListener('dragover', function (e) {
      if (!drag || drag.item) return;
      if (denyReason(dragType(), r, drag.id)) return;
      e.preventDefault();
      clearMarks($('zones')); markZones(); z.classList.add('over');
      var p = pos(e);
      if (p && p.id !== drag.id) p.el.classList.add(p.before ? 'drop-before' : 'drop-after');
    });
    z.addEventListener('drop', function (e) {
      if (!drag || drag.item) return;
      e.preventDefault();
      var p = pos(e), block = drag.type ? newBlock(drag.type) : byId(drag.id);
      drag = null; unmarkZones(); clearMarks($('zones'));
      if (p && p.id === block.id) return;
      place(block, r, p ? p.id : null, p ? p.before : false);
    });
    return z;
  }

  function blockCard(b, r) {
    var handle = h('span', { 'class': 'handle', title: 'Kéo để đổi chỗ / đổi vùng', text: '⋮⋮' });
    var head = h('div', { 'class': 'blk-h' }, [
      handle,
      h('span', { 'class': 'ty', text: TYPE_LABEL[b.type] || b.type }),
      h('span', { 'class': 'id', text: '#' + b.id }),
      h('span', { 'class': 'sum', text: summary(b) }),
      h('span', { 'class': 'tools' }, [
        btn(b.hidden ? 'Hiện' : 'Ẩn', function () { if (b.hidden) delete b.hidden; else b.hidden = true; renderZones(); refresh(); }, 'Ẩn / hiện block trên trang'),
        btn(collapsed[b.id] === false ? '▾' : '▸', function () { collapsed[b.id] = collapsed[b.id] === false; renderZones(); }, 'Mở / thu gọn'),
        btn('⧉', function () {
          var c = clone(b); c.id = newBlock(b.type).id;
          if (!place(c, r, b.id, false)) place(c, null, null, false);
        }, 'Nhân bản'),
        btn('✕', function () {
          site.blocks.splice(site.blocks.indexOf(b), 1);
          REGIONS.forEach(function (x) { var l = region(x).blocks, i = l.indexOf(b.id); if (i >= 0) l.splice(i, 1); });
          renderZones(); refresh();
        }, 'Xóa')
      ])
    ]);
    var row = h('div', { 'class': 'row' });
    (FIELDS[b.type] || []).forEach(function (f) { row.appendChild(fieldInput(b, f[0], f[1], f[2])); });
    if (ITEM_FIELDS[b.type]) row.appendChild(itemsEditor(b));
    if (b.type === 'shop') row.appendChild(collectionPicker(b));
    // mặc định thu gọn; collapsed[id] === false nghĩa là đang mở
    var card = h('div', { 'class': 'blk' + (collapsed[b.id] === false ? '' : ' collapsed') + (b.hidden ? ' is-hidden' : ''), 'data-id': b.id }, [head, row]);
    handle.addEventListener('mousedown', function () { card.draggable = true; });
    card.addEventListener('dragstart', function (e) {
      if (drag && drag.item) return;
      drag = { id: b.id };
      e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', b.id);
      setTimeout(function () { card.classList.add('dragging'); }, 0);
      markZones();
    });
    card.addEventListener('dragend', function () { card.draggable = false; card.classList.remove('dragging'); drag = null; unmarkZones(); clearMarks($('zones')); });
    return card;
  }

  /** Block Shop: chọn bộ sưu tập (mỗi bộ = 1 tab), lấy từ thư viện sản phẩm. */
  function collectionPicker(b) {
    var db = window.LinkStore ? window.LinkStore.load() : { collections: [] };
    b.collections = b.collections || [];
    var wrap = h('div', { 'class': 'items' }, [h('div', { 'class': 'hint', text: 'Bộ sưu tập hiển thị (thứ tự tab theo thứ tự chọn):' })]);
    var row = h('div', { 'class': 'colpick' });
    db.collections.forEach(function (c) {
      var cb = h('input', { type: 'checkbox' }); cb.checked = b.collections.indexOf(c.id) >= 0;
      cb.addEventListener('change', function () {
        var i = b.collections.indexOf(c.id);
        if (cb.checked && i < 0) b.collections.push(c.id);
        if (!cb.checked && i >= 0) b.collections.splice(i, 1);
        flashId = b.id; refresh();
      });
      row.appendChild(h('label', { 'class': 'pill' }, [cb, c.name + ' · ' + c.items.length]));
    });
    wrap.appendChild(row);
    var a = h('a', { href: 'products.html', text: 'Quản lý sản phẩm & bộ sưu tập →' });
    a.style.cssText = 'display:inline-block;margin-top:10px;font-size:12.5px;color:var(--text)';
    wrap.appendChild(a);
    return wrap;
  }

  /** Danh sách item (carousel, video, events, products): sửa, xóa, kéo đổi chỗ. */
  function itemsEditor(b) {
    var defs = ITEM_FIELDS[b.type];
    var wrap = h('div', { 'class': 'items' });
    var from = null;
    b.items = b.items || [];
    b.items.forEach(function (it, k) {
      if (!it.id) it.id = b.id + '-' + (k + 1);
      var cells = [h('span', { 'class': 'handle', title: 'Kéo để đổi chỗ', text: '⋮⋮' })];
      defs.forEach(function (f) {
        var inp = h('input', { placeholder: f[1], title: f[1], type: f[2] || 'text' }); inp.value = it[f[0]] || (f[2] === 'color' ? '#888888' : '');
        inp.addEventListener('input', function () { it[f[0]] = inp.value; refresh(); });
        cells.push(inp);
      });
      cells.push(btn('✕', function () { b.items.splice(k, 1); renderZones(); refresh(); }));
      var row = h('div', { 'class': 'item', style: 'grid-template-columns:auto ' + defs.map(function (f) { return f[2] === 'color' ? '44px' : 'minmax(0,1fr)'; }).join(' ') + ' auto' }, cells);
      cells[0].addEventListener('mousedown', function () { row.draggable = true; });
      row.addEventListener('dragstart', function (e) { e.stopPropagation(); from = k; drag = { item: true }; e.dataTransfer.setData('text/plain', 'item'); row.style.opacity = '.4'; });
      row.addEventListener('dragend', function (e) { e.stopPropagation(); row.draggable = false; row.style.opacity = ''; from = null; drag = null; });
      row.addEventListener('dragover', function (e) { if (from === null) return; e.preventDefault(); e.stopPropagation(); });
      row.addEventListener('drop', function (e) {
        if (from === null) return;
        e.preventDefault(); e.stopPropagation();
        b.items.splice(k, 0, b.items.splice(from, 1)[0]);
        from = null; drag = null; renderZones(); refresh();
      });
      wrap.appendChild(row);
    });
    wrap.appendChild(btn('+ Item', function () {
      var tplItem = clone(DEFAULTS[b.type].items[0]);
      tplItem.id = b.id + '-' + (b.items.length + 1);
      b.items.push(tplItem);
      renderZones(); refresh();
    }));
    return wrap;
  }

  function renderSocials() {
    var box = $('socials'); box.innerHTML = '';
    site.profile.socials = site.profile.socials || [];
    site.profile.socials.forEach(function (s, i) {
      var sel = h('select');
      ['facebook', 'tiktok', 'instagram', 'youtube', 'twitter', 'zalo', 'website'].forEach(function (t) {
        var o = h('option', { text: t }); if (t === s.type) o.selected = true; sel.appendChild(o);
      });
      sel.addEventListener('change', function () { s.type = sel.value; refresh(); });
      var url = h('input', { placeholder: 'https://' }); url.value = s.url || '';
      url.addEventListener('input', function () { s.url = url.value; refresh(); });
      box.appendChild(h('div', { 'class': 'soc' }, [sel, url, btn('✕', function () { site.profile.socials.splice(i, 1); renderSocials(); refresh(); })]));
    });
  }

  function bindStatic() {
    document.querySelectorAll('[data-p]').forEach(function (inp) { inp.value = get(inp.getAttribute('data-p')) || ''; });
    $('platform').value = site.source && site.source.platform || 'facebook';
    $('navCk').checked = !!site.nav;
  }

  // ---------- Draft → Publish, lịch sử ----------
  function renderStatus() {
    var st = V.load(slug), cur = V.current(slug);
    var dirty = !V.same(cur, site);
    var el = $('pubSt');
    el.classList.toggle('dirty', dirty);
    el.lastChild.textContent = dirty ? 'Bản nháp có thay đổi chưa publish · đang chạy v' + st.current : 'Đã publish · v' + st.current + ' đang chạy';
    $('publishBtn').disabled = !dirty;
    $('discardBtn').disabled = !dirty;
  }
  function openPublish() {
    var st = V.load(slug), changes = V.diff(V.current(slug), site);
    $('pubTitle').textContent = 'Publish /' + slug + ' (v' + (st.versions.reduce(function (m, x) { return Math.max(m, x.v); }, 0) + 1) + ')';
    $('pubSub').textContent = 'Thay đổi so với v' + st.current + ' đang chạy:';
    var ul = $('pubChanges'); ul.innerHTML = '';
    (changes.length ? changes : ['Không có thay đổi']).forEach(function (c) { ul.appendChild(h('li', { text: c })); });
    $('pubNote').value = '';
    $('pubDlg').showModal();
  }
  $('pubForm').addEventListener('submit', function () {
    var v = V.publish(slug, site, $('pubNote').value.trim());
    renderStatus();
    log('✓ Đã publish v' + v + ' · gọi webhook build lại /' + slug + ' → purge cache CDN (giả lập)');
  });
  $('pubCancel').addEventListener('click', function () { $('pubDlg').close(); });

  function fmtTime(iso) { var d = new Date(iso); return isNaN(d) ? '' : d.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }); }
  function openHistory() {
    var st = V.load(slug), box = $('vers'); box.innerHTML = '';
    st.versions.slice().reverse().forEach(function (ver) {
      var isCur = ver.v === st.current;
      var acts = h('div', { 'class': 'acts' }, [
        btn('Xem ↗', function () { window.open('page.html?slug=' + encodeURIComponent(slug) + '&v=' + ver.v, '_blank'); }),
        isCur ? null : btn('Khôi phục bản này', function () {
          if (!confirm('Publish lại nội dung v' + ver.v + ' thành phiên bản mới? Bản nháp hiện tại sẽ bị thay.')) return;
          var nv = V.rollback(slug, ver.v);
          try { localStorage.removeItem(draftKey()); } catch (e) {}
          loadAll(); openHistory();
          log('↩ Rollback: v' + nv + ' = nội dung v' + ver.v + ' · build lại /' + slug + ' (giả lập)');
        }, '', 'primary')
      ]);
      var node = h('div', { 'class': 'ver' + (isCur ? ' cur' : '') }, [
        h('div', { 'class': 'vn', text: 'v' + ver.v }),
        h('div', {}, [
          h('div', { 'class': 'note' }, [ver.note || '(không ghi chú)', isCur ? h('span', { 'class': 'tag-cur', text: 'đang chạy' }) : null]),
          h('div', { 'class': 'meta', text: fmtTime(ver.at) + ' · ' + ver.by + ' · template ' + ((ver.json || {}).template || 'cũ') })
        ]),
        acts
      ]);
      if (ver.changes && ver.changes.length) {
        var ul = h('ul'); ver.changes.forEach(function (c) { ul.appendChild(h('li', { text: c })); }); node.appendChild(ul);
      }
      box.appendChild(node);
    });
    if (!$('hisDlg').open) $('hisDlg').showModal();
  }
  $('historyBtn').addEventListener('click', openHistory);
  $('hisClose').addEventListener('click', function () { $('hisDlg').close(); });
  $('wipeBtn').addEventListener('click', function () {
    if (!confirm('Xóa bản nháp và toàn bộ lịch sử publish của /' + slug + ' trong trình duyệt này? Slug sẽ quay về dữ liệu mẫu.')) return;
    V.clear(slug); try { localStorage.removeItem(draftKey()); } catch (e) {}
    $('hisDlg').close(); loadAll(); log('Đã xóa dữ liệu demo của /' + slug);
  });
  $('publishBtn').addEventListener('click', openPublish);
  $('discardBtn').addEventListener('click', function () {
    if (!confirm('Bỏ mọi thay đổi trong bản nháp, quay về v' + V.load(slug).current + ' đang chạy?')) return;
    try { localStorage.removeItem(draftKey()); } catch (e) {}
    loadAll(); log('Đã bỏ thay đổi');
  });

  // ---------- thiết bị ----------
  function setDevice(d) {
    device = d;
    try { localStorage.setItem('linkbio-device', d); } catch (e) {}
    $('wrap').classList.toggle('desk', d === 'desktop');
    document.querySelectorAll('[data-dev]').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-dev') === d); });
    $('pvMobile').innerHTML = ''; $('pvDesk').innerHTML = '';
    if (d === 'desktop') fit();
    refresh();
  }

  function loadAll() { load(); bindStatic(); renderTemplates(); renderTheme(); renderSocials(); renderZones(); refresh(); }

  // ---------- events ----------
  Object.keys(SITES).forEach(function (s) {
    var o = h('option', { value: s, text: '/' + s }); if (s === slug) o.selected = true; $('slugSel').appendChild(o);
  });
  $('slugSel').addEventListener('change', function () {
    slug = this.value; history.replaceState(null, '', '?slug=' + encodeURIComponent(slug)); loadAll();
  });
  $('platform').addEventListener('change', function () { site.source = site.source || {}; site.source.platform = this.value; refresh(); });
  document.querySelectorAll('[data-p]').forEach(function (inp) {
    inp.addEventListener('input', function () { set(inp.getAttribute('data-p'), inp.value); refresh(); });
  });
  $('navCk').addEventListener('change', function () { if (this.checked) site.nav = true; else delete site.nav; refresh(); });
  document.querySelectorAll('[data-dev]').forEach(function (b) { b.addEventListener('click', function () { setDevice(b.getAttribute('data-dev')); }); });
  window.addEventListener('resize', function () { if (device === 'desktop') fit(); });
  $('addSoc').addEventListener('click', function () { site.profile.socials.push({ type: 'website', url: 'https://' }); renderSocials(); refresh(); });
  $('openBtn').addEventListener('click', function () { window.open('page.html?slug=' + encodeURIComponent(slug) + '&draft=1', '_blank'); });
  $('copyBtn').addEventListener('click', function () {
    var t = JSON.stringify(site, null, 2), b = this;
    (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { b.textContent = 'Đã copy ✓'; }, function () { b.textContent = 'Không copy được'; });
    setTimeout(function () { b.textContent = 'Copy'; }, 1500);
  });
  $('dlBtn').addEventListener('click', function () {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(site, null, 2)], { type: 'application/json' }));
    a.download = slug + '.json'; a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  });

  load(); bindStatic(); renderTemplates(); renderTheme(); renderSocials(); renderZones();
  setDevice(device);
})();
