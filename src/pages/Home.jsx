import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { CheckCircle, WhatsappLogo, Phone, ArrowRight, Package, Star, Truck, Lightning } from '@phosphor-icons/react';
import { useEffect, useRef, useState } from 'react';
import ProductCard from '../components/ProductCard.jsx';
import { listProducts, CONTACT, money } from '../lib/store.js';

const STATS = [
  { icon: Package, value: '100%', label: 'phones tested by hand' },
  { icon: Star, value: 'Up to 100%', label: 'battery health guaranteed' },
  { icon: Truck, value: 'Nationwide', label: 'delivery in Ghana' },
];

// Countdown to the end of the current week (Monday 00:00 local). Real timer, not a fixed fake one.
function endOfWeek() {
  const d = new Date();
  const daysToMon = ((8 - d.getDay()) % 7) || 7;
  d.setDate(d.getDate() + daysToMon);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}
function useCountdown(target) {
  const calc = () => Math.max(0, target - Date.now());
  const [ms, setMs] = useState(calc);
  useEffect(() => {
    const t = setInterval(() => setMs(calc()), 1000);
    return () => clearInterval(t);
  }, [target]);
  const s = Math.floor(ms / 1000);
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}
const pad = (n) => String(n).padStart(2, '0');

const SERVICES = [
  'Netflix Account', 'Apple Music', 'Snapchat Plus', 'Apple TV', 'iTunes E Codes', 'PIA S5',
  'Prime Video', 'Social Media Boost', 'Premium Telegram Account', 'All VPNs', 'Text Plus',
  'iCloud Storage', 'Spotify', 'All Apple Subscriptions', 'AT&T eSIM', 'Gift cards for games',
  'iSell / iRepair / iSwap iPhones',
];

const PROMISES = [
  'Brand New & UK Used iPhones',
  'Battery Health Guaranteed',
  'Face ID & True Tone Verified',
  'Nationwide Delivery',
];

const CATEGORIES = [
  { to: '/shop?cat=iphones', label: 'iPhones', hint: 'Brand New and UK Used', tone: 'bg-forest text-white' },
  { to: '/shop?cat=subscriptions', label: 'Subscriptions', hint: 'Netflix, Spotify, VPNs', tone: 'bg-royal text-white' },
];

export default function Home() {
  const reduce = useReducedMotion();
  const [featured, setFeatured] = useState([]);
  const [failed, setFailed] = useState(false);
  const [active, setActive] = useState(0);
  const rowRef = useRef(null);
  const [deal, setDeal] = useState(null);
  const endsAt = useRef(endOfWeek()).current;
  const cd = useCountdown(endsAt);

  const stepOf = (el) => (el.children[1] ? el.children[1].offsetLeft - el.children[0].offsetLeft : el.clientWidth);
  const onRowScroll = (e) => {
    const el = e.currentTarget;
    const step = stepOf(el) || 1;
    setActive(Math.min(Math.max(featured.length - 1, 0), Math.round(el.scrollLeft / step)));
  };
  const goTo = (i) => {
    const el = rowRef.current;
    if (!el) return;
    el.scrollTo({ left: i * stepOf(el), behavior: 'smooth' });
  };
  useEffect(() => {
    listProducts()
      .then((all) => {
        const phones = all.filter((p) => p.category === 'iphones');
        setFeatured(phones.slice(0, 4));
        setDeal(phones.find((p) => p.compare_price > p.price) || phones[0] || null);
      })
      .catch(() => setFailed(true));
  }, []);

  const fade = (delay = 0) => reduce
    ? {}
    : { initial: { opacity: 0, y: 16 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: '-40px' }, transition: { type: 'spring', stiffness: 260, damping: 30, delay } };

  return (
    <div className="mx-auto max-w-6xl">
      <section className="px-4 pt-4 md:hidden">
        <motion.div {...fade()} className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-forest via-forest to-[#0b1f14] p-6 text-white">
          <span className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-lime/10" aria-hidden="true" />
          <span className="relative w-fit rounded-full bg-lime px-3 py-1 font-mono text-[11px] font-medium uppercase tracking-wider text-forest">Accra, Ghana</span>
          <p className="relative mt-5 font-mono text-xs uppercase tracking-[0.2em] text-lime">Marc Brainwav</p>
          <h1 className="relative mt-1 font-display text-4xl font-extrabold leading-[1.02] tracking-tight">Premium Deals</h1>
          <p className="relative mt-3 text-lg font-bold text-lime">The plug of all phones</p>
          <p className="relative mt-2 text-sm leading-relaxed text-white/85">Genuine new and UK used iPhones, subscriptions and gift cards. Nationwide delivery.</p>
          <p className="relative mt-3 border-l-2 border-lime/60 pl-3 text-[13px] italic leading-relaxed text-white/75">Started in Accra with one phone on a folding table, and a promise to test every device before it is sold.</p>
          <div className="relative mt-5 grid gap-3">
            <Link to="/shop?cat=iphones" className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-lime px-6 font-bold text-forest">
              Shop iPhones <ArrowRight size={18} weight="bold" aria-hidden="true" />
            </Link>
            <a href={CONTACT.whatsappUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full border border-white/30 px-6 font-semibold text-white">
              <WhatsappLogo size={20} weight="bold" aria-hidden="true" /> Chat on WhatsApp
            </a>
          </div>
        </motion.div>
      </section>

      <section className="hidden px-4 pt-4 md:block md:px-6 md:pt-8">
        <motion.div {...fade()} className="relative overflow-hidden rounded-3xl bg-forest text-white md:grid md:grid-cols-2">
          <div className="flex flex-col justify-center gap-5 p-6 md:p-12">
            <span className="w-fit rounded-full bg-lime px-3 py-1 font-mono text-xs font-medium uppercase tracking-wider text-forest">Accra, Ghana</span>
            <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight md:text-5xl">
              Looking for a genuine iPhone at the best price?
            </h1>
            <p className="font-semibold text-lime">Brand New &amp; UK Used iPhones</p>
            <ul className="grid gap-2">
              {PROMISES.slice(1).map((p) => (
                <li key={p} className="flex items-center gap-2 text-sm text-white/90">
                  <CheckCircle size={18} weight="fill" className="shrink-0 text-lime" aria-hidden="true" />{p}
                </li>
              ))}
            </ul>
            <div className="mt-2 flex flex-wrap gap-3">
              <Link to="/shop?cat=iphones" className="inline-flex min-h-[52px] items-center gap-2 rounded-full bg-lime px-6 font-bold text-forest">
                Shop iPhones <ArrowRight size={18} weight="bold" aria-hidden="true" />
              </Link>
              <a href={CONTACT.whatsappUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-[52px] items-center gap-2 rounded-full border border-white/30 px-6 font-semibold text-white">
                <WhatsappLogo size={20} weight="bold" aria-hidden="true" /> Chat on WhatsApp
              </a>
            </div>
          </div>
          <div className="relative min-h-[260px] md:min-h-full">
            <img src="/marc-banners/banner-iphone.jpg" alt="Marc Brainwav Premium Deals iPhone banner" className="h-full w-full object-cover" />
          </div>
        </motion.div>
      </section>

      <section aria-label="Why shop with us" className="px-4 pt-4 md:px-6 md:pt-6">
        <motion.ul {...fade()} className="grid grid-cols-3 divide-x divide-hairline overflow-hidden rounded-2xl border border-hairline bg-surface">
          {STATS.map(({ icon: Icon, value, label }) => (
            <li key={label} className="flex flex-col items-center gap-1 px-2 py-3 text-center md:flex-row md:justify-center md:gap-2.5 md:py-4">
              <Icon size={20} weight="duotone" className="shrink-0 text-royal" aria-hidden="true" />
              <span className="font-display text-sm font-extrabold leading-tight md:text-base">{value}</span>
              <span className="text-[11px] leading-tight text-muted md:text-sm">{label}</span>
            </li>
          ))}
        </motion.ul>
      </section>

      <section aria-labelledby="cats" className="pt-6 md:px-6 md:pt-8">
        <h2 id="cats" className="sr-only">Shop by category</h2>
        <ul className="swipe-row -mx-0 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-1 md:mx-0 md:grid md:grid-cols-3 md:gap-3 md:overflow-visible md:p-0">
          {CATEGORIES.map((c, i) => (
            <motion.li key={c.to} {...fade(i * 0.05)} className="shrink-0 snap-start md:shrink">
              <Link to={c.to} className={`flex min-h-[56px] w-[72vw] max-w-[280px] items-center justify-between rounded-2xl p-4 md:min-h-[88px] md:w-auto md:max-w-none md:p-5 ${c.tone} transition-transform active:scale-[0.98]`}>
                <span>
                  <span className="block font-display text-xl font-extrabold">{c.label}</span>
                  <span className="text-sm opacity-80">{c.hint}</span>
                </span>
                <ArrowRight size={22} weight="bold" aria-hidden="true" />
              </Link>
            </motion.li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="featured" className="px-4 pt-8 md:px-6 md:pt-12">
        {deal && (
          <Link to={`/product/${deal.slug}`} className="mb-5 flex items-center gap-3 overflow-hidden rounded-2xl bg-forest p-3.5 text-white transition-transform active:scale-[0.99] md:mb-6 md:p-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-white/10 md:h-16 md:w-16">
              {deal.image_url ? <img src={deal.image_url} alt="" className="h-full w-full rounded-xl object-cover" /> : <span className="font-display text-sm font-extrabold text-lime">iPhone</span>}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5 font-mono text-[11px] font-medium uppercase tracking-wider text-lime"><Lightning size={14} weight="fill" aria-hidden="true" />Deals of the week</span>
              <span className="mt-0.5 block truncate font-display text-sm font-bold">{deal.name}</span>
              <span className="flex items-baseline gap-2 whitespace-nowrap">
                {deal.compare_price > deal.price && <span className="text-xs text-white/60 line-through tabular-nums">{money(deal.compare_price)}</span>}
                <span className="font-display text-base font-extrabold text-lime tabular-nums">{money(deal.price)}</span>
              </span>
            </span>
            <span className="shrink-0 text-right" aria-label={`Deal ends in ${cd.d} days ${cd.h} hours ${cd.m} minutes`}>
              <span className="block font-mono text-[10px] uppercase tracking-wider text-white/70">Ends in</span>
              <span className="font-mono text-sm font-bold tabular-nums">{cd.d}d {pad(cd.h)}:{pad(cd.m)}:{pad(cd.s)}</span>
            </span>
          </Link>
        )}
        <motion.figure {...fade()} className="mb-6 rounded-2xl border border-hairline bg-surface p-4 md:mb-8 md:p-6">
          <blockquote className="text-[15px] leading-relaxed text-ink md:text-base">
            <p>I started this shop because I was tired of people in Accra buying phones they could not trust. Every phone I sell is tested by hand before it leaves my hands, from the battery to Face ID.</p>
            <p className="mt-2">If anything is not right, call me personally. I would rather fix it than lose your trust.</p>
          </blockquote>
          <figcaption className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            <span className="font-display font-extrabold">— Marc, Founder</span>
            <a href={CONTACT.whatsappUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-semibold text-royal underline-offset-4 hover:underline"><WhatsappLogo size={16} weight="bold" aria-hidden="true" /> +233 59 548 4295</a>
          </figcaption>
        </motion.figure>

        <motion.div {...fade()} className="mb-4 flex items-end justify-between gap-4 md:mb-5">
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-royal">Featured</p>
            <h2 id="featured" className="font-display text-2xl font-extrabold md:text-3xl">Top iPhone picks</h2>
          </div>
          <Link to="/shop?cat=iphones" className="shrink-0 font-semibold text-royal underline-offset-4 hover:underline">See all</Link>
        </motion.div>
        {failed && <p role="alert" className="rounded-xl bg-hairline p-4 text-muted">We could not load products right now. Please refresh.</p>}
        {!failed && featured.length === 0 && (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => <div key={i} className="aspect-[4/5] animate-pulse rounded-2xl bg-hairline" />)}
          </div>
        )}
        <ul
          ref={rowRef}
          onScroll={onRowScroll}
          className="swipe-row -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-4 md:gap-4 md:overflow-visible md:p-0"
        >
          {featured.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} className="w-[45vw] max-w-[220px] shrink-0 snap-start md:w-auto md:max-w-none md:shrink" />
          ))}
        </ul>
        {featured.length > 1 && (
          <div className="mt-2 flex justify-center gap-1.5 md:hidden" aria-hidden="true">
            {featured.map((p, i) => (
              <button
                key={p.id}
                type="button"
                tabIndex={-1}
                onClick={() => goTo(i)}
                className={`h-1.5 rounded-full transition-all ${i === active ? 'w-5 bg-forest' : 'w-1.5 bg-hairline'}`}
                aria-label={`Show product ${i + 1}`}
              />
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="services" className="px-4 pt-8 md:px-6 md:pt-14">
        <motion.div {...fade()} className="overflow-hidden rounded-3xl bg-royal text-white md:grid md:grid-cols-5">
          <div className="p-5 md:col-span-2 md:p-10">
            <p className="font-mono text-xs uppercase tracking-wider text-lime">Services</p>
            <h2 id="services" className="mt-2 font-display text-2xl font-extrabold leading-tight md:text-3xl">Subscriptions, codes and phone services</h2>
            <p className="mt-2 text-white/85 md:mt-3">Ask on WhatsApp for any service below.</p>
            <div className="mt-5 flex flex-wrap gap-3 md:mt-6">
              <a href={CONTACT.whatsappUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-[52px] items-center gap-2 rounded-full bg-white px-6 font-bold text-navy">
                <WhatsappLogo size={20} weight="bold" aria-hidden="true" /> Order on WhatsApp
              </a>
              <Link to="/send-money" className="inline-flex min-h-[52px] items-center rounded-full border border-white/70 px-6 font-semibold text-white">Exchange</Link>
            </div>
          </div>
          <img src="/marc-banners/banner-services.jpg" alt="Marc Brainwav services banner" className="hidden h-28 w-full object-cover md:col-span-3 md:block md:h-full" />
        </motion.div>
        <ul className="mt-4 flex flex-wrap gap-1.5 md:mt-5 md:grid md:grid-cols-3 md:gap-2">
          {SERVICES.map((s, i) => (
            <motion.li key={s} {...fade(Math.min(i * 0.02, 0.3))} className="flex items-center gap-1.5 rounded-full border border-hairline bg-surface px-2.5 py-1.5 text-[13px] font-semibold leading-tight md:min-h-[52px] md:gap-3 md:rounded-xl md:px-4 md:py-2 md:text-base">
              <span className="h-2 w-2 shrink-0 rounded-full bg-royal md:h-2.5 md:w-2.5" aria-hidden="true" />{s}
            </motion.li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="contact" className="px-4 pt-8 pb-4 md:px-6 md:pt-14">
        <motion.div {...fade()} className="rounded-3xl border border-hairline bg-surface p-5 md:p-10">
          <h2 id="contact" className="font-display text-2xl font-extrabold">Your trust, our reputation</h2>
          <p className="mt-2 hidden text-muted md:block">Chat with us anytime, or call during business hours.</p>
          <div className="mt-4 flex flex-wrap gap-2 md:mt-5 md:gap-3">
            <a href={`tel:${CONTACT.phone}`} className="inline-flex min-h-[52px] items-center gap-2 rounded-full bg-forest px-6 font-bold text-lime"><Phone size={20} weight="bold" aria-hidden="true" /> {CONTACT.phone}</a>
            <Link to="/support" className="hidden min-h-[52px] items-center rounded-full border border-hairline px-6 font-semibold md:inline-flex">All contact options</Link>
            <Link to="/send-money" className="inline-flex min-h-[52px] items-center rounded-full border border-hairline px-6 font-semibold">Exchange</Link>
          </div>
        </motion.div>
      </section>

    </div>
  );
}
