import { useEffect, useState } from 'react';
import { useParams, useLocation, Link, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { CheckCircle, MagnifyingGlass, WhatsappLogo } from '@phosphor-icons/react';
import { getOrder, money, CONTACT } from '../lib/store.js';

const STATUS = {
  pending: { label: 'Pending', tone: 'bg-royal/15 text-royal', note: 'Your order is in the queue. We will confirm shortly.' },
  paid: { label: 'Paid', tone: 'bg-lime/50 text-forest', note: 'Payment confirmed. We are preparing your order.' },
  delivered: { label: 'Delivered', tone: 'bg-forest text-lime', note: 'Delivered. Thank you for trusting us.' },
  cancelled: { label: 'Cancelled', tone: 'bg-hairline text-muted', note: 'This order was cancelled. Contact us if you have questions.' },
};

export default function Order() {
  const { ref } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const [order, setOrder] = useState(undefined);
  const [lookup, setLookup] = useState('');
  const fresh = !!location.state?.fresh;

  useEffect(() => {
    if (!ref) return setOrder(null);
    setOrder(undefined);
    getOrder(ref).then((o) => setOrder(o || null)).catch(() => setOrder(null));
  }, [ref]);

  const lookupForm = (
    <form className="mt-6 grid gap-3 sm:flex" onSubmit={(e) => { e.preventDefault(); if (lookup.trim()) navigate(`/order/${lookup.trim().toUpperCase()}`); }}>
      <label className="sr-only" htmlFor="ref">Order reference</label>
      <input id="ref" value={lookup} onChange={(e) => setLookup(e.target.value)} placeholder="MBPD-XXXXX" className="min-h-[52px] flex-1 rounded-xl border border-hairline bg-surface px-4 font-mono uppercase outline-none focus:border-royal focus:ring-4 focus:ring-royal/20" />
      <button className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-forest px-6 font-bold text-lime"><MagnifyingGlass size={18} aria-hidden="true" /> Look up</button>
    </form>
  );

  if (!ref) {
    return <div className="mx-auto max-w-lg px-4 py-10"><h1 className="font-display text-3xl font-extrabold">Find your order</h1><p className="mt-2 text-muted">Enter the reference from your confirmation.</p>{lookupForm}</div>;
  }
  if (order === undefined) {
    return <div className="mx-auto max-w-2xl px-4 py-10" aria-busy="true"><div className="h-72 animate-pulse rounded-3xl bg-hairline" /></div>;
  }
  if (order === null) {
    return (
      <div className="mx-auto max-w-lg px-4 py-10">
        <h1 className="font-display text-3xl font-extrabold">No order named {ref}</h1>
        <p className="mt-2 text-muted">Check the reference and try again, or contact us on WhatsApp.</p>
        {lookupForm}
      </div>
    );
  }

  const st = STATUS[order.status] || STATUS.pending;
  return (
    <div className="mx-auto max-w-2xl px-4 pt-5 md:pt-10">
      <motion.section
        initial={reduce ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="rounded-3xl border border-hairline bg-surface p-6 md:p-8"
      >
        {fresh && (
          <motion.div initial={reduce ? false : { scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 420, damping: 16 }} className="mb-4 grid h-14 w-14 place-items-center rounded-full bg-lime text-forest">
            <CheckCircle size={32} weight="fill" aria-hidden="true" />
          </motion.div>
        )}
        <p className="font-mono text-sm text-muted">Reference</p>
        <h1 className="font-mono text-3xl font-medium tracking-wide">{order.ref}</h1>
        <span className={`mt-4 inline-flex rounded-full px-3 py-1 text-sm font-bold ${st.tone}`}>{st.label}</span>
        <p className="mt-3 text-muted">{st.note}</p>

        <h2 className="mt-8 font-display text-lg font-bold">Items</h2>
        <ul className="mt-3 divide-y divide-hairline">
          {order.items.map((i, idx) => (
            <li key={idx} className="flex justify-between gap-3 py-3 text-sm">
              <span>{i.qty} × {i.name}{i.variant ? ` (${i.variant})` : ''}</span>
              <span className="font-semibold tabular-nums">{money(i.price * i.qty)}</span>
            </li>
          ))}
        </ul>
        <div className="flex justify-between border-t border-hairline pt-4">
          <span className="font-semibold">Total</span>
          <span className="font-display text-2xl font-extrabold tabular-nums">{money(order.total)}</span>
        </div>


        <a href={`${CONTACT.whatsappUrl}?text=${encodeURIComponent(`Hello, my order ${order.ref}`)}`} target="_blank" rel="noreferrer" className="mt-6 inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-forest font-bold text-lime">
          <WhatsappLogo size={20} weight="bold" aria-hidden="true" /> Confirm on WhatsApp
        </a>
      </motion.section>
      <p className="mt-6 text-center"><Link to="/shop" className="font-semibold text-royal underline-offset-4 hover:underline">Keep shopping</Link></p>
    </div>
  );
}
