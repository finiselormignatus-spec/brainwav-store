import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { MagnifyingGlass, SlidersHorizontal, X } from '@phosphor-icons/react';
import ProductCard from '../components/ProductCard.jsx';
import { listProducts } from '../lib/store.js';

const CATS = [
  { id: 'all', label: 'All' },
  { id: 'iphones', label: 'iPhones' },
  { id: 'subscriptions', label: 'Subscriptions' },
  { id: 'other', label: 'Other' },
];

const SORTS = [
  { id: 'price-asc', label: 'Price: low to high' },
  { id: 'price-desc', label: 'Price: high to low' },
  { id: 'newest', label: 'Newest' },
];

// Stable, seeded shuffle keyed by product id, so every visitor sees the same order.
// Then a deterministic pass keeps variants of the same model from sitting side by side.
function hashStr(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function modelKey(p) {
  return `${p.name}`
    .replace(/\(.*?\)/g, '')
    .replace(/\b\d+\s*(GB|TB)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function spreadShuffle(list) {
  const seeded = [...list].sort((a, b) => hashStr(`shop:${a.id ?? a.slug ?? a.name}`) - hashStr(`shop:${b.id ?? b.slug ?? b.name}`));
  const out = [];
  const rest = [...seeded];
  while (rest.length) {
    const last = out.length ? modelKey(out[out.length - 1]) : null;
    let idx = rest.findIndex((p) => modelKey(p) !== last);
    if (idx === -1) idx = 0;
    out.push(rest.splice(idx, 1)[0]);
  }
  return out;
}

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState(null);
  const [error, setError] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const cat = params.get('cat') || 'all';
  const q = params.get('q') || '';
  const sort = params.get('sort') || 'newest';
  const max = params.get('max') || '';
  const inStock = params.get('stock') === '1';

  const load = () => {
    setError(false);
    setProducts(null);
    listProducts().then(setProducts).catch(() => setError(true));
  };

  useEffect(() => {
    load();
  }, []);

  const set = (key, value) => {
    const next = new URLSearchParams(params);
    if (value === '' || value === 'all' || value === false) next.delete(key);
    else next.set(key, value === true ? '1' : value);
    setParams(next, { replace: true });
  };

  const results = useMemo(() => {
    if (!products) return [];
    const needle = q.trim().toLowerCase();
    let list = products.filter((p) =>
      (cat === 'all' || p.category === cat) &&
      (!max || p.price <= Number(max)) &&
      (!inStock || p.stock > 0) &&
      (!needle || `${p.name} ${p.description} ${p.variant}`.toLowerCase().includes(needle)),
    );
    if (sort === 'newest') list = spreadShuffle(list);
    if (sort === 'price-asc') list = [...list].sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') list = [...list].sort((a, b) => b.price - a.price);
    return list;
  }, [products, cat, q, max, inStock, sort]);

  const filterCount = (max ? 1 : 0) + (inStock ? 1 : 0) + (sort !== 'newest' ? 1 : 0);

  return (
    <div className="mx-auto max-w-6xl px-4 pt-5 md:px-6 md:pt-10">
      <header className="flex flex-col gap-3 md:gap-4">
        <h1 className="font-display text-3xl font-extrabold md:text-4xl">Shop</h1>
        <label className="relative block">
          <span className="sr-only">Search products</span>
          <MagnifyingGlass size={20} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input
            type="search"
            value={q}
            onChange={(e) => set('q', e.target.value)}
            placeholder="Search iPhones, Netflix, Apple…"
            className="min-h-[52px] w-full rounded-2xl border border-hairline bg-surface pl-12 pr-4 text-base outline-none focus:border-royal focus:ring-4 focus:ring-royal/20"
          />
        </label>

        <div role="tablist" aria-label="Category" className="flex gap-2 overflow-x-auto pb-1">
          {CATS.map((c) => (
            <button
              key={c.id}
              role="tab"
              aria-selected={cat === c.id}
              onClick={() => set('cat', c.id)}
              className="relative min-h-[44px] shrink-0 rounded-full px-5 text-sm font-bold"
            >
              {cat === c.id && (
                <motion.span layoutId="cat-pill" className="absolute inset-0 rounded-full bg-forest" transition={{ type: 'spring', stiffness: 480, damping: 36 }} />
              )}
              <span className={`relative ${cat === c.id ? 'text-lime' : 'text-muted'}`}>{c.label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => setShowFilters((v) => !v)}
            aria-expanded={showFilters}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-hairline bg-surface px-4 text-sm font-semibold"
          >
            <SlidersHorizontal size={18} aria-hidden="true" /> Filters {filterCount > 0 && <span className="rounded-full bg-royal px-2 text-xs text-white">{filterCount}</span>}
          </button>
          {products && <p className="text-sm text-muted" aria-live="polite">{`${results.length} ${results.length === 1 ? 'item' : 'items'}`}</p>}
        </div>

        <AnimatePresence initial={false}>
          {showFilters && (
            <motion.div
              key="filters"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 380, damping: 36 }}
              className="overflow-hidden"
            >
              <div className="grid gap-4 rounded-2xl border border-hairline bg-surface p-4 md:grid-cols-3">
                <label className="grid gap-1 text-sm font-semibold">
                  Max price (GH₵)
                  <input type="number" min="0" inputMode="numeric" value={max} onChange={(e) => set('max', e.target.value)} placeholder="No limit" className="min-h-[48px] rounded-xl border border-hairline px-3 text-base font-normal" />
                </label>
                <label className="grid gap-1 text-sm font-semibold">
                  Sort by
                  <select value={sort} onChange={(e) => set('sort', e.target.value)} className="min-h-[48px] rounded-xl border border-hairline bg-surface px-3 text-base font-normal">
                    {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </label>
                <label className="flex min-h-[48px] items-center gap-3 self-end text-sm font-semibold">
                  <input type="checkbox" checked={inStock} onChange={(e) => set('stock', e.target.checked)} className="h-5 w-5 accent-royal" />
                  In stock only
                </label>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {error && (
        <div role="alert" className="mt-6 grid md:mt-8 justify-items-start gap-3 rounded-2xl bg-hairline p-5">
          <p className="font-semibold text-ink">We could not load the products.</p>
          <p className="text-sm text-muted">Check your connection, then try again.</p>
          <button onClick={load} className="inline-flex min-h-[48px] items-center rounded-full bg-forest px-6 font-bold text-lime">Retry</button>
        </div>
      )}

      {!error && products === null && (
        <div className="mt-4 grid grid-cols-2 gap-3 md:mt-6 md:grid-cols-3 lg:grid-cols-4" aria-hidden="true">
          {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="aspect-[4/5] animate-pulse rounded-2xl bg-hairline" />)}
        </div>
      )}

      {products && results.length === 0 && (
        <div className="mt-6 rounded-3xl border border-dashed border-hairline p-6 text-center md:mt-10 md:p-10">
          <p className="font-display text-xl font-bold">Nothing matches yet</p>
          <p className="mt-2 text-muted">Try another search or clear the filters.</p>
          <button onClick={() => setParams(new URLSearchParams(), { replace: true })} className="mt-5 inline-flex min-h-[48px] items-center gap-2 rounded-full bg-forest px-5 font-bold text-lime">
            <X size={16} weight="bold" aria-hidden="true" /> Clear all
          </button>
        </div>
      )}

      <ul className="mt-4 grid grid-cols-2 gap-3 md:mt-6 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
        {results.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
      </ul>
    </div>
  );
}
