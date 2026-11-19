/**
 * LinkStore: kho sản phẩm + bộ sưu tập. Demo lưu ở localStorage;
 * bản thật là API của dashboard (DB), build job đọc ra để sinh trang.
 */
(function () {
  'use strict';
  var KEY = 'linkbio-products-v1';
  var MAX = 20; // tối đa sản phẩm mỗi bộ sưu tập

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function normalize(db) {
    db.products = db.products || [];
    db.collections = db.collections || [];
    db.products.forEach(function (p) {
      if (!p.affiliateUrl && window.LinkMeta) {
        var a = window.LinkMeta.affiliate(p.url, p.id);
        p.affiliateUrl = a.url;
        p.network = p.network || a.network.id;
      }
      if (p.visible == null) p.visible = true;
      p.clicks = p.clicks || 0;
    });
    return db;
  }

  function load() {
    try { var s = localStorage.getItem(KEY); if (s) return normalize(JSON.parse(s)); } catch (e) {}
    return normalize(clone(window.LINK_PRODUCTS_SEED || {}));
  }
  function save(db) { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {} }
  function reset() { try { localStorage.removeItem(KEY); } catch (e) {} return load(); }

  window['LinkStore'] = { 'load': load, 'save': save, 'reset': reset, 'MAX': MAX, 'KEY': KEY };
})();
