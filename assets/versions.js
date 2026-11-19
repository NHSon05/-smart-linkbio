/**
 * LinkVersions: Draft → Publish, lịch sử phiên bản và rollback (plan mục 9).
 * Demo lưu ở localStorage. Bản thật: bảng versions trong DB + webhook build lại slug.
 *  - Mỗi lần Publish lưu 1 bản JSON đầy đủ, kèm ai publish, lúc nào, ghi chú, tóm tắt thay đổi.
 *  - Rollback = publish lại nội dung của bản cũ thành 1 phiên bản mới (lịch sử không bị xóa).
 */
(function () {
  'use strict';
  var PREFIX = 'linkbio-pub-v1-';
  var KEEP = 30;
  var AUTHOR = 'Bạn (demo)';

  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function strip(o) { var c = clone(o || {}); delete c.updatedAt; return c; }
  function same(a, b) { return JSON.stringify(strip(a)) === JSON.stringify(strip(b)); }

  function load(slug) {
    var st = null;
    try { st = JSON.parse(localStorage.getItem(PREFIX + slug) || 'null'); } catch (e) {}
    if (!st || !st.versions || !st.versions.length) {
      var seed = (window.LINK_SITES || {})[slug];
      st = { current: 1, versions: seed ? [{ v: 1, at: seed.updatedAt || new Date().toISOString(), by: 'Hệ thống', note: 'Bản đầu (dữ liệu mẫu)', changes: [], json: clone(seed) }] : [] };
    }
    return st;
  }
  function saveState(slug, st) {
    st.versions = st.versions.slice(-KEEP);
    try { localStorage.setItem(PREFIX + slug, JSON.stringify(st)); } catch (e) {}
  }
  function get(slug, v) { return load(slug).versions.filter(function (x) { return x.v === Number(v); })[0] || null; }
  function current(slug) { var st = load(slug), c = get(slug, st.current); return c ? clone(c.json) : null; }

  /** Tóm tắt thay đổi giữa 2 bản JSON (để ghi log "ai sửa gì"). */
  function diff(a, b) {
    a = a || {}; b = b || {};
    var out = [];
    if (a.template !== b.template) out.push('Template: ' + (a.template || '—') + ' → ' + b.template);
    if (JSON.stringify(a.theme || {}) !== JSON.stringify(b.theme || {})) out.push('Theme ghi đè thay đổi');
    if (JSON.stringify(a.profile || {}) !== JSON.stringify(b.profile || {})) out.push('Profile thay đổi');
    if (!!a.nav !== !!b.nav) out.push(b.nav ? 'Bật dock điều hướng' : 'Tắt dock điều hướng');
    var ab = {}, bb = {};
    (a.blocks || []).forEach(function (x) { ab[x.id] = x; });
    (b.blocks || []).forEach(function (x) { bb[x.id] = x; });
    var added = Object.keys(bb).filter(function (k) { return !ab[k]; });
    var removed = Object.keys(ab).filter(function (k) { return !bb[k]; });
    var edited = Object.keys(bb).filter(function (k) { return ab[k] && JSON.stringify(ab[k]) !== JSON.stringify(bb[k]); });
    if (added.length) out.push('Thêm block: ' + added.join(', '));
    if (removed.length) out.push('Xóa block: ' + removed.join(', '));
    if (edited.length) out.push('Sửa block: ' + edited.join(', '));
    ['hero', 'main', 'footer'].forEach(function (r) {
      var la = (a.layout || {})[r] || {}, lb = (b.layout || {})[r] || {};
      if (JSON.stringify(la.blocks || []) !== JSON.stringify(lb.blocks || [])) out.push('Vùng ' + r + ': đổi block / thứ tự');
      if ((la.variant || '') !== (lb.variant || '')) out.push('Vùng ' + r + ': kiểu ' + (lb.variant || 'mặc định'));
      if (la.rank !== lb.rank) out.push('Vùng ' + r + ': ' + (lb.rank === false ? 'tắt' : 'bật') + ' tự xếp theo viral');
    });
    return out;
  }

  function publish(slug, json, note) {
    var st = load(slug);
    var prev = get(slug, st.current);
    var v = st.versions.reduce(function (m, x) { return Math.max(m, x.v); }, 0) + 1;
    var data = clone(json);
    data.updatedAt = new Date().toISOString();
    st.versions.push({ v: v, at: data.updatedAt, by: AUTHOR, note: note || '', changes: diff(prev && prev.json, data), json: data });
    st.current = v;
    saveState(slug, st);
    return v;
  }

  function rollback(slug, v) {
    var old = get(slug, v);
    if (!old) return null;
    return publish(slug, old.json, 'Rollback về v' + v);
  }

  function clear(slug) { try { localStorage.removeItem(PREFIX + slug); } catch (e) {} }

  window['LinkVersions'] = {
    'load': load, 'get': get, 'current': current, 'publish': publish, 'rollback': rollback,
    'diff': diff, 'same': same, 'clear': clear, 'DRAFT_PREFIX': 'linkbio-draft-v3-'
  };
})();
