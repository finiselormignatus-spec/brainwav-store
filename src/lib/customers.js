import { api } from './api.js';

// Customer accounts. Passwords are hashed on the server (PBKDF2 with a per-user salt).
// The session token lives in localStorage under its own key, separate from admin.
const TOKEN_KEY = 'mbpd-customer-token';

export function getCustomerToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function keep(res) {
  localStorage.setItem(TOKEN_KEY, res.token);
  return res.customer;
}

/** Returns the logged-in customer { id, name, email, phone, address } or null. */
export async function getCurrentCustomer() {
  const token = getCustomerToken();
  if (!token) return null;
  try {
    const res = await api('/customers/me', { token });
    return res.customer;
  } catch {
    localStorage.removeItem(TOKEN_KEY);
    return null;
  }
}

export async function registerCustomer({ name, email, phone, password }) {
  return keep(await api('/customers/register', { method: 'POST', body: { name, email, phone, password } }));
}

export async function loginCustomer({ email, password }) {
  return keep(await api('/customers/login', { method: 'POST', body: { email, password } }));
}

export async function logoutCustomer() {
  const token = getCustomerToken();
  localStorage.removeItem(TOKEN_KEY);
  if (token) await api('/customers/logout', { method: 'POST', token }).catch(() => {});
}

export async function updateCustomerProfile(_customerId, { phone, address }) {
  return api('/customers/me', { method: 'PUT', body: { phone, address }, token: getCustomerToken() });
}

/** Orders belonging to the logged-in customer only (the server filters by the session). */
export async function getCustomerOrders(_customerId) {
  return api('/customers/orders', { token: getCustomerToken() });
}
