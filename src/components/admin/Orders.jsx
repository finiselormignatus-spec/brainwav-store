import { toast } from 'sonner';
import { api } from '../../lib/api.js';
import { money, adminToken } from '../../lib/store.js';
import useAsync from './useAsync.js';

const loadOrders = () => api('/admin/orders', { token: adminToken() });

const ACTIONS = [
  { id: 'paid', label: 'Mark paid' },
  { id: 'delivered', label: 'Mark delivered' },
  { id: 'cancelled', label: 'Mark cancelled' },
];

export default function Orders() {
  const { data, error, reload } = useAsync(loadOrders);

  const setStatus = async (o, status) => {
    // The server handles stock: cancelling returns reserved stock, reopening takes it again.
    try {
      await api(`/admin/orders/${o.id}`, { method: 'PATCH', body: { status }, token: adminToken() });
      toast(`Order ${o.ref} updated`);
      reload();
    } catch (e) {
      toast(e.message);
    }
  };

  if (error) return <p role="alert" className="text-danger">{error}</p>;
  if (!data) return <p className="text-muted" aria-busy="true">Loading orders…</p>;
  if (data.length === 0) {
    return <p className="rounded-2xl border border-dashed border-hairline p-8 text-center text-muted">No orders yet.</p>;
  }

  return (
    <div className="grid gap-3">
      {data.map((o) => {
        const items = o.items || [];
        return (
          <article key={o.id} className="grid gap-3 rounded-2xl border border-hairline bg-surface p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-mono font-medium">{o.ref}</p>
                <p className="text-xs text-muted">{o.created_at}</p>
              </div>
              <span className="rounded-full bg-canvas px-3 py-1 text-xs font-bold uppercase tracking-wide">{o.status}</span>
            </div>
            <p className="text-sm"><span className="font-semibold">{o.customer_name}</span> · {o.phone}{o.email ? ` · ${o.email}` : ''}</p>
            {o.address && <p className="text-sm text-muted">{o.address}</p>}
            <p className="text-sm text-muted">{items.map((i) => `${i.qty} × ${i.name}`).join(', ')}</p>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-display text-lg font-extrabold tabular-nums">{money(o.total)}</span>
              <span className="capitalize text-muted">via {o.payment_method}</span>
              {o.screenshot_name && <span className="rounded-full bg-royal/10 px-3 py-1 text-xs font-semibold text-royal">Screenshot: {o.screenshot_name}</span>}
            </div>
            <div className="flex flex-wrap gap-2">
              {ACTIONS.map((a) => (
                <button
                  key={a.id}
                  disabled={o.status === a.id}
                  onClick={() => setStatus(o, a.id)}
                  className="min-h-[44px] rounded-full border border-hairline px-4 text-sm font-semibold hover:bg-canvas disabled:opacity-40"
                >
                  {a.label}
                </button>
              ))}
            </div>
          </article>
        );
      })}
    </div>
  );
}
