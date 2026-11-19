/**
 * LinkMeta: nhận diện mạng affiliate, tạo affiliate URL và lấy metadata sản phẩm từ URL.
 *
 * Lấy metadata (ảnh, tên, giá):
 *   1) Gọi server metadata (tools/meta-server.js, mặc định http://localhost:8787). Server đọc
 *      og:title / og:image / product:price:amount / JSON-LD Product của trang đích.
 *      Trình duyệt không tự đọc được trang khác vì CORS, nên bản thật cần endpoint này
 *      (Lambda / n8n webhook).
 *   2) Không có server → demo giả lập metadata cho các sàn đã biết.
 *   3) Vẫn không được → reject, UI hiện popup để điền tay.
 *
 * Affiliate URL: demo gắn tham số theo từng mạng (ID giả). Bản thật nên gọi API của mạng
 * affiliate (vd. Shopee/Lazada có API tạo short link riêng cho từng publisher).
 */
(function () {
  'use strict';

  var META_ENDPOINT = window['LINK_META_ENDPOINT'] || 'http://localhost:8787/meta';

  var NETWORKS = [
    { id: 'shopee', name: 'Shopee', hosts: ['shopee.vn', 'shp.ee'], rate: 0.06, label: '3–10%', params: { 'af_id': 'LB_DEMO' } },
    { id: 'lazada', name: 'Lazada', hosts: ['lazada.vn'], rate: 0.05, label: '2–8%', params: { 'aff_id': 'LB_DEMO' } },
    { id: 'tiki', name: 'Tiki', hosts: ['tiki.vn'], rate: 0.04, label: '2–6%', params: { 'aff': 'LB_DEMO' } },
    { id: 'amazon', name: 'Amazon', hosts: ['amazon.com', 'amazon.co.uk', 'amzn.to'], rate: 0.04, label: '1–10%', params: { 'tag': 'linkbio-20' } },
    { id: 'tiktok', name: 'TikTok Shop', hosts: ['shop.tiktok.com', 'vt.tiktok.com', 'tiktok.com'], rate: 0.08, label: '5–15%', params: { 'aff': 'LB_DEMO' } },
    { id: 'shopify', name: 'Shopify', hosts: ['myshopify.com'], rate: 0.10, label: 'tùy shop', params: { 'ref': 'linkbio' } },
    { id: 'external', name: 'Link ngoài', hosts: [], rate: 0, label: '—', params: {} }
  ];

  function byId(id) { return NETWORKS.filter(function (n) { return n.id === id; })[0] || NETWORKS[NETWORKS.length - 1]; }

  function normalizeUrl(raw) {
    var s = String(raw || '').trim();
    if (!s) return null;
    if (!/^https?:\/\//i.test(s)) s = 'https://' + s;
    try { var u = new URL(s); return /\./.test(u.hostname) ? u.toString() : null; } catch (e) { return null; }
  }

  function detect(url) {
    var host = '';
    try { host = new URL(url).hostname.replace(/^www\./, ''); } catch (e) {}
    for (var i = 0; i < NETWORKS.length; i++) {
      var hs = NETWORKS[i].hosts;
      for (var j = 0; j < hs.length; j++) {
        if (host === hs[j] || host.slice(-(hs[j].length + 1)) === '.' + hs[j]) return NETWORKS[i];
      }
    }
    return byId('external');
  }

  /** Tạo affiliate URL: tham số của mạng + UTM để đối soát. */
  function affiliate(url, productId) {
    var net = detect(url);
    var u = new URL(url);
    Object.keys(net.params).forEach(function (k) { u.searchParams.set(k, net.params[k]); });
    u.searchParams.set('utm_source', 'linkbio');
    u.searchParams.set('utm_medium', 'affiliate');
    if (productId) u.searchParams.set('utm_content', productId);
    return { url: u.toString(), network: net };
  }

  function hash(s) { var h = 0; s = String(s); for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); }
  function plain(s) { return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase(); }

  var IMAGE_BY_KEYWORD = [
    [/\b(tai nghe|headphones?|earbuds?|airpods?)\b/, 'headphones'],
    [/\b(serum|kem|toner|son|chai|bottle|cream|sua rua mat)\b/, 'bottle'],
    [/\b(tui|bag|tote|balo|backpack)\b/, 'bag'],
    [/\b(den|lamp|light)\b/, 'lamp'],
    [/\b(giay|sneakers?|shoes?|dep)\b/, 'sneaker'],
    [/\b(coc|ly|mug|binh|tumbler|cup)\b/, 'mug'],
    [/\b(ao|shirt|tee|hoodie)\b/, 'tshirt'],
    [/\b(vinyl|dia|record)\b/, 'vinyl']
  ];

  /** Giả lập metadata: tên lấy từ đường dẫn, giá & ảnh sinh theo URL (ổn định giữa các lần). */
  function mockMeta(url, net) {
    var u = new URL(url);
    // Chọn đoạn path "có chữ" cuối cùng, bỏ qua id/ASIN/từ khóa như dp, products, view
    var segs = u.pathname.split('/').filter(Boolean).map(function (s) {
      try { return decodeURIComponent(s); } catch (e) { return s; }
    }).filter(function (s) {
      return !/^(dp|gp|p|product|products|view|item|i)$/i.test(s) && !/^[A-Z0-9]{6,12}$/.test(s) && !/^\d+$/.test(s);
    });
    var seg = segs.pop() || '';
    var title = seg.replace(/\.(html?|php)$/, '').replace(/-i\.?\d+(\.\d+)?$/, '').replace(/-p\d+$/, '').replace(/[-_+]+/g, ' ').replace(/\b(p|dp|product|products)\b/gi, '').replace(/\s+/g, ' ').trim();
    if (!title || /^\d+$/.test(title)) title = 'Sản phẩm từ ' + u.hostname.replace(/^www\./, '');
    title = title.charAt(0).toUpperCase() + title.slice(1);
    var h = hash(url), key = plain(' ' + title + ' '), img = '';
    for (var i = 0; i < IMAGE_BY_KEYWORD.length; i++) if (IMAGE_BY_KEYWORD[i][0].test(key)) { img = 'data/img/' + IMAGE_BY_KEYWORD[i][1] + '.svg'; break; }
    var usd = net.id === 'amazon' || net.id === 'shopify';
    return {
      title: title,
      image: img,
      price: usd ? (h % 40 + 9) + 0.99 : ((h % 90) + 10) * 10000 - 1000,
      currency: usd ? 'USD' : 'VND',
      source: 'mock'
    };
  }

  function fromServer(url) {
    var ctrl = typeof AbortController === 'function' ? new AbortController() : null;
    var t = setTimeout(function () { if (ctrl) ctrl.abort(); }, 6000);
    return fetch(META_ENDPOINT + '?url=' + encodeURIComponent(url), ctrl ? { signal: ctrl.signal } : {})
      .then(function (r) { clearTimeout(t); if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (j) { if (!j || !j.title) throw new Error('no-meta'); j.source = 'server'; return j; });
  }

  /**
   * Lấy metadata. Resolve {title, image, price, currency, source} hoặc reject (→ điền tay).
   * URL chứa "fail" luôn reject để thử luồng popup.
   */
  function fetchMeta(url) {
    var net = detect(url);
    return fromServer(url).catch(function () {
      return new Promise(function (resolve, reject) {
        setTimeout(function () {
          if (net.id === 'external' || /fail/i.test(url)) reject(new Error('Không đọc được metadata'));
          else resolve(mockMeta(url, net));
        }, 650);
      });
    });
  }

  window['LinkMeta'] = {
    'NETWORKS': NETWORKS, 'network': byId, 'detect': detect, 'affiliate': affiliate,
    'normalizeUrl': normalizeUrl, 'fetchMeta': fetchMeta
  };
})();
