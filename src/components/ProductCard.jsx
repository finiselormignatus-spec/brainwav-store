import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { money, stockLabel } from '../lib/store.js';

const toneClass = {
  in: 'bg-lime/40 text-forest',
  low: 'bg-amber-200 text-ink',
  out: 'bg-hairline text-muted',
};

// Phone health pills. Battery reads green at 85%+, amber below. Condition is always shown for iPhones.
function IphonePills({ product }) {
  const hasBattery = product.battery !== null && product.battery !== undefined && product.battery !== '';
  const healthy = hasBattery && Number(product.battery) >= 85;
  const isNew = /brand new/i.test(product.condition || '');
  if (!product.condition && !hasBattery) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {product.condition && (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold leading-4 ${isNew ? 'bg-forest text-lime' : 'bg-navy text-white'}`}>
          {product.condition}
        </span>
      )}
      {hasBattery && (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold leading-4 tabular-nums ${healthy ? 'bg-lime/40 text-forest' : 'bg-amber-200 text-ink'}`}>
          Battery {Math.round(Number(product.battery))}%
        </span>
      )}
    </div>
  );
}

export default function ProductCard({ product, index = 0, className = '' }) {
  const reduce = useReducedMotion();
  const stock = stockLabel(product.stock);
  return (
    <motion.li
      className={className}
      initial={reduce ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 30, delay: Math.min(index * 0.04, 0.4) }}
    >
      <Link
        to={`/product/${product.slug}`}
        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-hairline bg-surface transition-transform duration-200 active:scale-[0.98]"
      >
        <div className={`relative grid aspect-square place-items-center p-2 md:p-3 ${product.category === 'iphones' ? 'bg-forest' : 'bg-royal'}`}>
          {product.image_url ? (
            <img src={product.image_url} alt="" className="h-full w-full object-contain" loading="lazy" />
          ) : (
            <span className="font-display text-3xl font-extrabold text-lime/90">
              {product.category === 'iphones' ? 'iPhone' : product.category === 'giftcards' ? 'Gift' : 'Plan'}
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-1.5 p-3 md:gap-2 md:p-4">
          <h3 className="font-display text-base font-bold leading-snug">{product.name}</h3>
          {product.category === 'iphones' ? <IphonePills product={product} /> : product.variant && <p className="text-sm text-muted">{product.variant}</p>}
          {product.rating != null && (
            <p className="flex items-center gap-1.5 text-xs font-semibold text-muted" aria-label={`Rated ${Number(product.rating).toFixed(1)} out of 5 from ${product.review_count || 0} reviews`}>
              <span className="text-forest">★ {Number(product.rating).toFixed(1)}</span>
              <span>({product.review_count || 0} reviews)</span>
            </p>
          )}
          <div className="mt-auto flex items-end justify-between gap-2 pt-1.5 md:pt-2">
            <span className="flex flex-col whitespace-nowrap leading-tight">
              {product.compare_price > product.price && (
                <span className="text-xs font-semibold text-muted line-through tabular-nums">{money(product.compare_price)}</span>
              )}
              <span className="font-display text-lg font-extrabold tabular-nums">{money(product.price)}</span>
            </span>
            <span className={`whitespace-nowrap rounded-full px-2 py-1 text-[11px] font-semibold md:text-xs md:px-2.5 ${toneClass[stock.tone]}`}>{stock.text}</span>
          </div>
        </div>
      </Link>
    </motion.li>
  );
}
