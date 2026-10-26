import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { api } from '../../lib/api.js';
import { slugify, adminToken } from '../../lib/store.js';

// Picks a JPG/PNG/WebP from the phone's gallery or camera, previews it, and uploads it.
// The returned /uploads/... path is what gets saved into image_url.
function ImageField({ value, onChange, onError }) {
  const [localPreview, setLocalPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const shown = localPreview || value;

  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return onError('Choose a JPG, PNG or WebP image.');
    if (file.size > 5 * 1024 * 1024) return onError('That image is too big. Keep it under 5MB.');
    onError('');
    setLocalPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const body = new FormData();
      body.append('file', file);
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken()}` },
        body,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Upload failed (${res.status}).`);
      onChange(data.url);
    } catch (err) {
      setLocalPreview('');
      onError(err.message || 'Upload failed. Try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="grid gap-2">
      <span className="text-sm font-semibold">Product photo</span>
      <div className="flex items-center gap-3">
        <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-xl border border-hairline bg-canvas">
          {shown ? <img src={shown} alt="Product preview" className="h-full w-full object-cover" /> : <span className="text-xs text-muted">No photo</span>}
        </div>
        <div className="grid flex-1 gap-2">
          <label className={`grid min-h-[46px] cursor-pointer place-items-center rounded-full bg-royal px-4 font-bold text-white ${uploading ? 'opacity-60' : ''}`}>
            {uploading ? 'Uploading…' : shown ? 'Change photo' : 'Choose photo'}
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={pick} disabled={uploading} className="sr-only" />
          </label>
          {value && !uploading && (
            <button type="button" onClick={() => { setLocalPreview(''); onChange(''); }} className="text-sm font-semibold text-danger">Remove photo</button>
          )}
        </div>
      </div>
      <p className="text-xs text-muted">JPG, PNG or WebP, up to 5MB. Pick from your gallery or take a new one.</p>
    </div>
  );
}

export default function ProductForm({ value, onClose, onSaved }) {
  const [f, setF] = useState(value);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const isIphone = f.category === 'iphones';

  const set = (k) => (e) => {
    const v = e.target.type === 'checkbox' ? (e.target.checked ? 1 : 0) : e.target.value;
    setF((prev) => ({ ...prev, [k]: v }));
  };

  const save = async (e) => {
    e.preventDefault();
    setErr('');
    if (!f.name.trim()) return setErr('Enter a product name.');
    setBusy(true);
    const slug = (f.slug || slugify(`${f.name} ${f.variant}`)).trim();
    const body = {
      slug, name: f.name.trim(), category: f.category, variant: f.variant || '', description: f.description || '',
      price: Number(f.price) || 0,
      compare_price: f.compare_price === '' || f.compare_price === null || f.compare_price === undefined ? null : Number(f.compare_price),
      stock: Math.max(0, Number(f.stock) || 0), image_url: f.image_url || '',
      active: f.active ? 1 : 0,
      storage: isIphone ? f.storage || '' : '', condition: isIphone ? f.condition || '' : '',
      battery: isIphone && f.battery !== '' && f.battery !== null ? Number(f.battery) : null,
      color: isIphone ? f.color || '' : '',
    };
    try {
      if (f.id) await api(`/admin/products/${f.id}`, { method: 'PUT', body, token: adminToken() });
      else await api('/admin/products', { method: 'POST', body, token: adminToken() });
      toast('Product saved');
      onSaved();
    } catch (e2) {
      setErr(/UNIQUE/i.test(e2.message) ? 'That slug is already used. Change it and try again.' : e2.message);
    } finally {
      setBusy(false);
    }
  };

  const input = (label, key, props = {}) => (
    <label className="grid gap-1 text-sm font-semibold">
      {label}
      <input {...props} value={f[key] ?? ''} onChange={set(key)} className="min-h-[46px] rounded-xl border border-hairline px-3 text-base font-normal" />
    </label>
  );

  return (
    <motion.div
      className="fixed inset-0 z-50 grid place-items-end bg-ink/40 sm:place-items-center sm:p-6"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.form
        role="dialog"
        aria-modal="true"
        aria-label={f.id ? 'Edit product' : 'Add product'}
        onSubmit={save}
        onClick={(e) => e.stopPropagation()}
        initial={{ y: 80 }} animate={{ y: 0 }} exit={{ y: 80 }}
        transition={{ type: 'spring', stiffness: 360, damping: 34 }}
        className="grid max-h-[92vh] w-full max-w-lg gap-3 overflow-y-auto rounded-t-3xl bg-surface p-5 sm:rounded-3xl"
      >
        <h2 className="font-display text-xl font-extrabold">{f.id ? 'Edit product' : 'Add product'}</h2>
        {input('Name', 'name', { required: true })}
        {input('Slug (leave blank to generate)', 'slug')}
        <label className="grid gap-1 text-sm font-semibold">
          Category
          <select value={f.category} onChange={set('category')} className="min-h-[46px] rounded-xl border border-hairline bg-surface px-3 font-normal">
            <option value="iphones">iPhones</option>
            <option value="laptops">Laptops</option>
            <option value="subscriptions">Subscriptions</option>
            <option value="giftcards">Gift Cards</option>
            <option value="other">Other</option>
          </select>
        </label>
        {input('Variant (e.g. UK Used · Battery 85%, or 1 month)', 'variant')}
        <label className="grid gap-1 text-sm font-semibold">
          Description
          <textarea value={f.description ?? ''} onChange={set('description')} rows={3} className="rounded-xl border border-hairline p-3 font-normal" />
        </label>
        <div className="grid grid-cols-2 gap-3">
          {input('Price (GH₵)', 'price', { type: 'number', min: 0, inputMode: 'numeric' })}
          {input('Was price (GH₵, optional)', 'compare_price', { type: 'number', min: 0, inputMode: 'numeric', placeholder: 'Shows struck through' })}
          {input('Stock quantity', 'stock', { type: 'number', min: 0, inputMode: 'numeric' })}
        </div>
        <ImageField
          value={f.image_url || ''}
          onChange={(url) => setF((prev) => ({ ...prev, image_url: url }))}
          onError={setErr}
        />
        <label className="grid gap-1 text-sm font-semibold">
          or paste image link
          <input
            type="url"
            value={f.image_url?.startsWith('/uploads/') ? '' : f.image_url ?? ''}
            placeholder="https://..."
            onChange={(e) => setF((prev) => ({ ...prev, image_url: e.target.value }))}
            className="min-h-[46px] rounded-xl border border-hairline px-3 text-base font-normal"
          />
        </label>
        {isIphone && (
          <fieldset className="grid grid-cols-2 gap-3 rounded-2xl bg-canvas p-3">
            <legend className="px-1 text-sm font-bold">iPhone details</legend>
            {input('Storage', 'storage', { placeholder: '128GB' })}
            <label className="grid gap-1 text-sm font-semibold">
              Condition
              <select value={f.condition} onChange={set('condition')} className="min-h-[46px] rounded-xl border border-hairline bg-surface px-3 font-normal">
                <option value="">Choose</option>
                <option value="Brand New">Brand New</option>
                <option value="UK Used">UK Used</option>
              </select>
            </label>
            {input('Battery health %', 'battery', { type: 'number', min: 0, max: 100 })}
            {input('Colour', 'color')}
          </fieldset>
        )}
        <label className="flex min-h-[46px] items-center gap-3 text-sm font-semibold">
          <input type="checkbox" checked={!!Number(f.active)} onChange={set('active')} className="h-5 w-5 accent-royal" />
          Active (shown in the shop)
        </label>
        {err && <p role="alert" className="text-sm font-semibold text-danger">{err}</p>}
        <div className="mt-2 flex gap-2">
          <button type="button" onClick={onClose} className="min-h-[50px] flex-1 rounded-full border border-hairline font-semibold">Cancel</button>
          <button disabled={busy} className="min-h-[50px] flex-1 rounded-full bg-forest font-bold text-lime disabled:opacity-60">{busy ? 'Saving…' : 'Save'}</button>
        </div>
      </motion.form>
    </motion.div>
  );
}
