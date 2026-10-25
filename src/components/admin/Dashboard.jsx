import { motion } from 'framer-motion';
import { api } from '../../lib/api.js';
import { money, adminToken } from '../../lib/store.js';
import useAsync from './useAsync.js';

const loadSummary = () => api('/admin/summary', { token: adminToken() });

export default function Dashboard() {
  const { data, error } = useAsync(loadSummary);

  if (error) return <p role="alert" className="text-danger">{error}</p>;
  if (!data) {
    return (
      <div className="grid gap-3 sm:grid-cols-3" aria-busy="true">
        {[0, 1, 2].map((i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-hairline" />)}
      </div>
    );
  }

  const cards = [
    { label: 'Orders today', value: Number(data.orders_today || 0) },
    { label: 'Sales today', value: money(data.sales_today || 0) },
    { label: 'Pending orders', value: Number(data.pending || 0) },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {cards.map((c) => (
        <div key={c.label} className="rounded-2xl border border-hairline bg-surface p-5">
          <p className="text-sm font-semibold text-muted">{c.label}</p>
          <motion.p
            key={String(c.value)}
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            className="mt-2 font-display text-3xl font-extrabold tabular-nums"
          >
            {c.value}
          </motion.p>
        </div>
      ))}
    </div>
  );
}
