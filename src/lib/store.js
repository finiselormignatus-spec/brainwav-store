import { api } from './api.js';

export const CONTACT = {
  whatsappNumber: '233595484295',
  whatsappUrl: 'https://wa.me/233595484295',
  phone: '0501994337',
  snapchat: 'keli_brainwav21',
  snapchatUrl: 'https://www.snapchat.com/add/keli_brainwav21',
};

export const money = (n) => `GH₵ ${Number(n || 0).toLocaleString('en-US')}`;

export const stockLabel = (stock) => {
  if (stock <= 0) return { text: 'Out of stock', tone: 'out' };
  if (stock <= 2) return { text: `Low stock: ${stock} left`, tone: 'low' };
  return { text: 'In stock', tone: 'in' };
};

export const slugify = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// Kept for the call sites that used to await the database before reading.
export async function init() {
  return true;
}

export function normalizeProduct(r) {
  return { ...r, id: Number(r.id), price: Number(r.price), stock: Number(r.stock), active: Number(r.active) === 1 };
}

export async function getSettings() {
  return api('/settings');
}

export async function getAdminSettings() {
  return api('/admin/settings', { token: adminToken() });
}

export async function saveSettings(entries) {
  return api('/admin/settings', { method: 'PUT', body: entries, token: adminToken() });
}

const ADMIN_KEY = 'mbpd-admin-token';
export function adminToken() {
  return localStorage.getItem(ADMIN_KEY);
}
export function setAdminToken(t) {
  if (t) localStorage.setItem(ADMIN_KEY, t);
  else localStorage.removeItem(ADMIN_KEY);
}

export async function listProducts() {
  const rows = await api('/products');
  return rows.map(normalizeProduct);
}

export async function getProductBySlug(slug) {
  const all = await listProducts();
  return all.find((p) => p.slug === slug) || null;
}

/** Places an order. The server re-reads prices and stock and reserves stock atomically. */
export async function placeOrder({ customer, items, method, screenshotName, token }) {
  return api('/orders', {
    method: 'POST',
    token,
    body: {
      customer: { name: customer.name, phone: customer.phone, email: customer.email, address: customer.address || '' },
      items: items.map((i) => ({ productId: i.productId, qty: i.qty })),
      method,
      screenshotName: screenshotName || null,
    },
  });
}

export async function getOrder(ref) {
  const o = await api(`/orders/${encodeURIComponent(ref.trim().toUpperCase())}`);
  return { ...o, items: o.items || [] };
}

// Cart lives in localStorage: a per-device preference, not owner data.
const CART_KEY = 'mbpd-cart';
export function readCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); } catch { return []; }
}
export function writeCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event('cart-change'));
}
export function cartKey(productId, variant) {
  return `${productId}::${variant}`;
}
