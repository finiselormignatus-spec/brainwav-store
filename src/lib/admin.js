import { api } from './api.js';
import { adminToken, setAdminToken } from './store.js';

// Admin session: a random token issued by the server, stored in this browser only.
export async function adminPasswordSet() {
  const s = await api('/admin/session', { token: adminToken() });
  return !!s.passwordSet;
}

/** First run only: sets the admin password once on the server, then signs in. */
export async function setupAdminPassword(password) {
  const res = await api('/admin/setup', { method: 'POST', body: { password } });
  setAdminToken(res.token);
  return res.token;
}

export async function login(password) {
  const res = await api('/admin/login', { method: 'POST', body: { password } });
  setAdminToken(res.token);
  return res.token;
}

export async function verifySession() {
  if (!adminToken()) return false;
  const s = await api('/admin/session', { token: adminToken() });
  return !!s.signedIn;
}

export async function logout() {
  const token = adminToken();
  setAdminToken(null);
  if (token) await api('/admin/logout', { method: 'POST', token }).catch(() => {});
}

export async function changePassword(current, next) {
  await api('/admin/password', { method: 'POST', body: { current, next }, token: adminToken() });
}
