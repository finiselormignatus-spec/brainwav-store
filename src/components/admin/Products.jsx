import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Plus, PencilSimple, Trash } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { api } from '../../lib/api.js';
import { money, adminToken } from '../../lib/store.js';
import useAsync from './useAsync.js';
import ProductForm from './ProductForm.jsx';

const loadProducts = () => api('/admin/products', { token: adminToken() });

const EMPTY = {
  id: null, name: '', slug: '', category: 'iphones', variant: '', description: '',
  price: 0, compare_price: '', stock: 0, image_url: '', active: 1, storage: '', condition: '', battery: '', color: '',
};

export default function Products() {
  const { data, error, reload } = useAsync(loadProducts);
  const [editing, setEditing] = useState(null);

  const remove = async (p) => {
    if (!window.confirm(`Delete ${p.name}? This cannot be undone.`)) return;
    try {
      await api(`/admin/products/${p.id}`, { method: 'DELETE', token: adminToken() });
      toast('Product deleted');
      reload();
    } catch (e) {
      toast(e.message);
    }
  };

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-muted">{data ? `${data.length} products` : 'Loading…'}</p>
        <button onClick={() => setEditing({ ...EMPTY })} className="inline-flex min-h-[48px] items-center gap-2 rounded-full bg-forest px-5 font-bold text-lime">
          <Plus size={18} weight="bold" aria-hidden="true" /> Add product
        </button>
      </div>
      {error && <p role="alert" className="text-danger">{error}</p>}
      <div className="overflow-x-auto rounded-2xl border border-hairline bg-surface">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-canvas text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="p-3">Name</th><th className="p-3">Category</th><th className="p-3">Price</th>
              <th className="p-3">Stock</th><th className="p-3">Active</th><th className="p-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {(data || []).map((p) => (
              <tr key={p.id} className="border-t border-hairline">
                <td className="p-3 font-semibold">{p.name}<span className="block text-xs font-normal text-muted">{p.variant}</span></td>
                <td className="p-3">{p.category}</td>
                <td className="p-3 tabular-nums">{money(p.price)}</td>
                <td className="p-3 tabular-nums">{p.stock}</td>
                <td className="p-3">{p.active ? 'Yes' : 'No'}</td>
                <td className="p-3">
                  <div className="flex justify-end gap-1">
                    <button aria-label={`Edit ${p.name}`} onClick={() => setEditing({ ...p, battery: p.battery ?? '', compare_price: p.compare_price ?? '' })} className="grid h-11 w-11 place-items-center rounded-full hover:bg-hairline"><PencilSimple size={18} aria-hidden="true" /></button>
                    <button aria-label={`Delete ${p.name}`} onClick={() => remove(p)} className="grid h-11 w-11 place-items-center rounded-full text-danger hover:bg-red-50"><Trash size={18} aria-hidden="true" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <AnimatePresence>
        {editing && (
          <ProductForm
            key="form"
            value={editing}
            onClose={() => setEditing(null)}
            onSaved={() => { setEditing(null); reload(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
