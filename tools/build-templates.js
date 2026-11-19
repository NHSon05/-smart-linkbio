#!/usr/bin/env node
/**
 * Gộp demo/templates/<id>/template.json → demo/data/templates.js (window.LINK_TEMPLATES).
 * Manifest là nguồn duy nhất: landing (render) và editor (luật kéo thả) cùng đọc.
 * Demo cần file .js vì trình duyệt mở bằng file:// không fetch được JSON.
 * Chạy lại sau khi sửa template:  node demo/tools/build-templates.js
 */
'use strict';
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'templates');
const out = {};
for (const id of fs.readdirSync(dir).sort()) {
  const file = path.join(dir, id, 'template.json');
  if (!fs.existsSync(file)) continue;
  const t = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (t.id !== id) throw new Error(`${file}: "id" phải trùng tên thư mục (${id})`);
  for (const r of ['header', 'hero', 'main', 'footer']) {
    if (!t.regions || !t.regions[r]) throw new Error(`${file}: thiếu vùng "${r}"`);
  }
  out[id] = t;
}
const js = '/* Sinh tự động bởi tools/build-templates.js. Đừng sửa tay. */\nwindow["LINK_TEMPLATES"] = ' + JSON.stringify(out, null, 2) + ';\n';
fs.writeFileSync(path.join(__dirname, '..', 'data', 'templates.js'), js);
console.log('templates:', Object.keys(out).join(', '));
