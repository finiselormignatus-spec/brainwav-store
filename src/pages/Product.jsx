import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Minus, Plus, ArrowLeft, Check } from '@phosphor-icons/react';
import { getProductBySlug, listProducts, money, stockLabel } from '../lib/store.js';
import { addToCart } from '../lib/cart.js';
import { toast } from 'sonner';

const baseName = (p) => (p.category === 'subscriptions' ? p.name.split(' · ')[0] : p.name);

// Variants for one product: iPhones share a name and differ by condition, subscriptions by plan tier.
// Each sibling is its own DB row, so the variant string is the key that goes into the cart.
export default function Product() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const [product, setProduct] = useState(undefined);
  const [siblings, setSiblings] = useState([]);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setProduct(undefined);
    setQty(1);
    getProductBySlug(slug)
      .then(async (p) => {
        setProduct(p || null);
        if (p) {
          const all = await listProducts();
          const base = baseName(p);
          setSiblings(all.filter((x) => x.category === p.category && baseName(x) === base));
        }
      })
      .catch(() => setProduct(null));
  }, [slug]);

  if (product === undefined) {
    return <div className="mx-auto max-w-5xl px-4 py-10" aria-busy="true"><div className="h-80 animate-pulse rounded-3xl bg-hairline" /></div>;
  }
  if (product === null) {
    return (
      <div className="mx-auto max-w-md px-5 py-20 text-center">
        <h1 className="font-display text-3xl font-extrabold">Product not found</h1>
        <Link to="/shop" className="mt-6 inline-flex min-h-[48px] items-center rounded-full bg-forest px-6 font-bold text-lime">Back to shop</Link>
      </div>
    );
  }

  const stock = stockLabel(product.stock);
  const isIphone = product.category === 'iphones';
  const maxQty = Math.max(product.stock, 0);
  const safeQty = Math.min(qty, maxQty || 1);

  const handleAdd = () => {
    if (product.stock <= 0) return setError('This item is out of stock.');
    setError('');
    addToCart({
      productId: product.id, slug: product.slug, name: product.name, variant: product.variant,
      price: product.price, qty: safeQty, stock: product.stock, category: product.category,
      condition: product.condition, battery: product.battery, storage: product.storage,
    });
    setAdded(true);
    toast('Added to your cart');
    setTimeout(() => setAdded(false), 1800);
  };

  const buyNow = () => {
    handleAdd();
    if (product.stock > 0) navigate('/checkout');
  };

  return (
    <div className="mx-auto max-w-6xl px-4 pt-4 md:px-6 md:pt-10">
      <button onClick={() => navigate(-1)} className="mb-4 inline-flex min-h-[44px] items-center gap-2 font-semibold text-muted">
        <ArrowLeft size={18} aria-hidden="true" /> Back
      </button>
      <div className="grid gap-4 md:grid-cols-2 md:gap-10">
        <motion.div
          layoutId={`product-${product.slug}`}
          className={`grid aspect-square place-items-center overflow-hidden rounded-3xl p-4 md:p-8 bg-transparent`}
        >
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="h-full w-full object-contain" />
          ) : (
            <span className={`font-display text-5xl font-extrabold ${isIphone ? 'text-forest' : 'text-royal'}`}>{isIphone ? 'iPhone' : product.category === 'giftcards' ? 'Gift' : 'Plan'}</span>
          )}
        </motion.div>

        <div className="flex flex-col gap-4 md:gap-5">
          <div>
            <h1 className="font-display text-3xl font-extrabold leading-tight md:text-4xl">{product.name}</h1>
            <motion.p key={product.price} initial={reduce ? false : { y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 32 }} className="mt-2 font-display text-2xl font-extrabold tabular-nums text-royal">
              {money(product.price)}
            </motion.p>
          </div>

          {siblings.length > 1 && (
            <fieldset className="grid gap-2">
              <legend className="mb-2 text-sm font-semibold">{isIphone ? 'Condition' : 'Plan'}</legend>
              <div className="flex flex-wrap gap-2">
                {siblings.map((s) => {
                  const active = s.id === product.id;
                  return (
                    <Link key={s.id} to={`/product/${s.slug}`} aria-current={active ? 'true' : undefined}
                      className={`relative min-h-[48px] rounded-xl border px-4 py-2 text-sm font-semibold ${active ? 'border-forest text-forest' : 'border-hairline text-muted'}`}>
                      {active && <motion.span layoutId="variant-ring" className="absolute inset-0 rounded-xl border-2 border-forest" transition={{ type: 'spring', stiffness: 520, damping: 38 }} />}
                      <span className="relative">{s.condition || s.variant}</span>
                    </Link>
                  );
                })}
              </div>
            </fieldset>
          )}

          <dl className="grid grid-cols-2 gap-3 text-sm">
            {isIphone && product.storage && <Spec label="Storage" value={product.storage} />}
            {isIphone && product.condition && <Spec label="Condition" value={product.condition} />}
            {isIphone && product.battery != null && <Spec label="Battery health" value={`${product.battery}%`} />}
            {isIphone && product.color && <Spec label="Colour" value={product.color} />}
            <Spec label="Availability" value={stock.text} />
          </dl>

          <p className="leading-relaxed text-muted">{product.description}</p>

          {product.stock > 0 && (
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold">Quantity</span>
              <div className="flex items-center gap-1 rounded-full border border-hairline p-1" role="group" aria-label="Quantity">
                <button aria-label="Decrease quantity" onClick={() => setQty(Math.max(1, safeQty - 1))} className="grid h-11 w-11 place-items-center rounded-full hover:bg-hairline"><Minus size={18} aria-hidden="true" /></button>
                <motion.span key={safeQty} initial={reduce ? false : { y: -6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-10 text-center font-bold tabular-nums" aria-live="polite">{safeQty}</motion.span>
                <button aria-label="Increase quantity" onClick={() => setQty(Math.min(maxQty, safeQty + 1))} disabled={safeQty >= maxQty} className="grid h-11 w-11 place-items-center rounded-full hover:bg-hairline disabled:opacity-40"><Plus size={18} aria-hidden="true" /></button>
              </div>
            </div>
          )}

          {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-danger">{error}</p>}

          <div className="grid gap-3 sm:grid-cols-2">
            <button onClick={handleAdd} disabled={product.stock <= 0} className="relative min-h-[56px] overflow-hidden rounded-full bg-forest px-6 font-bold text-lime transition-transform active:scale-[0.98] disabled:opacity-40">
              <span className="inline-flex items-center gap-2">
                {added ? <><Check size={20} weight="bold" aria-hidden="true" /> Added</> : 'Add to cart'}
              </span>
            </button>
            <button onClick={buyNow} disabled={product.stock <= 0} className="min-h-[56px] rounded-full bg-royal px-6 font-bold text-white transition-transform active:scale-[0.98] disabled:opacity-40">
              Buy now
            </button>
          </div>
          <ul className="grid gap-1.5 text-sm font-semibold text-forest" aria-label="Delivery and guarantee">
            <li className="flex items-center gap-2">Confirm delivery details with us on WhatsApp.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function Spec({ label, value }) {
  return (
    <div className="rounded-xl border border-hairline bg-surface p-3">
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-1 font-bold">{value}</dd>
    </div>
  );
}
