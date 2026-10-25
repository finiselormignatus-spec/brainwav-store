import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useCustomer } from '../lib/useCustomer.js';
import { getCustomerOrders, updateCustomerProfile, logoutCustomer } from '../lib/customers.js';
import { money } from '../lib/store.js';

const STATUS = {
  pending: { label: 'Pending', tone: 'bg-royal/15 text-royal' },
  awaiting_payment: { label: 'Awaiting payment', tone: 'bg-royal/15 text-royal' },
  confirmed: { label: 'Confirmed', tone: 'bg-lime/50 text-forest' },
  paid: { label: 'Paid', tone: 'bg-lime/50 text-forest' },
  delivered: { label: 'Delivered', tone: 'bg-forest text-lime' },
  cancelled: { label: 'Cancelled', tone: 'bg-hairline text-muted' },
};

export default function Account() {
  const navigate = useNavigate();
  const { customer, loading, refresh } = useCustomer();
  const reduce = useReducedMotion();
  const [orders, setOrders] = useState(null);
  const [profile, setProfile] = useState({ phone: '', address: '' });
  const [saved, setSaved] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (loading) return;
    if (!customer) { navigate('/login?next=/account', { replace: true }); return; }
    setProfile({ phone: customer.phone, address: customer.address });
    getCustomerOrders(customer.id).then(setOrders).catch(() => setOrders([]));
  }, [customer, loading, navigate]);

  if (loading || !customer) {
    return <div className="mx-auto max-w-md px-4 py-20 text-center text-muted">Loading…</div>;
  }

  const saveProfile = async (e) => {
    e.preventDefault();
    setError(''); setSaved('');
    try {
      await updateCustomerProfile(customer.id, profile);
      setSaved('Saved.');
      refresh();
    } catch (err) {
      setError(err.message);
    }
  };

  const logout = async () => {
    await logoutCustomer();
    refresh();
    navigate('/', { replace: true });
  };

  return (
    <div className="mx-auto grid max-w-3xl gap-6 px-4 pt-5 md:px-6 md:pt-10">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-muted">Hi,</p>
          <h1 className="font-display text-3xl font-extrabold">{customer.name}</h1>
          <p className="text-sm text-muted">{customer.email}</p>
        </div>
        <button onClick={logout} className="min-h-[44px] rounded-full border border-hairline px-5 font-bold">Log out</button>
      </div>

      <section className="grid gap-4 rounded-3xl border border-hairline bg-surface p-5">
        <h2 className="font-display text-xl font-bold">Your orders</h2>
        {orders === null && <p className="text-muted">Loading orders…</p>}
        {orders && orders.length === 0 && (
          <div className="grid gap-3">
            <p className="text-muted">No orders yet.</p>
            <Link to="/shop" className="inline-flex min-h-[48px] w-fit items-center rounded-full bg-forest px-6 font-bold text-lime">Browse the shop</Link>
          </div>
        )}
        {orders && orders.map((o) => {
          const st = STATUS[o.status] || { label: o.status, tone: 'bg-hairline text-muted' };
          return (
            <motion.div key={o.ref} initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className="grid gap-2 rounded-2xl border border-hairline p-4">
              <div className="flex items-center justify-between gap-3">
                <Link to={`/order/${o.ref}`} className="font-mono font-bold text-royal">{o.ref}</Link>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${st.tone}`}>{st.label}</span>
              </div>
              <p className="text-sm text-muted">{o.items.map((i) => `${i.qty} × ${i.name}${i.variant ? ` (${i.variant})` : ''}`).join(', ')}</p>
              <p className="text-sm font-semibold tabular-nums">{money(o.total)}</p>
            </motion.div>
          );
        })}
      </section>

      <form onSubmit={saveProfile} className="grid gap-4 rounded-3xl border border-hairline bg-surface p-5">
        <h2 className="font-display text-xl font-bold">Delivery details</h2>
        <label className="grid gap-1.5 text-sm font-semibold">Phone number
          <input type="tel" inputMode="tel" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
            className="min-h-[52px] rounded-xl border border-hairline bg-surface px-4 text-base font-normal outline-none focus:border-royal focus:ring-4 focus:ring-royal/20" />
        </label>
        <label className="grid gap-1.5 text-sm font-semibold">Delivery address
          <input value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })}
            className="min-h-[52px] rounded-xl border border-hairline bg-surface px-4 text-base font-normal outline-none focus:border-royal focus:ring-4 focus:ring-royal/20" />
        </label>
        {error && <p role="alert" className="font-semibold text-danger">{error}</p>}
        {saved && <p role="status" className="font-semibold text-forest">{saved}</p>}
        <button type="submit" className="min-h-[52px] rounded-full bg-forest font-bold text-lime">Save details</button>
      </form>
    </div>
  );
}
