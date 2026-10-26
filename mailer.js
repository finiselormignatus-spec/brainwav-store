// Transactional email (welcome + order confirmation) over any SMTP server.
// Config comes from .env (see README). When SMTP_USER is empty, mail is a silent no-op.
// Sends are fire-and-forget: callers never await them, so slow mail cannot block checkout.
import nodemailer from 'nodemailer';

const SHOP = 'Marc Brainwav Premium Deals';
const CONTACT = 'WhatsApp +233595484295, call 0501994337, Snapchat keli_brainwav21';

let transporter = null;
let warnedOff = false;

function getTransporter() {
  if (transporter !== null) return transporter;
  const user = process.env.SMTP_USER || '';
  if (!user) {
    if (!warnedOff) {
      console.log('[mail] SMTP_USER is not set, email notifications are off.');
      warnedOff = true;
    }
    transporter = false;
    return transporter;
  }
  const port = Number(process.env.SMTP_PORT) || 587;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port,
    secure: port === 465,
    auth: { user, pass: process.env.SMTP_PASS || '' },
  });
  return transporter;
}

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = (n) => `GH₵ ${Number(n || 0).toLocaleString('en-GH')}`;

function from() {
  return process.env.SMTP_FROM || `${SHOP} <${process.env.SMTP_USER}>`;
}

function welcomeMessage({ name, email }) {
  const subject = `Welcome to ${SHOP}`;
  const text = [
    `Hi ${name},`,
    '',
    `Thanks for creating an account with ${SHOP}. You can now order iPhones, subscriptions and gift cards and track your orders from your account.`,
    '',
    `Questions? ${CONTACT}`,
    '',
    `Your trust, our reputation.`,
  ].join('\n');
  const html = `<div style="font-family:Arial,sans-serif;color:#0b2a1b">
<h2 style="margin:0 0 12px">Welcome, ${esc(name)}</h2>
<p>Thanks for creating an account with <strong>${SHOP}</strong>. You can now order iPhones, subscriptions and gift cards and track your orders from your account.</p>
<p>Questions? ${esc(CONTACT)}</p>
<p><em>Your trust, our reputation.</em></p></div>`;
  return { from: from(), to: email, subject, text, html };
}

function orderMessage(order) {
  const lines = (order.lines || []).map((l) => `${l.name}${l.variant ? ` (${l.variant})` : ''} x${l.qty} = ${money(l.price * l.qty)}`);
  const subject = `Order ${order.ref} received, ${SHOP}`;
  const text = [
    `Hi ${order.customer_name},`,
    '',
    `We received your order. Reference: ${order.ref}`,
    '',
    'Items:',
    ...lines.map((l) => `- ${l}`),
    '',
    `Total: ${money(order.total)}`,
    `Payment: ${order.payment_method || 'pending'}, status ${order.status || 'pending'}`,
    '',
    `Keep your reference ${order.ref} for follow-up. Questions? ${CONTACT}`,
    '',
    'Your trust, our reputation.',
  ].join('\n');
  const rows = (order.lines || []).map((l) => `<tr><td style="padding:6px 8px;border-bottom:1px solid #e5e5e5">${esc(l.name)}${l.variant ? ` (${esc(l.variant)})` : ''}</td><td style="padding:6px 8px;border-bottom:1px solid #e5e5e5;text-align:center">${esc(l.qty)}</td><td style="padding:6px 8px;border-bottom:1px solid #e5e5e5;text-align:right">${esc(money(l.price * l.qty))}</td></tr>`).join('');
  const html = `<div style="font-family:Arial,sans-serif;color:#0b2a1b">
<h2 style="margin:0 0 12px">Order received</h2>
<p>Hi ${esc(order.customer_name)}, we received your order.</p>
<p><strong>Reference: ${esc(order.ref)}</strong></p>
<table style="border-collapse:collapse;width:100%;max-width:560px"><thead><tr><th align="left" style="padding:6px 8px">Item</th><th style="padding:6px 8px">Qty</th><th align="right" style="padding:6px 8px">Amount</th></tr></thead><tbody>${rows}</tbody></table>
<p><strong>Total: ${esc(money(order.total))}</strong><br>Payment: ${esc(order.payment_method || 'pending')}, status ${esc(order.status || 'pending')}</p>
<p>Keep your reference ${esc(order.ref)} for follow-up. Questions? ${esc(CONTACT)}</p>
<p><em>Your trust, our reputation.</em></p></div>`;
  return { from: from(), to: order.email, subject, text, html };
}

// Fire-and-forget. Returns immediately; failures are logged, never thrown.
function dispatch(build, data, label) {
  if (!data || !data.email) return;
  setImmediate(async () => {
    try {
      const t = getTransporter();
      if (!t) return;
      const info = await t.sendMail(build(data));
      console.log(`[mail] ${label} sent to ${data.email}${info && info.messageId ? ` (${info.messageId})` : ''}`);
    } catch (err) {
      console.error(`[mail] ${label} to ${data.email} failed:`, err && err.message ? err.message : err);
    }
  });
}

export function sendWelcome(customer) {
  dispatch(welcomeMessage, customer, 'welcome');
}

export function sendOrderConfirmation(order) {
  dispatch(orderMessage, order, 'order confirmation');
}
