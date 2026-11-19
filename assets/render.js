/**
 * Bộ component + BlockRenderer cho landing page.
 * Design system: Sora · Lunar Shadow #282828 · Clean White #FFFFFF · Gray Whisper #F7F7F7
 *                Gentle Olive #CBD77E · Winter Hazel #E6CA9A
 * Viết bằng vanilla JS, truy cập dữ liệu JSON bằng chuỗi (block["text"])
 * để sau này compile được bằng Google Closure Compiler ADVANCED mode.
 */
(function () {
  'use strict';

  /* Icon dạng nét (stroke = currentColor), viewBox 24. */
  var ICONS = {
    'instagram': '<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="3.8"/><circle cx="17" cy="7" r="1" fill="currentColor" stroke="none"/>',
    'tiktok': '<path d="M14 3.5v11a3.5 3.5 0 1 1-3.5-3.5"/><path d="M14 3.5c.5 2.6 2.4 4.4 5 4.6"/>',
    'facebook': '<circle cx="12" cy="12" r="8.5"/><path d="M14.8 8.2h-1.3a2.3 2.3 0 0 0-2.3 2.3v10M8.8 13h5.6"/>',
    'twitter': '<path d="M4.5 4.5l15 15M19.5 4.5l-15 15"/>',
    'youtube': '<rect x="3" y="5.5" width="18" height="13" rx="4"/><path d="M10.3 9.4v5.2l4.4-2.6z" fill="currentColor"/>',
    'website': '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.4 2.6 3.6 5.4 3.6 8.5s-1.2 5.9-3.6 8.5c-2.4-2.6-3.6-5.4-3.6-8.5S9.6 6.1 12 3.5z"/>',
    'zalo': '<path d="M4.5 5.5h15v10.5h-9l-6 4z"/>',
    'spotify': '<circle cx="12" cy="12" r="8.5"/><path d="M7.5 9.5c3-1 6.5-.7 9 .8M8 12.5c2.5-.7 5.2-.4 7.3.8M8.6 15.3c2-.5 4-.3 5.6.6"/>',
    'home': '<path d="M4.5 10.5 12 4.5l7.5 6V19a1 1 0 0 1-1 1h-4v-5h-5v5h-4a1 1 0 0 1-1-1z"/>',
    'play': '<rect x="3.5" y="5.5" width="17" height="13" rx="4"/><path d="M10.5 9.6v4.8l4-2.4z" fill="currentColor"/>',
    'music': '<path d="M9 17.5V6l10-2v11.5"/><circle cx="6.5" cy="17.5" r="2.5"/><circle cx="16.5" cy="15.5" r="2.5"/>',
    'disc': '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="2.5"/>',
    'ticket': '<path d="M4 8.5a2 2 0 0 0 2-2h12a2 2 0 0 0 2 2v1.5a2 2 0 0 0 0 4v1.5a2 2 0 0 0-2 2H6a2 2 0 0 0-2-2V14a2 2 0 0 0 0-4z"/><path d="M14.5 7v10" stroke-dasharray="1.5 2"/>',
    'bag': '<path d="M5.5 8h13l-1 12h-11z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>',
    'mail': '<rect x="3.5" y="5.5" width="17" height="13" rx="3"/><path d="m4.5 7.5 7.5 5.5 7.5-5.5"/>',
    'star': '<path d="m12 4.5 2.3 4.8 5.2.6-3.9 3.6 1.1 5.2L12 16.1l-4.7 2.6 1.1-5.2-3.9-3.6 5.2-.6z"/>',
    'link': '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    'tag': '<path d="M4 12.5V4.5h8l8 8-8 8z"/><circle cx="8.3" cy="8.8" r="1.4"/>',
    'bolt': '<path d="M13 3.5 5.5 13.5h6l-1 7 7.5-10h-6z"/>',
    'grid': '<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M9 8.5v0M12 8.5v0M15 8.5v0M9 12v0M12 12v0M15 12v0M9 15.5v0M12 15.5v0M15 15.5v0" stroke-width="2.2"/>',
    'arrow-ur': '<path d="M7.5 16.5l9-9M9 7.5h7.5V15"/>',
    'arrow-l': '<path d="M19 12H5.5M11 6.5 5.5 12l5.5 5.5"/>',
    'arrow-r': '<path d="M5 12h13.5M13 6.5l5.5 5.5-5.5 5.5"/>',
    'triangle': '<path d="M9 6.5v11l9-5.5z" fill="currentColor" stroke-linejoin="round"/>'
  };
  var TYPE_ICON = {
    'hero-video': 'play', 'carousel': 'music', 'card': 'star', 'link': 'link', 'banner': 'tag',
    'release': 'disc', 'video': 'play', 'events': 'ticket', 'products': 'bag', 'subscribe': 'mail', 'shop': 'bag'
  };
  var MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  var LAYOUTS = ['center', 'split', 'grid'];
  var WIDE_BY_DEFAULT = {
    'hero-video': 1, 'carousel': 1, 'banner': 1, 'link': 1,
    'release': 1, 'video': 1, 'events': 1, 'products': 1, 'subscribe': 1, 'shop': 1
  };
  /* Font được phép tải từ Google Fonts (theme["font"]) */
  var WEB_FONTS = { 'Sora': 1, 'Manrope': 1, 'Inter': 1, 'DM Sans': 1, 'Be Vietnam Pro': 1 };

  /** @return {!Element} */
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null && text !== '') n.textContent = text;
    return n;
  }

  function icon(name, cls) {
    var s = el('span', 'lb-ic' + (cls ? ' ' + cls : ''));
    s.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || ICONS['link']) + '</svg>';
    return s;
  }

  /** Nút tròn có icon (vd. mũi tên ↗ ở cuối card). */
  function roundIcon(name, cls) {
    var s = el('span', 'lb-round ' + (cls || ''));
    s.appendChild(icon(name));
    return s;
  }

  function hash(s) {
    var h = 0; s = String(s || '');
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return Math.abs(h);
  }

  function cssUrl(url) { return 'url("' + String(url).replace(/"/g, '') + '")'; }

  function bgImage(node, url) {
    node.style.backgroundImage = cssUrl(url);
    node.style.backgroundSize = 'cover';
    node.style.backgroundPosition = 'center';
  }

  /* Placeholder: gradient mờ olive/hazel (giống mark của brand), biến thể theo id. */
  var BLOBS = [
    'radial-gradient(circle at 28% 22%,#E6CA9A 0,transparent 58%),radial-gradient(circle at 78% 82%,#B9CB5C 0,transparent 55%),#DCE5AE',
    'radial-gradient(circle at 75% 20%,#E6CA9A 0,transparent 55%),radial-gradient(circle at 20% 85%,#CBD77E 0,transparent 60%),#EEF0E2',
    'radial-gradient(circle at 30% 75%,#E6CA9A 0,transparent 60%),radial-gradient(circle at 80% 25%,#CBD77E 0,transparent 55%),#E9EBDD',
    'radial-gradient(circle at 50% 15%,#F1E2C4 0,transparent 60%),radial-gradient(circle at 60% 90%,#CBD77E 0,transparent 55%),#DDE3BF'
  ];
  function blob(seed) { return BLOBS[hash(seed) % BLOBS.length]; }

  /** Ảnh thumbnail; nếu chưa có URL thì dùng gradient blob. */
  function thumb(cls, url, seed, iconName) {
    var d = el('div', cls);
    if (url) {
      bgImage(d, url);
    } else {
      d.style.background = blob(seed);
      if (iconName) d.appendChild(icon(iconName, 'lb-ph-ic'));
    }
    return d;
  }

  /** Artwork đặt giữa nền màu (contain), như bìa release / video. */
  function art(cls, url, bg, seed) {
    var d = el('div', cls);
    if (!url && !bg) { d.style.background = blob(seed); return d; }
    d.style.backgroundColor = bg || '#E9EBDD';
    if (url) d.style.backgroundImage = cssUrl(url);
    return d;
  }

  function luminance(hex) {
    var m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
    if (!m) return 0;
    var n = parseInt(m[1], 16);
    return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  }

  function ensureFont(name) {
    if (!name || !WEB_FONTS[name]) return;
    var id = 'lb-font-' + name.replace(/\s+/g, '-');
    if (document.getElementById(id)) return;
    var l = document.createElement('link');
    l.id = id; l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=' + name.replace(/\s+/g, '+') + ':wght@300;400;500;600;700&display=swap';
    document.head.appendChild(l);
  }

  /** Quy tắc xếp: pinned → viral score → mới nhất → thứ tự gốc. */
  function sortBlocks(blocks) {
    return blocks.map(function (b, i) { return { b: b, i: i }; }).sort(function (x, y) {
      var px = x.b['pinned'] ? 1 : 0, py = y.b['pinned'] ? 1 : 0;
      if (px !== py) return py - px;
      var sx = typeof x.b['score'] === 'number' ? x.b['score'] : -1;
      var sy = typeof y.b['score'] === 'number' ? y.b['score'] : -1;
      if (sx !== sy) return sy - sx;
      var dx = Date.parse(x.b['publishedAt'] || '') || 0;
      var dy = Date.parse(y.b['publishedAt'] || '') || 0;
      if (dx !== dy) return dy - dx;
      return x.i - y.i;
    }).map(function (o) { return o.b; });
  }

  // ---------- Template + vùng (header / hero / main / footer) ----------
  var REGIONS = ['hero', 'main', 'footer']; // header luôn là ProfileHeader

  function templateOf(site) {
    var T = window['LINK_TEMPLATES'] || {};
    return T[site['template']] || T['classic'] || { 'regions': {} };
  }

  /** Theme = themeDefaults của template + phần slug ghi đè. */
  function themeOf(site) {
    var out = {}, d = templateOf(site)['themeDefaults'] || {}, o = site['theme'] || {}, k;
    for (k in d) out[k] = d[k];
    for (k in o) if (o[k] !== '' && o[k] != null) out[k] = o[k];
    return out;
  }

  /** layout của slug; JSON kiểu cũ (chưa có vùng) thì dồn hết block vào main. */
  function layoutOf(site) {
    var L = site['layout'] || {};
    if (L['hero'] || L['main'] || L['footer']) return L;
    return { 'hero': { 'blocks': [] }, 'main': { 'blocks': (site['blocks'] || []).map(function (b) { return b['id']; }) }, 'footer': { 'blocks': [] } };
  }

  function variantOf(site, name) {
    var spec = templateOf(site)['regions'][name] || {};
    var v = (layoutOf(site)[name] || {})['variant'];
    var vs = spec['variants'] || ['list'];
    return vs.indexOf(v) >= 0 ? v : (spec['defaultVariant'] || vs[0]);
  }

  /** Vùng có tự xếp theo viral không: slug ghi đè → manifest → mặc định chỉ main. */
  function rankOf(site, name) {
    var r = (layoutOf(site)[name] || {})['rank'];
    if (r != null) return !!r;
    var spec = templateOf(site)['regions'][name] || {};
    return spec['rank'] != null ? !!spec['rank'] : name === 'main';
  }

  /** Block của 1 vùng: lọc theo allow, bỏ block ẩn, xếp hạng trong vùng, cắt theo max. */
  function regionBlocks(site, name, ctx) {
    var spec = templateOf(site)['regions'][name] || {};
    var byId = {};
    (site['blocks'] || []).forEach(function (b) { byId[b['id']] = b; });
    var list = ((layoutOf(site)[name] || {})['blocks'] || []).map(function (id) { return byId[id]; })
      .filter(function (b) { return b && !b['hidden'] && (!spec['allow'] || spec['allow'].indexOf(b['type']) >= 0); });
    var rank = ctx && ctx['sort'] != null ? ctx['sort'] : rankOf(site, name);
    if (rank) list = sortBlocks(list);
    if (spec['max']) list = list.slice(0, spec['max']);
    return list;
  }

  /** Thứ tự hiển thị toàn trang (hero → main → footer). */
  function orderedBlocks(site, ctx) {
    return REGIONS.reduce(function (acc, r) { return acc.concat(regionBlocks(site, r, ctx)); }, []);
  }

  function isWide(b) {
    if (b['size'] === 'wide') return true;
    if (b['size'] === 'normal') return false;
    return !!WIDE_BY_DEFAULT[b['type']];
  }

  function emit(ctx, blockId, pos, url) {
    var payload = { 'slug': ctx['slug'], 'blockId': blockId, 'position': pos, 'url': url, 'ts': Date.now() };
    if (typeof window['gtag'] === 'function') window['gtag']('event', 'block_click', payload);
    if (ctx['beaconUrl'] && navigator.sendBeacon) navigator.sendBeacon(ctx['beaconUrl'], JSON.stringify(payload));
    if (ctx['onTrack']) ctx['onTrack'](payload);
  }

  /** Thẻ <a> có tracking click: GA4 nếu có, sendBeacon nếu cấu hình, callback cho demo. */
  function link(cls, url, ctx, blockId, pos) {
    var a = el('a', cls);
    a.href = url || '#';
    a.target = '_blank';
    a.rel = 'noopener';
    a.draggable = false;
    a.addEventListener('click', function (e) {
      emit(ctx, blockId, pos, url);
      if (ctx['preventNav']) e.preventDefault();
    });
    return a;
  }

  /** Card section: tiêu đề + "View all ↗" (nếu có). */
  function section(b, ctx, pos, extraCls) {
    var wrap = el('section', 'lb-block lb-section ' + (extraCls || ''));
    if (b['title'] || b['viewAll']) {
      var head = el('div', 'lb-sec-h');
      head.appendChild(el('h2', 'lb-sec-title', b['title']));
      if (b['viewAll']) {
        var va = link('lb-viewall', b['viewAll'], ctx, b['id'] + '-viewall', pos);
        va.appendChild(el('span', 'lb-va-t', 'View all'));
        va.appendChild(roundIcon('arrow-ur', 'lb-round-sm'));
        head.appendChild(va);
      }
      wrap.appendChild(head);
    }
    return wrap;
  }

  // ---------- Components ----------

  function ProfileHeader(profile, ctx) {
    var hasCover = !!profile['cover'];
    var wrap = el('header', 'lb-profile' + (hasCover ? ' lb-has-cover' : ''));
    if (hasCover) {
      var c = el('div', 'lb-pcover');
      bgImage(c, profile['cover']);
      wrap.appendChild(c);
    }
    var av;
    if (profile['avatar']) {
      av = el('img', 'lb-avatar'); av.src = profile['avatar']; av.alt = '';
    } else {
      av = el('div', 'lb-avatar lb-avatar-blob', (profile['title'] || '?').charAt(0).toUpperCase());
    }
    wrap.appendChild(av);
    var info = el('div', 'lb-pinfo');
    info.appendChild(el('h1', 'lb-title', profile['title']));
    if (profile['subtitle']) info.appendChild(el('p', 'lb-subtitle', profile['subtitle']));
    if (profile['about']) info.appendChild(el('p', 'lb-about', profile['about']));
    var socials = profile['socials'] || [];
    if (socials.length) {
      var row = el('div', 'lb-socials');
      socials.forEach(function (s, i) {
        var a = link('lb-social', s['url'], ctx, 'social-' + s['type'], i);
        a.appendChild(icon(ICONS[s['type']] ? s['type'] : 'website'));
        a.title = s['type'];
        a.setAttribute('aria-label', s['type']);
        row.appendChild(a);
      });
      info.appendChild(row);
    }
    wrap.appendChild(info);
    return wrap;
  }

  /** Dock tối nổi ở đáy: nút tròn nhảy tới profile và từng section có tiêu đề. */
  function Dock(blocks, root) {
    var tabs = blocks.filter(function (b) { return !b['hidden'] && (b['title'] || b['navLabel']); });
    if (tabs.length < 2) return null;
    var nav = el('nav', 'lb-dock');
    var items = [{ id: '', label: 'Home', ic: 'home' }].concat(tabs.map(function (b) {
      return { id: b['id'], label: b['navLabel'] || b['title'], ic: TYPE_ICON[b['type']] || 'star' };
    }));
    items.forEach(function (it, i) {
      var a = el('a', 'lb-dock-i' + (i === 0 ? ' on' : ''));
      a.href = '#' + it.id;
      a.title = it.label;
      a.draggable = false;
      a.appendChild(icon(it.ic));
      a.appendChild(el('span', 'lb-dock-t', it.label));
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var t = it.id ? root.querySelector('[data-block-id="' + it.id + '"]') : root.querySelector('.lb-profile');
        if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
        Array.prototype.forEach.call(nav.children, function (n) { n.classList.remove('on'); });
        a.classList.add('on');
      });
      nav.appendChild(a);
    });
    return nav;
  }

  function HeroVideo(b, ctx, pos) {
    var a = link('lb-block lb-card-shell lb-hero', b['url'], ctx, b['id'], pos);
    var t = thumb('lb-hero-media', b['thumbnail'], b['id'] + 'hero');
    t.appendChild(roundIcon('triangle', 'lb-play'));
    if (b['badge']) t.appendChild(el('span', 'lb-chip lb-badge', b['badge']));
    a.appendChild(t);
    if (b['text']) {
      var foot = el('div', 'lb-hero-foot');
      foot.appendChild(el('div', 'lb-hero-text', b['text']));
      foot.appendChild(roundIcon('arrow-ur'));
      a.appendChild(foot);
    }
    return a;
  }

  function Carousel(b, ctx, pos) {
    var wrap = section(b, ctx, pos, 'lb-carousel');
    var track = el('div', 'lb-car-track');
    (b['items'] || []).forEach(function (it, i) {
      var a = link('lb-car-item', it['url'], ctx, it['id'] || (b['id'] + '-' + i), pos + '.' + i);
      var m = el('div', 'lb-car-media');
      if (it['thumbnail']) m.style.backgroundImage = cssUrl(it['thumbnail']);
      else { m.style.background = blob(it['id'] || it['text']); m.appendChild(icon('music', 'lb-ph-ic')); }
      a.appendChild(m);
      a.appendChild(el('div', 'lb-car-text', it['text']));
      track.appendChild(a);
    });
    wrap.appendChild(track);
    return wrap;
  }

  /** Card dạng hàng: icon/ảnh tròn + tiêu đề + số liệu chữ mảnh hoặc nút ↗. */
  function Card(b, ctx, pos) {
    var a = link('lb-block lb-card-shell lb-card', b['url'], ctx, b['id'], pos);
    if (b['thumbnail']) a.appendChild(thumb('lb-card-media', b['thumbnail'], b['id']));
    else { var ic = el('div', 'lb-card-media lb-card-ic'); ic.appendChild(icon('star')); a.appendChild(ic); }
    var body = el('div', 'lb-card-body');
    var title = el('div', 'lb-card-title', b['text']);
    if (typeof b['score'] === 'number' && b['score'] >= 80) title.appendChild(el('span', 'lb-hot', 'Hot'));
    body.appendChild(title);
    if (b['subtext']) body.appendChild(el('div', 'lb-card-sub', b['subtext']));
    a.appendChild(body);
    if (b['metric']) {
      var m = el('div', 'lb-metric', b['metric']);
      if (b['unit']) m.appendChild(el('small', '', b['unit']));
      a.appendChild(m);
    } else {
      a.appendChild(roundIcon('arrow-ur'));
    }
    return a;
  }

  /** Link: pill trắng; "primary" = pill sọc tối nổi bật. */
  function LinkButton(b, ctx, pos) {
    var a = link('lb-block lb-link' + (b['primary'] ? ' lb-link-primary' : ''), b['url'], ctx, b['id'], pos);
    if (b['primary']) a.appendChild(roundIcon(b['icon'] || 'bolt', 'lb-round-olive'));
    a.appendChild(el('span', 'lb-link-t', b['text'] || b['url']));
    a.appendChild(roundIcon('arrow-ur', b['primary'] ? 'lb-round-white' : ''));
    return a;
  }

  function Banner(b, ctx, pos) {
    var a = link('lb-block lb-banner', b['url'], ctx, b['id'], pos);
    var t = el('div', 'lb-banner-body');
    t.appendChild(el('div', 'lb-banner-title', b['text']));
    if (b['subtext']) t.appendChild(el('div', 'lb-banner-sub', b['subtext']));
    a.appendChild(t);
    a.appendChild(roundIcon('arrow-ur', 'lb-round-white'));
    return a;
  }

  /** Release: bìa lớn trên nền màu + nút CTA trắng. */
  function Release(b, ctx, pos) {
    var wrap = section(b, ctx, pos, 'lb-release');
    var a = link('lb-rel-card', b['url'], ctx, b['id'], pos);
    a.appendChild(art('lb-rel-art', b['thumbnail'], b['bg'], b['id']));
    var cta = el('span', 'lb-rel-cta');
    cta.appendChild(icon('triangle'));
    cta.appendChild(document.createTextNode(b['cta'] || 'Listen now'));
    a.appendChild(cta);
    wrap.appendChild(a);
    if (b['text']) wrap.appendChild(el('div', 'lb-rel-name', b['text']));
    return wrap;
  }

  /** Video slider: 1 video/khung, nút ← → tròn. */
  function VideoSlider(b, ctx, pos) {
    var wrap = section(b, ctx, pos, 'lb-video');
    var box = el('div', 'lb-vid-box');
    var track = el('div', 'lb-vid-track');
    var items = b['items'] || [];
    items.forEach(function (it, i) {
      var a = link('lb-vid-item', it['url'], ctx, it['id'] || (b['id'] + '-' + i), pos + '.' + i);
      var m = art('lb-vid-art', it['thumbnail'], it['bg'], it['id'] || i);
      m.appendChild(roundIcon('triangle', 'lb-play'));
      a.appendChild(m);
      if (it['text']) a.appendChild(el('span', 'lb-chip lb-vid-cap', it['text']));
      track.appendChild(a);
    });
    box.appendChild(track);
    if (items.length > 1) {
      var go = function (dir) { return function (e) { e.preventDefault(); track.scrollBy({ left: dir * track.clientWidth, behavior: 'smooth' }); }; };
      var prev = el('button', 'lb-vid-nav lb-prev'); prev.type = 'button'; prev.setAttribute('aria-label', 'Trước'); prev.appendChild(icon('arrow-l')); prev.addEventListener('click', go(-1));
      var next = el('button', 'lb-vid-nav lb-next'); next.type = 'button'; next.setAttribute('aria-label', 'Sau'); next.appendChild(icon('arrow-r')); next.addEventListener('click', go(1));
      box.appendChild(prev); box.appendChild(next);
    }
    wrap.appendChild(box);
    return wrap;
  }

  /** Lịch sự kiện: ô ngày tròn + địa điểm + pill Tickets. */
  function Events(b, ctx, pos) {
    var wrap = section(b, ctx, pos, 'lb-events');
    var list = el('div', 'lb-ev-list');
    (b['items'] || []).forEach(function (it, i) {
      var row = link('lb-ev', it['url'], ctx, it['id'] || (b['id'] + '-' + i), pos + '.' + i);
      var d = new Date(it['date'] || '');
      var date = el('div', 'lb-ev-date');
      date.appendChild(el('span', 'lb-ev-d', isNaN(d) ? '--' : String(d.getUTCDate())));
      date.appendChild(el('span', 'lb-ev-m', isNaN(d) ? '---' : MONTHS[d.getUTCMonth()]));
      row.appendChild(date);
      var info = el('div', 'lb-ev-info');
      info.appendChild(el('div', 'lb-ev-venue', it['venue']));
      info.appendChild(el('div', 'lb-ev-city', it['city']));
      row.appendChild(info);
      row.appendChild(el('span', 'lb-ev-btn', it['cta'] || 'Tickets'));
      list.appendChild(row);
    });
    wrap.appendChild(list);
    return wrap;
  }

  /** Sản phẩm: ô ảnh nền xám + tên + giá chữ mảnh. */
  function Products(b, ctx, pos) {
    var wrap = section(b, ctx, pos, 'lb-products');
    var grid = el('div', 'lb-pr-grid');
    (b['items'] || []).forEach(function (it, i) {
      var a = link('lb-pr', it['url'], ctx, it['id'] || (b['id'] + '-' + i), pos + '.' + i);
      var m = el('div', 'lb-pr-img');
      if (it['thumbnail']) m.style.backgroundImage = cssUrl(it['thumbnail']);
      else m.appendChild(icon('bag', 'lb-ph-ic'));
      m.appendChild(roundIcon('arrow-ur', 'lb-round-sm lb-pr-go'));
      a.appendChild(m);
      a.appendChild(el('div', 'lb-pr-name', it['text']));
      if (it['price']) a.appendChild(el('div', 'lb-pr-price', it['price']));
      grid.appendChild(a);
    });
    wrap.appendChild(grid);
    return wrap;
  }

  /** Form đăng ký email. Bản thật: POST tới webhook (n8n) — demo chỉ báo đã nhận. */
  function Subscribe(b, ctx, pos) {
    var wrap = section(b, ctx, pos, 'lb-subscribe');
    if (b['text']) wrap.appendChild(el('p', 'lb-sub-text', b['text']));
    var form = el('form', 'lb-sub-form');
    var inp = el('input', 'lb-sub-input');
    inp.type = 'email'; inp.required = true;
    inp.placeholder = b['placeholder'] || 'name@email.com';
    inp.setAttribute('aria-label', 'Email');
    var btn = el('button', 'lb-sub-btn', b['cta'] || 'Subscribe');
    btn.type = 'submit';
    form.appendChild(inp); form.appendChild(btn);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      emit(ctx, b['id'], pos, 'subscribe');
      var ok = el('div', 'lb-sub-ok');
      ok.appendChild(roundIcon('bolt', 'lb-round-olive'));
      ok.appendChild(el('span', '', 'Đã đăng ký: ' + inp.value));
      form.replaceWith(ok);
    });
    wrap.appendChild(form);
    return wrap;
  }

  function formatPrice(price, currency) {
    if (price == null || price === '') return '';
    var n = Number(price);
    if (isNaN(n)) return String(price);
    if (currency === 'USD') return '$' + n.toFixed(2);
    return n.toLocaleString('vi-VN') + '₫';
  }

  /**
   * Shop: sản phẩm affiliate theo bộ sưu tập (mỗi bộ sưu tập = 1 tab).
   * Dữ liệu lấy từ ctx["products"] hoặc LinkStore (kho sản phẩm dùng chung).
   * Bản thật: build job ghi sẵn danh sách sản phẩm vào JSON của slug.
   */
  function Shop(b, ctx, pos) {
    var wrap = section(b, ctx, pos, 'lb-shop');
    var store = window['LinkStore'];
    var db = ctx['products'] || (store ? store['load']() : null);
    if (!db) return wrap;
    var all = db['collections'] || [];
    var cols = (b['collections'] || []).map(function (id) {
      return all.filter(function (c) { return c['id'] === id; })[0];
    }).filter(Boolean);
    if (!cols.length && all.length) cols = [all[0]];
    var byId = {};
    (db['products'] || []).forEach(function (p) { byId[p['id']] = p; });
    var limit = b['limit'] || 6;

    var tabs = el('div', 'lb-shop-tabs');
    var count = el('div', 'lb-shop-count');
    var grid = el('div', 'lb-pr-grid');
    function show(i) {
      Array.prototype.forEach.call(tabs.children, function (t, k) { t.classList.toggle('on', k === i); });
      grid.innerHTML = '';
      var items = (cols[i]['items'] || []).map(function (id) { return byId[id]; })
        .filter(function (p) { return p && p['visible'] !== false; });
      count.textContent = items.length + ' sản phẩm';
      items.slice(0, limit).forEach(function (p, k) {
        var a = link('lb-pr', p['affiliateUrl'] || p['url'], ctx, p['id'], pos + '.' + k);
        var m = el('div', 'lb-pr-img');
        if (p['image']) m.style.backgroundImage = cssUrl(p['image']);
        else m.appendChild(icon('bag', 'lb-ph-ic'));
        m.appendChild(roundIcon('arrow-ur', 'lb-round-sm lb-pr-go'));
        a.appendChild(m);
        a.appendChild(el('div', 'lb-pr-name', p['title']));
        a.appendChild(el('div', 'lb-pr-price', formatPrice(p['price'], p['currency'])));
        grid.appendChild(a);
      });
      if (!items.length) grid.appendChild(el('div', 'lb-shop-empty', 'Chưa có sản phẩm'));
    }
    if (cols.length > 1) {
      cols.forEach(function (c, i) {
        var t = el('button', 'lb-shop-tab', c['name']);
        t.type = 'button';
        t.addEventListener('click', function () { show(i); });
        tabs.appendChild(t);
      });
      wrap.appendChild(tabs);
    }
    if (cols.length) { wrap.appendChild(count); wrap.appendChild(grid); show(0); }
    return wrap;
  }

  var COMPONENTS = {
    'shop': Shop,
    'hero-video': HeroVideo,
    'carousel': Carousel,
    'card': Card,
    'link': LinkButton,
    'banner': Banner,
    'release': Release,
    'video': VideoSlider,
    'events': Events,
    'products': Products,
    'subscribe': Subscribe
  };

  /** Chọn component theo type. Type lạ thì bỏ qua, không làm vỡ trang. */
  function BlockRenderer(b, ctx, pos) {
    var C = COMPONENTS[b['type']];
    if (!C || b['hidden']) return null;
    var node = C(b, ctx, pos);
    node.setAttribute('data-block-id', b['id'] || '');
    if (isWide(b)) node.classList.add('lb-wide');
    return node;
  }

  /**
   * Render cả trang vào root.
   * ctx: { sort (true/false: ép bật/tắt xếp hạng mọi vùng), preventNav, onTrack, beaconUrl, highlight, showEmpty }
   */
  function render(site, root, ctx) {
    ctx = ctx || {};
    ctx['slug'] = site['slug'];
    var tpl = templateOf(site);
    var theme = themeOf(site);
    var profile = site['profile'] || {};
    var desk = LAYOUTS.indexOf(tpl['desktop']) >= 0 ? tpl['desktop'] : 'center';
    var bg = theme['bg'] || '#F7F7F7';
    var lum = luminance(bg);
    var radius = Number(theme['radius']) || 28;

    ensureFont(theme['font'] || 'Sora');
    root.classList.add('lb-root');
    root.classList.toggle('lb-dark', lum < 0.5);
    root.classList.toggle('lb-white', lum > 0.985);
    root.classList.toggle('lb-btn-rounded', theme['button'] === 'rounded');
    LAYOUTS.forEach(function (l) { root.classList.remove('lb-d-' + l); });
    root.classList.add('lb-d-' + desk);
    root.setAttribute('data-template', tpl['id'] || 'classic');
    root.style.setProperty('--lb-bg', bg);
    root.style.setProperty('--lb-accent', theme['accent'] || '#CBD77E');
    root.style.setProperty('--lb-r', radius + 'px');
    root.style.setProperty('--lb-r-in', Math.round(radius * 0.72) + 'px');
    root.style.setProperty('--lb-cols', String(tpl['desktopColumns'] || 2));
    root.style.setProperty('--lb-font', '"' + (theme['font'] || 'Sora') + '",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif');
    root.innerHTML = '';

    var cover = el('div', 'lb-cover');
    if (profile['cover']) bgImage(cover, profile['cover']);
    root.appendChild(cover);

    var page = el('div', 'lb-page');
    page.appendChild(ProfileHeader(profile, ctx)); // vùng header
    var list = el('div', 'lb-blocks');
    var pos = 0;
    REGIONS.forEach(function (name) {
      var blocks = regionBlocks(site, name, ctx);
      var variant = name === 'main' ? variantOf(site, name) : 'list';
      var reg = el('div', 'lb-region lb-r-' + name + ' lb-v-' + variant);
      reg.setAttribute('data-region', name);
      var track = null;
      blocks.forEach(function (b) {
        var node = BlockRenderer(b, ctx, pos++);
        if (!node) return;
        if (ctx['highlight'] && ctx['highlight'] === b['id']) node.classList.add('lb-flash');
        // carousel: block nhỏ liền nhau gom vào 1 hàng vuốt ngang, block rộng nằm riêng
        if (variant === 'carousel' && !isWide(b)) {
          if (!track) { track = el('div', 'lb-track'); reg.appendChild(track); }
          track.appendChild(node);
        } else { track = null; reg.appendChild(node); }
      });
      if (!blocks.length && ctx['showEmpty']) {
        reg.classList.add('lb-region-empty');
        reg.appendChild(el('div', 'lb-empty-hint', (tpl['regions'][name] || {})['label'] || name));
      }
      if (blocks.length || ctx['showEmpty']) list.appendChild(reg);
    });
    page.appendChild(list);
    if (site['nav']) {
      var dock = Dock(orderedBlocks(site, ctx), root);
      if (dock) page.appendChild(dock);
    }
    page.appendChild(el('footer', 'lb-foot', 'Smart Link-in-Bio · demo'));
    root.appendChild(page);
  }

  window['LinkBio'] = {
    'render': render,
    'sortBlocks': sortBlocks,
    'orderedBlocks': orderedBlocks,
    'isWide': isWide,
    'formatPrice': formatPrice,
    'templateOf': templateOf,
    'themeOf': themeOf,
    'layoutOf': layoutOf,
    'variantOf': variantOf,
    'rankOf': rankOf,
    'regionBlocks': regionBlocks,
    'REGIONS': REGIONS
  };
})();
