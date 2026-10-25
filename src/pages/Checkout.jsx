import { useEffect, useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { CheckCircle, ArrowLeft, WhatsappLogo } from '@phosphor-icons/react';
import { readCart, placeOrder, getSettings, money, CONTACT } from '../lib/store.js';
import { getCustomerToken } from '../lib/customers.js';
import { clearCart } from '../lib/cart.js';
import { useCustomer } from '../lib/useCustomer.js';

const EMPTY = { name: '', phone: '', email: '', address: '' };

export default function Checkout() {
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const { customer, loading: authLoading } = useCustomer();
  const [items] = useState(readCart);
  const [settings, setSettings] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [method, setMethod] = useState('');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    getSettings().then(setSettings).catch(() => setSettings({}));
  }, []);

  // Prefill from the account once it loads (only fills empty fields).
  useEffect(() => {
    if (!customer) return;
    setForm((f) => ({
      name: f.name || customer.name,
      phone: f.phone || customer.phone,
      email: f.email || customer.email,
      address: f.address || customer.address || '',
    }));
  }, [customer]);

  if (authLoading) {
    return <div className="mx-auto max-w-md px-4 py-20 text-center text-muted">Loading…</div>;
  }
  if (!customer && items.length > 0) {
    // Guests must create an account (or log in) before checkout.
    return <Navigate to="/register?next=/checkout" replace />;
  }

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const needsAddress = items.some((i) => i.category === 'iphones');
  const paystackOn = settings?.paystack_enabled === 'true' && !!settings?.paystack_public_key;

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-md px-5 py-20 text-center">
        <h1 className="font-display text-3xl font-extrabold">Nothing to check out</h1>
        <p className="mt-3 text-muted">Add an item to your cart first.</p>
        <Link to="/shop" className="mt-6 inline-flex min-h-[52px] items-center rounded-full bg-forest px-6 font-bold text-lime">Browse the shop</Link>
      </div>
    );
  }

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Enter your name.';
    if (!/^[0-9+\s]{9,15}$/.test(form.phone.trim())) e.phone = 'Enter a phone number with at least 9 digits.';
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email.trim())) e.email = 'Enter a valid email, or leave it blank.';
    if (needsAddress && !form.address.trim()) e.address = 'Add a delivery address for your iPhone.';
    if (paystackOn && !method) e.method = 'Choose a payment method.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!validate()) return;
    if (paystackOn && method === 'paystack') {
      // The redirect needs a server endpoint that holds the secret key, which this client-only app cannot host yet.
      setFormError('Card and Mobile Money checkout is not active yet. Message us on WhatsApp to order.');
      return;
    }
    setBusy(true);
    try {
      // Paystack is off: the order is recorded as pending with the customer's details and nothing is charged.
      const order = await placeOrder({
        customer: { name: form.name.trim(), phone: form.phone.trim(), email: form.email.trim(), address: form.address.trim() },
        items: items.map((i) => ({ productId: i.productId, name: i.name, variant: i.variant, qty: i.qty })),
        method: paystackOn ? method : 'whatsapp',
        token: getCustomerToken(),
      });
      clearCart();
      navigate(`/order/${order.ref}`, { state: { fresh: true } });
    } catch (err) {
      setFormError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const field = (key, label, props = {}) => (
    <label className="grid gap-1.5 text-sm font-semibold">
      {label}
      <input
        {...props}
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        aria-invalid={!!errors[key]}
        aria-describedby={errors[key] ? `${key}-err` : undefined}
        className="min-h-[52px] rounded-xl border border-hairline bg-surface px-4 text-base font-normal outline-none focus:border-royal focus:ring-4 focus:ring-royal/20 aria-[invalid=true]:border-danger"
      />
      {errors[key] && <span id={`${key}-err`} className="text-sm font-semibold text-danger">{errors[key]}</span>}
    </label>
  );

  return (
    <form onSubmit={submit} noValidate className="mx-auto grid max-w-5xl gap-6 px-4 pt-5 md:grid-cols-[1fr_340px] md:px-6 md:pt-10">
      <div className="grid gap-6">
        <Link to="/cart" className="inline-flex min-h-[44px] w-fit items-center gap-2 font-semibold text-muted"><ArrowLeft size={18} aria-hidden="true" /> Cart</Link>
        <h1 className="font-display text-3xl font-extrabold md:text-4xl">Checkout</h1>

        <section className="grid gap-4 rounded-3xl border border-hairline bg-surface p-5 md:p-6">
          <h2 className="font-display text-xl font-bold">Your details</h2>
          {field('name', 'Full name', { autoComplete: 'name' })}
          {field('phone', 'Phone number', { type: 'tel', inputMode: 'tel', autoComplete: 'tel' })}
          {field('email', 'Email (optional)', { type: 'email', autoComplete: 'email' })}
          {needsAddress && field('address', 'Delivery address in Accra or nationwide', { autoComplete: 'street-address' })}
          {!needsAddress && <p className="text-sm text-muted">Subscriptions and gift cards are delivered by WhatsApp or email, so no address is needed.</p>}
        </section>

        <section aria-labelledby="pay" className="grid gap-4 rounded-3xl border border-hairline bg-surface p-5 md:p-6">
          {paystackOn ? (
            <>
              <h2 id="pay" className="font-display text-xl font-bold">How will you pay?</h2>
              <div role="radiogroup" aria-label="Payment method" className="grid gap-2 sm:grid-cols-2">
                <PayOption id="paystack" label="Pay with Mobile Money or Card" active={method} setMethod={setMethod} />
              </div>
              {errors.method && <p className="text-sm font-semibold text-danger">{errors.method}</p>}
            </>
          ) : (
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 380, damping: 36 }}
              className="grid gap-3 rounded-2xl bg-canvas p-4"
            >
              <h2 id="pay" className="font-display text-xl font-bold">Online payment opens soon</h2>
              <p className="text-sm text-muted">Message us on WhatsApp to order. Your details are saved as a pending order, and we confirm payment with you.</p>
              <a
                href={`${CONTACT.whatsappUrl}?text=${encodeURIComponent(`Hello, I want to order ${items.map((i) => `${i.qty} x ${i.name}${i.variant ? ` (${i.variant})` : ''}`).join(', ')}. Total ${money(subtotal)}.`)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-forest font-bold text-lime"
              >
                <WhatsappLogo size={20} weight="bold" aria-hidden="true" /> Message us on WhatsApp to order
              </a>
            </motion.div>
          )}
        </section>

        {formError && <p role="alert" className="rounded-2xl bg-red-50 p-4 font-semibold text-danger">{formError}</p>}
      </div>

      <aside className="h-fit rounded-3xl bg-forest p-6 text-white md:sticky md:top-24">
        <h2 className="font-display text-xl font-bold">Order summary</h2>
        <ul className="mt-4 grid gap-3">
          {items.map((i) => (
            <li key={`${i.productId}-${i.variant}`} className="flex justify-between gap-3 text-sm">
              <span className="text-white/85">{i.qty} × {i.name}{i.variant ? ` (${i.variant})` : ''}</span>
              <span className="tabular-nums">{money(i.price * i.qty)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-5 flex justify-between border-t border-white/15 pt-4">
          <span className="font-semibold">Total</span>
          <span className="font-display text-2xl font-extrabold tabular-nums text-lime">{money(subtotal)}</span>
        </div>
        <button type="submit" disabled={busy} className="mt-6 min-h-[56px] w-full rounded-full bg-lime font-bold text-forest transition-transform active:scale-[0.98] disabled:opacity-60">
          {busy ? 'Saving your order…' : paystackOn ? 'Continue to payment' : 'Place my order'}
        </button>
        <p className="mt-3 text-center text-xs text-white/70">Questions? WhatsApp {CONTACT.phone}</p>
      </aside>
    </form>
  );
}

function PayOption({ id, label, active, setMethod }) {
  const selected = active === id;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={() => setMethod(id)}
      className={`relative flex min-h-[56px] items-center gap-3 rounded-2xl border px-4 text-left font-semibold transition-colors ${selected ? 'border-forest bg-forest/5' : 'border-hairline bg-surface'}`}
    >
      {selected && <motion.span layoutId="pay-ring" className="absolute inset-0 rounded-2xl border-2 border-forest" transition={{ type: 'spring', stiffness: 520, damping: 38 }} />}
      <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${selected ? 'border-forest' : 'border-muted'}`}>
        {selected && <span className="h-2.5 w-2.5 rounded-full bg-forest" />}
      </span>
      <span className="relative">{label}</span>
      {selected && <CheckCircle size={20} weight="fill" className="relative ml-auto text-forest" aria-hidden="true" />}
    </button>
  );
}
