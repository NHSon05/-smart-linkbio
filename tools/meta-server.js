#!/usr/bin/env node
/**
 * Server lấy metadata sản phẩm (ảnh, tên, giá) từ một URL.
 * Chạy:  node demo/tools/meta-server.js     (Node 18+, không cần cài package)
 * Gọi:   GET http://localhost:8787/meta?url=<url sản phẩm>
 * Trả:   { title, image, price, currency, url } hoặc 422 nếu không đọc được.
 *
 * Thứ tự đọc: JSON-LD (schema.org Product) → Open Graph / product:price → <title>.
 * Lưu ý: nhiều sàn (Shopee, Lazada...) render bằng JS và chặn bot, nên HTML trả về
 * có thể thiếu metadata → client hiện popup điền tay. Bản thật nên dùng API của sàn
 * hoặc headless browser cho các domain này.
 */
'use strict';
const http = require('http');

const PORT = Number(process.env.PORT || 8787);
const MAX_BYTES = 1.5 * 1024 * 1024;

function decode(s) {
  return String(s || '')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .trim();
}

function metaTag(html, key) {
  const re = new RegExp('<meta[^>]+(?:property|name|itemprop)=["\']' + key.replace(/[:.]/g, '\\$&') + '["\'][^>]*>', 'i');
  const tag = (html.match(re) || [])[0];
  if (!tag) return '';
  return decode((tag.match(/content=["']([^"']*)["']/i) || [])[1]);
}

function jsonLdProduct(html) {
  const blocks = html.match(/<script[^>]+application\/ld\+json[^>]*>[\s\S]*?<\/script>/gi) || [];
  for (const b of blocks) {
    try {
      const data = JSON.parse(b.replace(/^<script[^>]*>|<\/script>$/gi, ''));
      const list = [].concat(data['@graph'] || data);
      const p = list.find((x) => x && /Product/i.test([].concat(x['@type']).join(',')));
      if (!p) continue;
      const offer = [].concat(p.offers || [])[0] || {};
      const spec = [].concat(offer.priceSpecification || [])[0] || {};
      return {
        title: p.name,
        image: [].concat(p.image || [])[0],
        price: offer.price || offer.lowPrice || spec.price,
        currency: offer.priceCurrency || spec.priceCurrency,
      };
    } catch (e) { /* JSON-LD hỏng: bỏ qua */ }
  }
  return {};
}

function extract(html, baseUrl) {
  const ld = jsonLdProduct(html);
  const title = ld.title || metaTag(html, 'og:title') || metaTag(html, 'twitter:title') || decode((html.match(/<title[^>]*>([^<]*)<\/title>/i) || [])[1]);
  let image = ld.image || metaTag(html, 'og:image') || metaTag(html, 'twitter:image');
  if (image && typeof image === 'object') image = image.url;
  if (image) { try { image = new URL(image, baseUrl).toString(); } catch (e) { image = ''; } }
  const price = ld.price || metaTag(html, 'product:price:amount') || metaTag(html, 'og:price:amount') || metaTag(html, 'price');
  const currency = ld.currency || metaTag(html, 'product:price:currency') || metaTag(html, 'og:price:currency') || metaTag(html, 'priceCurrency');
  return {
    title: decode(title),
    image: image || '',
    price: price ? Number(String(price).replace(/[^\d.]/g, '')) || null : null,
    currency: currency || null,
  };
}

async function handle(target) {
  const u = new URL(target);
  if (!/^https?:$/.test(u.protocol)) throw Object.assign(new Error('Chỉ hỗ trợ http/https'), { code: 400 });
  const res = await fetch(u, {
    redirect: 'follow',
    signal: AbortSignal.timeout(8000),
    headers: { 'user-agent': 'Mozilla/5.0 (compatible; LinkBioMetaBot/0.1)', 'accept-language': 'vi,en;q=0.8' },
  });
  const reader = res.body.getReader();
  let html = '', size = 0;
  const dec = new TextDecoder();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length; html += dec.decode(value, { stream: true });
    if (size > MAX_BYTES) { reader.cancel(); break; } // JSON-LD có thể nằm trong <body>, nên đọc tới giới hạn
  }
  return { url: res.url, ...extract(html, res.url) };
}

http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  const q = new URL(req.url, 'http://localhost');
  if (q.pathname !== '/meta' || !q.searchParams.get('url')) { res.statusCode = 404; return res.end('{"error":"GET /meta?url=..."}'); }
  try {
    const meta = await handle(q.searchParams.get('url'));
    res.statusCode = meta.title ? 200 : 422;
    res.end(JSON.stringify(meta));
  } catch (e) {
    res.statusCode = e.code || 502;
    res.end(JSON.stringify({ error: String(e.message || e) }));
  }
}).listen(PORT, () => console.log('meta-server: http://localhost:' + PORT + '/meta?url=...'));
