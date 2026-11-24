// بيدوّر في Wikimedia Commons على صورة لكل منتج في الـ seed، ويحمّل أنسب صورة مرخّصة (CC0 / Public domain / CC BY / CC BY-SA).
// الصور بتتحفظ في مجلد مؤقت للمراجعة اليدوية، مع candidates.json فيه المصوّر والترخيص والرابط.
//   node scripts/fetch-product-photos.mjs <outDir> [slugFilter]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(process.argv[2] ?? 'photos-review');
const only = process.argv[3];
fs.mkdirSync(outDir, { recursive: true });

const UA = 'VoltCart-demo/1.0 (demo shop catalogue photos)';
const API = 'https://commons.wikimedia.org/w/api.php';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---- الصفوف من SeedCatalog.cs
const source = fs.readFileSync(path.join(here, '../../api/Data/SeedCatalog.cs'), 'utf8');
const products = source
  .split('\n')
  .map((l) => l.trim())
  .filter((l) => /^[a-z-]+\|/.test(l))
  .map((l) => {
    const c = l.split('|').map((x) => x.trim());
    return { category: c[0], brand: c[1], name: c[2], slug: slugify(c[2]) };
  });

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// كلمات بتفرّق بين موديلات قريبة (iPhone 15 مش iPhone 15 Pro)
const DISTINGUISH = new Set(['ultra', 'pro', 'max', 'plus', 'fe', 'mini', 'air', 'lite', 'slim', 'digital', 'flip', 'fold', 'se', 'classic', 'xl', 'gt', 'studio', 'solo', 'buds']);
// كلمات عامة ما نشترطش وجودها في عنوان الصورة
const GENERIC = new Set(['inch', 'generation', 'th', 'gen', 'smart', 'tv', 'monitor', 'headset', 'headphones', 'speaker', 'controller', 'wireless', 'charger', 'cable', 'power', 'bank', 'adapter', 'keyboard', 'mouse', 'webcam', 'earbuds', 'watch', 'the', 'and']);
const BAD_TITLE = /(logo|unbox|box|event|launch|hands.?on|store|booth|stand|keynote|review|screenshot|wallpaper|sticker|advert|poster|diagram|comparison|vs\b|teardown|crowd|queue|line)/i;
const OK_LICENSE = /^(cc0|public domain|pd|cc[ -]by(-sa)?[ -]\d)/i;

const tokens = (text) => text.toLowerCase().replace(/\.[a-z0-9]+$/, '').split(/[^a-z0-9]+/).filter(Boolean);

function evaluate(product, page) {
  const info = page.imageinfo?.[0];
  if (!info) return null;
  if (!/^image\/(jpeg|png|webp)$/.test(info.mime)) return null;
  if (info.width < 600 || info.height < 400) return null;

  const meta = info.extmetadata ?? {};
  const license = meta.LicenseShortName?.value ?? '';
  if (!OK_LICENSE.test(license.trim())) return null;

  const title = page.title.replace(/^File:/, '');
  if (BAD_TITLE.test(title)) return null;

  const brandTokens = new Set(tokens(product.brand));
  const wanted = tokens(product.name).filter((t) => !brandTokens.has(t) && !GENERIC.has(t));
  const have = new Set(tokens(title));
  // "Buds2" في الاسم و "Buds 2" في العنوان: نجرّب نلصق الأرقام
  const haveJoined = tokens(title).join('');
  if (!wanted.every((t) => have.has(t) || haveJoined.includes(t))) return null;

  const wantedSet = new Set(tokens(product.name));
  for (const t of have) if (DISTINGUISH.has(t) && !wantedSet.has(t)) return null;

  const ratio = info.width / info.height;
  if (ratio < 0.55 || ratio > 2.2) return null;

  // الأفضل: صورة كبيرة وقريبة من التربيع، وعنوانها قصير (غالباً صورة المنتج نفسه)
  let score = Math.min(info.width, 2400) / 2400 + (1 - Math.abs(Math.log(ratio))) * 0.6 - title.length / 200;
  if (/white|cutout|transparent|front/i.test(title)) score += 0.3;

  const stripHtml = (s) => (s ?? '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  return {
    score,
    title,
    pageUrl: info.descriptionurl,
    thumbUrl: info.thumburl,
    width: info.width,
    height: info.height,
    license: license.trim(),
    licenseUrl: meta.LicenseUrl?.value ?? '',
    author: stripHtml(meta.Artist?.value) || 'Unknown',
  };
}

async function search(query) {
  const url = new URL(API);
  url.search = new URLSearchParams({
    action: 'query', generator: 'search', gsrnamespace: '6', gsrsearch: query, gsrlimit: '15',
    prop: 'imageinfo', iiprop: 'url|size|mime|extmetadata', iiurlwidth: '800', format: 'json',
  });
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (res.status === 429) { await sleep(5000); continue; }
    if (!res.ok) return [];
    const json = await res.json();
    return Object.values(json.query?.pages ?? {});
  }
  return [];
}

const results = {};
const resultsFile = path.join(outDir, 'candidates.json');
if (fs.existsSync(resultsFile)) Object.assign(results, JSON.parse(fs.readFileSync(resultsFile, 'utf8')));

for (const product of products) {
  if (only && product.slug !== only) continue;
  if (results[product.slug]) continue;

  const pages = await search(product.name);
  const ranked = pages.map((p) => evaluate(product, p)).filter(Boolean).sort((a, b) => b.score - a.score);
  const best = ranked[0];
  results[product.slug] = best ? { name: product.name, ...best } : { name: product.name, none: true };

  if (best) {
    const ext = best.thumbUrl.match(/\.(jpe?g|png|webp)(?:\?|$)/i)?.[1]?.toLowerCase().replace('jpeg', 'jpg') ?? 'jpg';
    const file = `${product.slug}.${ext}`;
    const img = await fetch(best.thumbUrl, { headers: { 'User-Agent': UA } });
    if (img.ok) {
      fs.writeFileSync(path.join(outDir, file), Buffer.from(await img.arrayBuffer()));
      results[product.slug].file = file;
    } else {
      results[product.slug] = { name: product.name, none: true, note: `download ${img.status}` };
    }
  }
  fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
  console.log(results[product.slug].file ? 'OK  ' : 'none', product.slug);
  await sleep(1200);
}

const found = Object.values(results).filter((r) => r.file).length;
console.log(`done: ${found}/${Object.keys(results).length} photos found`);
