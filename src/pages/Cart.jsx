import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Minus, Plus, Trash, ArrowRight, Truck } from '@phosphor-icons/react';
import { readCart, money } from '../lib/store.js';
import { updateQty, removeLine } from '../lib/cart.js';

export default function Cart() {
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const [items, setItems] = useState(readCart);

  useEffect(() => {
    const sync = () => setItems(readCart());
    window.addEventListener('cart-change', sync);
    return () => window.removeEventListener('cart-change', sync);
  }, []);

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const hasIphone = items.some((i) => i.category === 'iphones');
  const key = (i) => `${i.productId}::${i.variant}`;

  return (
    <div className="mx-auto max-w-5xl px-4 pt-5 md:px-6 md:pt-10">
      <h1 className="font-display text-3xl font-extrabold md:text-4xl">Your cart</h1>

      {items.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-dashed border-hairline bg-surface p-6 text-center md:mt-8 md:p-10">
          <p className="font-display text-xl font-bold">Your cart is lonely. Grab a deal.</p>
          <p className="mt-2 text-muted">Pick an iPhone, a subscription or a gift card and we will take it from there.</p>
          <Link to="/shop" className="mt-6 inline-flex min-h-[52px] items-center gap-2 rounded-full bg-forest px-6 font-bold text-lime">Browse the shop</Link>
        </div>
      ) : (
        <div className="mt-4 grid gap-4 md:mt-6 md:grid-cols-[1fr_340px] md:gap-6">
          <ul className="grid content-start gap-3">
            <AnimatePresence initial={false}>
              {items.map((item) => (
                <motion.li
                  key={key(item)}
                  layout
                  initial={reduce ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, x: -40, height: 0, marginBottom: 0 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 34 }}
                  className="flex gap-4 overflow-hidden rounded-2xl border border-hairline bg-surface p-4"
                >
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="h-20 w-20 shrink-0 rounded-xl border border-hairline bg-white object-contain p-1" />
                  ) : (
                    <div className={`grid h-20 w-20 shrink-0 place-items-center rounded-xl ${item.category === 'iphones' ? 'bg-forest' : 'bg-royal'}`}>
                      <span className="font-display text-sm font-extrabold text-lime">{item.category === 'iphones' ? 'iPhone' : 'Item'}</span>
                    </div>
                  )}
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-bold">{item.name}</p>
                        <p className="text-sm text-muted">{item.variant}</p>
                      </div>
                      <button aria-label={`Remove ${item.name}`} onClick={() => removeLine(item.productId, item.variant)} className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-muted hover:bg-hairline hover:text-danger">
                        <Trash size={20} aria-hidden="true" />
                      </button>
                    </div>
                    <div className="mt-auto flex items-center justify-between gap-3">
                      <div className="flex items-center gap-1 rounded-full border border-hairline p-1" role="group" aria-label={`Quantity for ${item.name}`}>
                        <button aria-label="Decrease quantity" onClick={() => updateQty(item.productId, item.variant, item.qty - 1)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-hairline"><Minus size={16} aria-hidden="true" /></button>
                        <span className="w-8 text-center font-bold tabular-nums" aria-live="polite">{item.qty}</span>
                        <button aria-label="Increase quantity" disabled={item.qty >= item.stock} onClick={() => updateQty(item.productId, item.variant, Math.min(item.stock, item.qty + 1))} className="grid h-10 w-10 place-items-center rounded-full hover:bg-hairline disabled:opacity-40"><Plus size={16} aria-hidden="true" /></button>
                      </div>
                      <span className="font-display font-extrabold tabular-nums">{money(item.price * item.qty)}</span>
                    </div>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>

          <aside aria-label="Order summary" className="h-fit rounded-3xl bg-forest p-5 text-white md:p-6 md:sticky md:top-24">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white/80">Subtotal</span>
              <motion.span key={subtotal} initial={reduce ? false : { y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="font-display text-2xl font-extrabold tabular-nums text-lime">{money(subtotal)}</motion.span>
            </div>
            <p className="mt-4 flex gap-2 rounded-2xl bg-white/10 p-3 text-sm text-white/90">
              <Truck size={20} className="shrink-0 text-lime" aria-hidden="true" />
              {hasIphone ? 'Delivery is arranged after checkout. Nationwide delivery is available for iPhones.' : 'Subscriptions and gift cards are delivered digitally by WhatsApp or email.'}
            </p>
            <button onClick={() => navigate('/checkout')} className="mt-6 inline-flex min-h-[56px] w-full items-center justify-center gap-2 rounded-full bg-lime font-bold text-forest transition-transform active:scale-[0.98]">
              Continue to checkout <ArrowRight size={18} weight="bold" aria-hidden="true" />
            </button>
          </aside>
        </div>
      )}
    </div>
  );
}
