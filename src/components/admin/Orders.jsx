import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { MagnifyingGlass, X } from '@phosphor-icons/react';
import { api } from '../../lib/api.js';
import { money, adminToken } from '../../lib/store.js';

const loadOrders = (q) => api(`/admin/orders${q ? `?q=${encodeURIComponent(q)}` : ''}`, { token: adminToken() });

const ACTIONS = [
  { id: 'paid', label: 'Mark paid' },
  { id: 'delivered', label: 'Mark delivered' },
  { id: 'cancelled', label: 'Mark cancelled' },
];

export default function Orders() {
  const [query, setQuery] = useState('');
  const [term, setTerm] = useState('');
  const [data, setData] = useState(undefined);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const reload = () => setReloadKey((k) => k + 1);

  // Debounce typing so each keystroke doesn't hit the server; empty box returns the full list.
  useEffect(() => {
    const t = setTimeout(() => setTerm(query.trim()), 250);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    let live = true;
    setError('');
    loadOrders(term)
      .then((rows) => { if (live) setData(rows); })
      .catch((e) => { if (live) setError(e.message || 'Something went wrong.'); });
    return () => { live = false; };
  }, [term, reloadKey]);

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

  const searchBox = (
    <div className="relative">
      <MagnifyingGlass size={18} aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search order ID, tracking code, name, phone or WhatsApp"
        aria-label="Search orders"
        className="min-h-[44px] w-full rounded-full border border-hairline bg-surface py-2 pl-11 pr-11 text-sm outline-none focus:border-royal"
      />
      {query && (
        <button
          type="button"
          onClick={() => setQuery('')}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-muted hover:bg-canvas"
        >
          <X size={16} aria-hidden="true" />
        </button>
      )}
    </div>
  );

  if (error) return <div className="grid gap-4">{searchBox}<p role="alert" className="text-danger">{error}</p></div>;
  if (!data) return <div className="grid gap-4">{searchBox}<p className="text-muted" aria-busy="true">Loading orders…</p></div>;
  if (data.length === 0) {
    return (
      <div className="grid gap-4">
        {searchBox}
        <p className="rounded-2xl border border-dashed border-hairline p-8 text-center text-muted">
          {term ? `No orders match "${term}".` : 'No orders yet.'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {searchBox}
      {term && <p className="text-xs text-muted">{data.length} result{data.length === 1 ? '' : 's'} for "{term}"</p>}
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
