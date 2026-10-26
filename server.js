// Marc Brainwav Premium Deals: standalone server.
// Serves the built storefront (dist/) and the JSON API (/api) on one port.
// All data lives in one JSON file: data/store.db (override folder with DATA_DIR).
// Storage is the dependency-free JsonStore in store.js, so no native build tools are needed.
import express from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JsonStore } from './store.js';
import { sendWelcome, sendOrderConfirmation } from './mailer.js';

// Load .env (no dependency): simple KEY=VALUE lines, existing env wins.
(function loadDotEnv() {
  const p = path.join(path.dirname(fileURLToPath(import.meta.url)), '.env');
  if (!fs.existsSync(p)) return;
  for (const raw of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = raw.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!m || m[1] in process.env) continue;
    process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
})();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DIST = path.join(__dirname, 'dist');
// Product photos uploaded from the admin dashboard. Served at /uploads/*. Override with UPLOAD_DIR.
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, 'uploads');
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const PORT = Number(process.env.PORT) || 3000;
const CUSTOMER_MS = 30 * 24 * 60 * 60 * 1000;
const ADMIN_MS = 8 * 60 * 60 * 1000;
const ITERATIONS = 150000;
const CATEGORIES = ['iphones', 'subscriptions', 'giftcards'];
const ORDER_STATUSES = ['pending', 'paid', 'delivered', 'cancelled'];
const SETTING_KEYS = ['paystack_enabled', 'paystack_public_key'];

// ---------- storage ----------
// Tables and their unique columns. Same names and rules as the old SQL schema.
const db = new JsonStore(path.join(DATA_DIR, 'store.db'), {
  products: { unique: ['slug'] },
  customers: { unique: ['email'] },
  customer_sessions: { unique: ['token_hash'] },
  admin_sessions: { unique: ['token_hash'] },
  orders: { unique: ['ref'] },
  settings: { unique: ['key'] },
});

const nowStamp = () => new Date().toISOString().slice(0, 19).replace('T', ' ');

const DEFAULT_SETTINGS = {
  paystack_enabled: 'false', paystack_public_key: '',
};

function getSetting(key) {
  const r = db.find('settings', (s) => s.key === key);
  return r ? r.value : undefined;
}
function setSetting(key, value) {
  const n = db.update('settings', (s) => s.key === key, { value });
  if (!n) db.insert('settings', { key, value });
}

// Startup seed. Idempotent, so it runs on every start and changes nothing once applied:
//  1. renames the 18-series rows (keyed by the old slug; a row that is already renamed is skipped)
//  2. inserts catalog rows missing from the db, by slug; fills an empty image_url on existing rows only
//     (never overwrites a non-empty image_url or edits other fields)
//  3. stores default settings that are not set yet
const CATALOG_FILE = path.join(__dirname, 'src', 'data', 'catalog.json');
const PRODUCT_RENAMES = {
  'iphone-18-pro-256gb-brand-new-burgundy-black-glacier': { slug: 'iphone-18-pro-256gb-burgundy-black-glacier', name: 'iPhone 18 Pro 256GB (Burgundy / Black / Glacier)' },
  'iphone-18-pro-max-256gb-brand-new-burgundy': { slug: 'iphone-18-pro-max-256gb-burgundy', name: 'iPhone 18 Pro Max 256GB (Burgundy)' },
  'iphone-18-pro-max-256gb-brand-new-blue-white-black': { slug: 'iphone-18-pro-max-256gb-blue-white-black', name: 'iPhone 18 Pro Max 256GB (Blue / White / Black)', variant: 'Brand New · pick colour' },
  'iphone-18-pro-max-512gb-brand-new-burgundy': { slug: 'iphone-18-pro-max-512gb-burgundy', name: 'iPhone 18 Pro Max 512GB (Burgundy)' },
  'iphone-18-pro-max-512gb-brand-new-silver': { slug: 'iphone-18-pro-max-512gb-silver', name: 'iPhone 18 Pro Max 512GB (Silver)' },
  'iphone-18-pro-max-512gb-brand-new-black': { slug: 'iphone-18-pro-max-512gb-black', name: 'iPhone 18 Pro Max 512GB (Black)' },
  'iphone-18-pro-max-512gb-brand-new-white': { slug: 'iphone-18-pro-max-512gb-white', name: 'iPhone 18 Pro Max 512GB (White)' },
};

const IMAGE_REPOINTS = {
  'iphone-11-64gb-uk-used': '/uploads/ph-iphone-xr.jpg',
  'iphone-13-green': '/uploads/ph-iphone-13.jpg',
  "iphone-xr-64gb-uk-used": "/uploads/ph-iphone-xr.jpg",
  "iphone-xr-128gb-uk-used": "/uploads/ph-iphone-xr.jpg",
  "iphone-12-64gb-uk-used": "/uploads/ph-iphone-12.jpg",
  "iphone-12-128gb-uk-used": "/uploads/ph-iphone-12.jpg",
  "iphone-15-128gb-uk-used": "/uploads/ph-iphone-15.jpg",
  "iphone-16-128gb-uk-used": "/uploads/ph-iphone-16.jpg",
  "iphone-18-pro-256gb-burgundy-black-glacier": "/uploads/ip-18-pro-max-placeholder.jpg",
  "iphone-18-pro-max-512gb-burgundy": "/uploads/ip-18-pro-max-placeholder.jpg",
  "iphone-18-pro-max-512gb-silver": "/uploads/ip-18-pro-max-placeholder.jpg",
  "iphone-18-pro-max-512gb-black": "/uploads/ip-18-pro-max-placeholder.jpg",
  "iphone-18-pro-max-512gb-white": "/uploads/ip-18-pro-max-placeholder.jpg",
  "iphone-16-pro-max-256gb-sim": "/uploads/ph-iphone-16-pro-max-256.jpg",
  "iphone-16-pro-max-512gb-sim": "/uploads/ph-iphone-16-pro-max-256.jpg",
  "iphone-15-pro-max-256gb-sim": "/uploads/ph-iphone-15-pro-max.jpg",
  "iphone-18-pro-max-256gb-burgundy": "/uploads/ph-iphone-18-pro-max.jpg",
  "iphone-18-pro-max-256gb-blue-white-black": "/uploads/ph-iphone-18-pro-max.jpg",
  "iphone-17-pro-max-256gb-sim": "/uploads/ph-iphone-17.jpg",
  "iphone-17-pro-max-512gb-sim": "/uploads/ph-iphone-17.jpg",
  "iphone-17-pro-max-256gb-esim": "/uploads/ph-iphone-17.jpg",
  "iphone-17-pro-256gb-sim": "/uploads/ph-iphone-17.jpg",
  "iphone-17-pro-256gb-esim": "/uploads/ph-iphone-17.jpg",
  "iphone-17-air-256gb-esim": "/uploads/ph-iphone-17.jpg",
  "iphone-17-256gb-sim": "/uploads/ph-iphone-17.jpg",
  "iphone-16-pro-256gb-sim": "/uploads/ph-iphone-16.jpg",
  "iphone-16-pro-128gb-sim": "/uploads/ph-iphone-16.jpg",
  "iphone-16-plus-256gb-sim": "/uploads/ph-iphone-16.jpg",
  "iphone-16-plus-128gb-sim": "/uploads/ph-iphone-16.jpg",
  "iphone-16-256gb-sim": "/uploads/ph-iphone-16.jpg",
  "iphone-16-128gb-sim": "/uploads/ph-iphone-16.jpg",
  "iphone-15-pro-256gb-sim": "/uploads/ph-iphone-15.jpg",
  "iphone-15-128gb-sim": "/uploads/ph-iphone-15.jpg",
  "iphone-14-pro-max-128gb-sim": "/uploads/ph-iphone-14.jpg",
  "iphone-14-pro-128gb-sim": "/uploads/ph-iphone-14.jpg",
  "iphone-14-plus-128gb-sim": "/uploads/ph-iphone-14.jpg",
  "iphone-13-pro-128gb-sim": "/uploads/ip-13-pro.jpg",
  "iphone-13-128gb-uk-used": "/uploads/ph-iphone-13.jpg"
};

function seedStartup() {
  let items = [];
  try { items = JSON.parse(fs.readFileSync(CATALOG_FILE, 'utf8')); } catch { /* no catalog file: nothing to insert */ }
  db.transaction(() => {
    for (const [oldSlug, next] of Object.entries(PRODUCT_RENAMES)) {
      if (!db.find('products', (r) => r.slug === oldSlug)) continue;
      if (db.find('products', (r) => r.slug === next.slug)) continue;
      db.update('products', (r) => r.slug === oldSlug, { slug: next.slug, name: next.name, ...(next.variant ? { variant: next.variant } : {}) });
    }
    for (const p of items) {
      const existing = db.find('products', (r) => r.slug === p.slug);
      if (!existing) {
        db.insert('products', {
          slug: p.slug, name: p.name, category: p.category, variant: p.variant || '', description: p.description || '',
          price: Number(p.price) || 0, stock: Number(p.stock) || 0, image_url: p.image_url || '',
          active: p.active === 0 ? 0 : 1, storage: p.storage || '', condition: p.condition || '',
          battery: p.battery ?? null, color: p.color || '', rating: p.rating ?? null, review_count: p.review_count ?? null,
          compare_price: p.compare_price ?? null, created_at: nowStamp(),
        });
      } else if (!existing.image_url && p.image_url) {
        db.update('products', (r) => r.slug === p.slug, { image_url: p.image_url });
      }
    }
    for (const [slug, img] of Object.entries(IMAGE_REPOINTS)) {
      const row = db.find('products', (r) => r.slug === slug);
      if (row && row.image_url !== img) db.update('products', (r) => r.slug === slug, { image_url: img });
    }
    for (const [k, v] of Object.entries(DEFAULT_SETTINGS)) {
      if (getSetting(k) === undefined) db.insert('settings', { key: k, value: v });
    }
  });
}
seedStartup();

// ---------- helpers ----------
class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
const fail = (status, message) => { throw new HttpError(status, message); };

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
const randomHex = (n) => crypto.randomBytes(n).toString('hex');
const normEmail = (e) => String(e || '').trim().toLowerCase();
const slugify = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

function pbkdf2(password, saltHex) {
  return crypto.pbkdf2Sync(String(password), saltHex, ITERATIONS, 32, 'sha256').toString('hex');
}
function checkPassword(password, saltHex, hashHex) {
  const a = Buffer.from(pbkdf2(password, saltHex), 'hex');
  const b = Buffer.from(hashHex, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
function bearer(req) {
  const m = String(req.get('authorization') || '').match(/^Bearer (.+)$/);
  return m ? m[1] : null;
}

// Brute-force guards: failed logins and order-ref lookups are counted per IP in a 15 minute window.
const WINDOW_MS = 15 * 60 * 1000;
const limits = { admin: 10, customer: 10, lookup: 60 };
const failures = new Map();
function bucketKey(req, scope, extra = '') {
  return `${scope}|${req.ip || 'unknown'}|${extra}`;
}
function guardLimit(req, scope, extra = '') {
  const rec = failures.get(bucketKey(req, scope, extra));
  if (rec && rec.until > Date.now() && rec.count >= limits[scope]) {
    fail(429, 'Too many attempts. Wait 15 minutes and try again.');
  }
}
function recordFailure(req, scope, extra = '') {
  const key = bucketKey(req, scope, extra);
  const rec = failures.get(key);
  const now = Date.now();
  if (!rec || rec.until <= now) failures.set(key, { count: 1, until: now + WINDOW_MS });
  else rec.count += 1;
  if (failures.size > 5000) for (const [k, v] of failures) if (v.until <= now) failures.delete(k);
}
const guardLogin = (req) => guardLimit(req, 'admin');
const recordAdminFailure = (req) => recordFailure(req, 'admin');

const requireCustomer = (req, _res, next) => {
  const token = bearer(req);
  const s = token ? db.find('customer_sessions', (r) => r.token_hash === sha256(token)) : undefined;
  const c = s ? db.find('customers', (r) => r.id === s.customer_id) : undefined;
  if (!c || Number(s.expires_at) <= Date.now()) return next(new HttpError(401, 'Log in to continue.'));
  req.customer = { id: c.id, name: c.name, email: c.email, phone: c.phone, address: c.address || '', expires_at: s.expires_at };
  next();
};

const requireAdmin = (req, _res, next) => {
  const token = bearer(req);
  const row = token ? db.find('admin_sessions', (r) => r.token_hash === sha256(token)) : undefined;
  if (!row || Number(row.expires_at) <= Date.now()) return next(new HttpError(401, 'Sign in as admin to continue.'));
  next();
};

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function publicCustomer(c) {
  return { id: Number(c.id), name: c.name, email: c.email, phone: c.phone, address: c.address || '' };
}
function pruneSessions() {
  const now = Date.now();
  db.remove('customer_sessions', (r) => Number(r.expires_at) <= now);
  db.remove('admin_sessions', (r) => Number(r.expires_at) <= now);
}
function issueCustomerSession(customerId) {
  pruneSessions();
  const token = randomHex(32);
  db.insert('customer_sessions', { token_hash: sha256(token), customer_id: customerId, expires_at: Date.now() + CUSTOMER_MS, created_at: nowStamp() });
  return token;
}
function issueAdminSession() {
  pruneSessions();
  const token = randomHex(32);
  db.insert('admin_sessions', { token_hash: sha256(token), expires_at: Date.now() + ADMIN_MS, created_at: nowStamp() });
  return token;
}

// ----- image uploads (no dependency: a small multipart parser) -----
// The file type is decided by its magic bytes, never by the client's filename or Content-Type.
function sniffImage(buf) {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (buf.length >= 12 && buf.subarray(0, 4).toString('latin1') === 'RIFF' && buf.subarray(8, 12).toString('latin1') === 'WEBP') return 'webp';
  return null;
}
// Returns the bytes of the part named "file", or null.
function readFilePart(body, boundary) {
  const delim = Buffer.from(`--${boundary}`);
  const crlf = Buffer.from('\r\n\r\n');
  let pos = body.indexOf(delim);
  while (pos !== -1) {
    const start = pos + delim.length;
    const next = body.indexOf(delim, start);
    if (next === -1) break;
    let part = body.subarray(start, next);
    if (part[0] === 13 && part[1] === 10) part = part.subarray(2);
    if (part.length >= 2 && part[part.length - 2] === 13 && part[part.length - 1] === 10) part = part.subarray(0, part.length - 2);
    const hdrEnd = part.indexOf(crlf);
    if (hdrEnd !== -1) {
      const headers = part.subarray(0, hdrEnd).toString('utf8');
      const disp = headers.match(/content-disposition:[^\r\n]*\bname="([^"]*)"/i);
      if (disp && disp[1] === 'file') return part.subarray(hdrEnd + 4);
    }
    pos = next;
  }
  return null;
}

const uploadBody = express.raw({ type: 'multipart/form-data', limit: MAX_UPLOAD_BYTES + 256 * 1024 });

const nullable = (v) => (v === null || v === undefined ? null : Number(v));

function productOut(r) {
  return {
    id: Number(r.id), slug: r.slug, name: r.name, category: r.category, variant: r.variant || '',
    description: r.description || '', price: Number(r.price), stock: Number(r.stock), image_url: r.image_url || '',
    active: Number(r.active) === 1 ? 1 : 0, storage: r.storage || '', condition: r.condition || '',
    battery: nullable(r.battery), color: r.color || '', rating: nullable(r.rating), review_count: nullable(r.review_count),
    compare_price: nullable(r.compare_price),
  };
}

function orderOut(r) {
  return {
    id: Number(r.id), ref: r.ref, customer_name: r.customer_name, phone: r.phone, email: r.email,
    address: r.address || '', total: Number(r.total), payment_method: r.payment_method,
    status: r.status, screenshot_name: r.screenshot_name, created_at: r.created_at,
    items: JSON.parse(r.items_json || '[]'),
  };
}

const ordersNewestFirst = (pred) => db.all('orders', pred).sort((a, b) => b.id - a.id);

const MAX_PRICE = 100000000; // GH₵ 100m ceiling
const MAX_STOCK = 1000000;
const clip = (v, n) => String(v ?? '').slice(0, n);
// Accepts only http(s) or site-relative image paths, so javascript: and data: URLs are never stored.
function safeImageUrl(v) {
  const s = String(v ?? '').trim().slice(0, 500);
  if (!s) return '';
  if (/^https?:\/\//i.test(s) || (s.startsWith('/') && !s.startsWith('//'))) return s;
  return '';
}
function cleanProductBody(b) {
  const name = clip(b.name, 200).trim();
  if (!name) fail(400, 'Enter a product name.');
  if (!CATEGORIES.includes(b.category)) fail(400, 'Choose a category.');
  const iphone = b.category === 'iphones';
  const battery = iphone && b.battery !== '' && b.battery !== null && b.battery !== undefined ? Math.round(Number(b.battery)) : null;
  const price = Number(b.price);
  const stock = Number(b.stock);
  const cp = b.compare_price;
  if (cp !== '' && cp !== null && cp !== undefined && (!Number.isFinite(Number(cp)) || Number(cp) < 0 || Number(cp) > MAX_PRICE)) fail(400, 'Enter a valid was price.');
  if (!Number.isFinite(price) || price < 0 || price > MAX_PRICE) fail(400, 'Enter a valid price.');
  if (!Number.isFinite(stock) || stock < 0 || stock > MAX_STOCK) fail(400, 'Enter a valid stock count.');
  return {
    name,
    category: b.category,
    variant: clip(b.variant, 200),
    description: clip(b.description, 2000),
    price: Math.round(price),
    stock: Math.round(stock),
    image_url: safeImageUrl(b.image_url),
    active: b.active ? 1 : 0,
    storage: iphone ? String(b.storage || '') : '',
    condition: iphone ? String(b.condition || '') : '',
    battery,
    color: iphone ? String(b.color || '') : '',
    compare_price: b.compare_price === '' || b.compare_price === null || b.compare_price === undefined ? null : Math.round(Number(b.compare_price)),
  };
}

// ---------- app ----------
const app = express();
app.disable('x-powered-by');
app.use((_req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'DENY');
  res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});
app.use(express.json({ limit: '200kb' }));

const api = express.Router();

// Public settings (never admin keys or the password hash).
api.get('/settings', wrap((_req, res) => {
  const rows = db.all('settings', (r) => !r.key.startsWith('admin_'));
  res.json(Object.fromEntries(rows.map((r) => [r.key, r.value])));
}));

// Catalog: active products only.
api.get('/products', wrap((_req, res) => {
  res.json(db.all('products', (p) => Number(p.active) === 1).sort((a, b) => a.id - b.id).map(productOut));
}));

// ----- customers -----
api.post('/customers/register', wrap((req, res) => {
  const name = String(req.body.name || '').trim();
  const email = normEmail(req.body.email);
  const phone = String(req.body.phone || '').trim();
  const password = String(req.body.password || '');
  if (!name) fail(400, 'Enter your full name.');
  if (!/^\S+@\S+\.\S+$/.test(email)) fail(400, 'Enter a valid email address.');
  if (!/^[0-9+\s]{9,15}$/.test(phone)) fail(400, 'Enter a phone number with at least 9 digits.');
  if (password.length < 8) fail(400, 'Use at least 8 characters for your password.');
  if (db.find('customers', (c) => c.email === email)) {
    fail(409, 'An account with this email already exists. Log in instead.');
  }
  const salt = randomHex(16);
  const id = db.insert('customers', {
    name, email, phone, address: '', password_hash: pbkdf2(password, salt), password_salt: salt, created_at: nowStamp(),
  });
  const customer = { id, name, email, phone, address: '' };
  res.status(201).json({ token: issueCustomerSession(id), customer });
  sendWelcome({ name, email });
}));

api.post('/customers/login', wrap((req, res) => {
  const email = normEmail(req.body.email);
  guardLimit(req, 'customer', email);
  const c = db.find('customers', (r) => r.email === email);
  // Same message for unknown email and wrong password, so accounts cannot be enumerated.
  if (!c || !checkPassword(String(req.body.password || ''), c.password_salt, c.password_hash)) {
    recordFailure(req, 'customer', email);
    fail(401, 'Email or password is not right. Try again.');
  }
  res.json({ token: issueCustomerSession(Number(c.id)), customer: publicCustomer(c) });
}));

api.post('/customers/logout', wrap((req, res) => {
  const token = bearer(req);
  if (token) db.remove('customer_sessions', (r) => r.token_hash === sha256(token));
  res.json({ ok: true });
}));

api.get('/customers/me', requireCustomer, (req, res) => {
  res.json({ customer: publicCustomer(req.customer) });
});

api.put('/customers/me', requireCustomer, wrap((req, res) => {
  const phone = String(req.body.phone || '').trim();
  if (!/^[0-9+\s]{9,15}$/.test(phone)) fail(400, 'Enter a phone number with at least 9 digits.');
  const address = clip(req.body.address, 300).trim();
  db.update('customers', (c) => c.id === req.customer.id, { phone, address });
  res.json({ customer: publicCustomer({ ...req.customer, phone, address }) });
}));

// Order history: only the logged-in customer's own orders.
api.get('/customers/orders', requireCustomer, wrap((req, res) => {
  const rows = ordersNewestFirst((o) => o.customer_id === req.customer.id);
  res.json(rows.map((r) => {
    const o = orderOut(r);
    return { ref: o.ref, total: o.total, status: o.status, payment_method: o.payment_method, created_at: o.created_at, items: o.items };
  }));
}));

// ----- orders -----
api.post('/orders', requireCustomer, wrap((req, res) => {
  const b = req.body || {};
  const name = String(b.customer?.name || '').trim();
  const phone = String(b.customer?.phone || '').trim();
  const email = String(b.customer?.email || '').trim();
  const address = String(b.customer?.address || '').trim();
  if (!name) fail(400, 'Enter your name.');
  if (!/^[0-9+\s]{9,15}$/.test(phone)) fail(400, 'Enter a phone number with at least 9 digits.');
  if (!Array.isArray(b.items) || b.items.length === 0) fail(400, 'Your cart is empty.');
  if (b.items.length > 50) fail(400, 'Too many items in one order.');
  // Strict: no rounding. 1.5 or "2abc" is rejected, not silently changed.
  const wanted = b.items.map((i) => ({ productId: Number(i.productId), qty: Number(i.qty) }));
  for (const w of wanted) {
    if (!Number.isInteger(w.productId) || w.productId < 1) fail(400, 'One of the items is not valid.');
    if (!Number.isInteger(w.qty) || w.qty < 1 || w.qty > 50) fail(400, 'Quantities must be whole numbers between 1 and 50.');
  }
  // Checkout is pending until the owner marks it paid (Paystack is off by default).
  const method = String(b.method || 'whatsapp').slice(0, 30);
  const screenshotName = b.screenshotName ? String(b.screenshotName).slice(0, 200) : null;

  // One unit: any failure restores stock and writes nothing.
  const placeTx = () => db.transaction(() => {
    const lines = [];
    for (const w of wanted) {
      const p = db.find('products', (r) => r.id === w.productId && Number(r.active) === 1);
      if (!p) fail(400, 'One of the items is no longer available.');
      if (w.qty > Number(p.stock)) fail(400, `Only ${p.stock} left of ${p.name}.`);
      db.update('products', (r) => r.id === p.id, { stock: Number(p.stock) - w.qty });
      lines.push({ productId: Number(p.id), name: p.name, variant: p.variant || '', qty: w.qty, price: Number(p.price) });
    }
    const total = lines.reduce((s, l) => s + l.price * l.qty, 0);
    let ref;
    for (let attempt = 0; attempt < 5; attempt++) {
      ref = `MBPD-${randomHex(3).toUpperCase()}`;
      if (db.find('orders', (o) => o.ref === ref)) continue;
      db.insert('orders', {
        ref, customer_id: req.customer.id, customer_name: name, phone, email, address,
        items_json: JSON.stringify(lines), total, payment_method: method, status: 'pending',
        screenshot_name: screenshotName, created_at: nowStamp(),
      });
      return { ref, total, lines, status: 'pending' };
    }
    fail(500, 'Could not create an order reference. Please try again.');
  });
  const result = placeTx();
  res.status(201).json(result);
  // Confirmation to the address on the order. Fire-and-forget: never blocks checkout.
  sendOrderConfirmation({ ref: result.ref, customer_name: name, email: req.customer.email || email, lines: result.lines, total: result.total, payment_method: method, status: result.status });
}));

// Public order lookup by reference: no contact details are returned.
api.get('/orders/:ref', wrap((req, res) => {
  const ref = String(req.params.ref).trim().toUpperCase();
  guardLimit(req, 'lookup');
  if (!/^MBPD-[0-9A-F]{6}$/.test(ref)) { recordFailure(req, 'lookup'); fail(404, 'Order not found.'); }
  const row = db.find('orders', (o) => o.ref === ref);
  if (!row) { recordFailure(req, 'lookup'); fail(404, 'Order not found.'); }
  const o = orderOut(row);
  // No name, phone, email or address: a ref alone shows only status and items.
  res.json({ ref: o.ref, status: o.status, total: o.total, payment_method: o.payment_method, created_at: o.created_at, items: o.items });
}));

// ----- admin -----
api.get('/admin/session', wrap((req, res) => {
  const passwordSet = getSetting('admin_password_hash') !== undefined;
  const token = bearer(req);
  const row = token ? db.find('admin_sessions', (r) => r.token_hash === sha256(token)) : undefined;
  res.json({ passwordSet, signedIn: !!row && Number(row.expires_at) > Date.now() });
}));

// First run only: sets the admin password once. Never overwrites an existing one.
api.post('/admin/setup', wrap((req, res) => {
  const password = String(req.body.password || '');
  if (password.length < 8) fail(400, 'Use at least 8 characters.');
  if (getSetting('admin_password_hash') !== undefined) fail(409, 'An admin password is already set. Log in instead.');
  const salt = randomHex(16);
  db.insert('settings', { key: 'admin_password_hash', value: `${salt}:${pbkdf2(password, salt)}` });
  res.status(201).json({ token: issueAdminSession() });
}));

function storedAdminHash() {
  const v = getSetting('admin_password_hash');
  if (v === undefined) return null;
  const [salt, hash] = v.split(':');
  return { salt, hash };
}

api.post('/admin/login', wrap((req, res) => {
  guardLogin(req);
  const stored = storedAdminHash();
  if (!stored || !checkPassword(String(req.body.password || ''), stored.salt, stored.hash)) {
    recordAdminFailure(req);
    fail(401, 'That password is not right. Try again.');
  }
  res.json({ token: issueAdminSession() });
}));

api.post('/admin/logout', wrap((req, res) => {
  const token = bearer(req);
  if (token) db.remove('admin_sessions', (r) => r.token_hash === sha256(token));
  res.json({ ok: true });
}));

api.post('/admin/password', requireAdmin, wrap((req, res) => {
  const stored = storedAdminHash();
  if (!stored || !checkPassword(String(req.body.current || ''), stored.salt, stored.hash)) {
    fail(401, 'The current password is not right.');
  }
  const next = String(req.body.next || '');
  if (next.length < 8) fail(400, 'Use at least 8 characters.');
  const salt = randomHex(16);
  setSetting('admin_password_hash', `${salt}:${pbkdf2(next, salt)}`);
  res.json({ ok: true });
}));

api.get('/admin/summary', requireAdmin, wrap((_req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const all = db.all('orders');
  const todays = all.filter((o) => String(o.created_at).slice(0, 10) === today);
  res.json({
    orders_today: todays.length,
    sales_today: todays.filter((o) => ['paid', 'delivered'].includes(o.status)).reduce((s, o) => s + Number(o.total), 0),
    pending: all.filter((o) => o.status === 'pending').length,
  });
}));

api.get('/admin/products', requireAdmin, wrap((_req, res) => {
  res.json(db.all('products').sort((a, b) => a.id - b.id).map(productOut));
}));

// Field name: "file". Returns { url: "/uploads/<random>.<jpg|png|webp>" }.
api.post('/admin/upload', requireAdmin, uploadBody, wrap((req, res) => {
  const m = String(req.get('content-type') || '').match(/boundary=(?:"([^"]+)"|([^;\s]+))/i);
  const body = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
  const data = m ? readFilePart(body, m[1] || m[2]) : null;
  if (!data) fail(400, 'Choose an image to upload.');
  if (data.length === 0) fail(400, 'That file is empty.');
  if (data.length > MAX_UPLOAD_BYTES) fail(413, 'That image is too big. Keep it under 5MB.');
  const ext = sniffImage(data);
  if (!ext) fail(400, 'Only JPG, PNG or WebP images are allowed.');
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const name = `${randomHex(16)}.${ext}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, name), data, { flag: 'wx' });
  res.status(201).json({ url: `/uploads/${name}` });
}));

api.post('/admin/products', requireAdmin, wrap((req, res) => {
  const p = cleanProductBody(req.body);
  const slug = slugify(String(req.body.slug || '').trim() || `${p.name} ${p.variant}`);
  if (!slug) fail(400, 'Enter a product name.');
  try {
    const id = db.insert('products', { ...p, slug, rating: null, review_count: null, created_at: nowStamp() });
    res.status(201).json(productOut(db.find('products', (r) => r.id === id)));
  } catch (e) {
    if (/UNIQUE/i.test(e.message)) fail(409, 'That slug is already used. Change it and try again.');
    throw e;
  }
}));

api.put('/admin/products/:id', requireAdmin, wrap((req, res) => {
  const id = Number(req.params.id);
  const existing = db.find('products', (r) => r.id === id);
  if (!existing) fail(404, 'Product not found.');
  const p = cleanProductBody(req.body);
  const slug = slugify(String(req.body.slug || '').trim() || `${p.name} ${p.variant}`) || existing.slug;
  try {
    db.update('products', (r) => r.id === id, { ...p, slug });
  } catch (e) {
    if (/UNIQUE/i.test(e.message)) fail(409, 'That slug is already used. Change it and try again.');
    throw e;
  }
  res.json(productOut(db.find('products', (r) => r.id === id)));
}));

api.delete('/admin/products/:id', requireAdmin, wrap((req, res) => {
  const n = db.remove('products', (r) => r.id === Number(req.params.id));
  if (n === 0) fail(404, 'Product not found.');
  res.json({ ok: true });
}));

api.get('/admin/orders', requireAdmin, wrap((_req, res) => {
  res.json(ordersNewestFirst(() => true).slice(0, 200).map(orderOut));
}));

api.patch('/admin/orders/:id', requireAdmin, wrap((req, res) => {
  const id = Number(req.params.id);
  const status = String(req.body.status || '');
  if (!ORDER_STATUSES.includes(status)) fail(400, 'Unknown order status.');
  const order = db.find('orders', (o) => o.id === id);
  if (!order) fail(404, 'Order not found.');
  db.transaction(() => {
    // Cancelling returns stock reserved at placement; reopening takes it again.
    const lines = JSON.parse(order.items_json || '[]');
    if (status === 'cancelled' && order.status !== 'cancelled') {
      for (const l of lines) {
        const p = db.find('products', (r) => r.id === l.productId);
        if (p) db.update('products', (r) => r.id === p.id, { stock: Number(p.stock) + l.qty });
      }
    } else if (status !== 'cancelled' && order.status === 'cancelled') {
      for (const l of lines) {
        const p = db.find('products', (r) => r.id === l.productId);
        if (p) db.update('products', (r) => r.id === p.id, { stock: Math.max(0, Number(p.stock) - l.qty) });
      }
    }
    db.update('orders', (o) => o.id === id, { status });
  });
  res.json(orderOut(db.find('orders', (o) => o.id === id)));
}));

api.get('/admin/settings', requireAdmin, wrap((_req, res) => {
  const rows = db.all('settings', (r) => r.key !== 'admin_password_hash');
  res.json(Object.fromEntries(rows.map((r) => [r.key, r.value])));
}));

api.put('/admin/settings', requireAdmin, wrap((req, res) => {
  db.transaction(() => {
    for (const k of SETTING_KEYS) {
      if (req.body[k] !== undefined) setSetting(k, String(req.body[k]));
    }
  });
  res.json({ ok: true });
}));

app.use('/api', api);
app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found.' }));

// Uploaded product photos. Unknown names get a plain 404, never the storefront page.
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
app.use('/uploads', express.static(UPLOAD_DIR, { index: false, dotfiles: 'deny', maxAge: '7d' }));
app.use('/uploads', (_req, res) => res.status(404).end());

// Static storefront with SPA fallback.
if (fs.existsSync(DIST)) {
  app.use(express.static(DIST, { index: 'index.html' }));
  app.use((req, res, next) => {
    if (req.method !== 'GET') return next();
    res.sendFile(path.join(DIST, 'index.html'));
  });
} else {
  app.use((_req, res) => res.status(503).send('The storefront is not built yet. Run: npm run build'));
}

// Known errors return their message; anything else is logged and hidden from the client.
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Bad request.' });
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'That request is too large.' });
  console.error(err);
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
});

app.listen(PORT, () => {
  console.log(`Marc Brainwav Premium Deals running on http://localhost:${PORT}`);
  console.log(`Data file: ${path.join(DATA_DIR, 'store.db')}`);
});
