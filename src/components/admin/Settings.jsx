import { useState } from 'react';
import { toast } from 'sonner';
import { getAdminSettings, saveSettings } from '../../lib/store.js';
import { changePassword } from '../../lib/admin.js';
import useAsync from './useAsync.js';

const CONTACTS = [
  { key: 'contact_whatsapp', label: 'WhatsApp number' },
  { key: 'contact_phone', label: 'Phone number' },
  { key: 'contact_snapchat', label: 'Snapchat handle' },
];

export default function Settings() {
  const { data, error } = useAsync(getAdminSettings);
  if (error) return <p role="alert" className="text-danger">{error}</p>;
  if (!data) return <p className="text-muted" aria-busy="true">Loading settings…</p>;
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <PaymentSettings initial={data} />
      <PasswordForm />
    </div>
  );
}

function PaymentSettings({ initial }) {
  const [f, setF] = useState(() => ({
    paystack_enabled: initial.paystack_enabled === 'true',
    paystack_public_key: initial.paystack_public_key || '',
    ...Object.fromEntries(CONTACTS.map((c) => [c.key, initial[c.key] || ''])),
  }));
  const [busy, setBusy] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await saveSettings({ ...f, paystack_enabled: f.paystack_enabled ? 'true' : 'false' });
      toast('Settings saved');
    } catch (err) {
      toast(err.message);
    } finally {
      setBusy(false);
    }
  };

  const text = (key, label) => (
    <label key={key} className="grid gap-1 text-sm font-semibold">
      {label}
      <input value={f[key]} onChange={(e) => setF({ ...f, [key]: e.target.value })} className="min-h-[46px] rounded-xl border border-hairline px-3 font-normal" />
    </label>
  );

  return (
    <form onSubmit={save} className="grid content-start gap-4 rounded-2xl border border-hairline bg-surface p-5">
      <h2 className="font-display text-xl font-extrabold">Payments</h2>
      <label className="flex min-h-[46px] items-center gap-3 text-sm font-semibold">
        <input type="checkbox" checked={f.paystack_enabled} onChange={(e) => setF({ ...f, paystack_enabled: e.target.checked })} className="h-5 w-5 accent-royal" />
        Show Paystack (Mobile Money or Card) at checkout
      </label>
      {text('paystack_public_key', 'Paystack public key')}
      <p className="rounded-xl bg-canvas p-3 text-xs text-muted">The Paystack secret key is never stored in this app. It belongs only on the server.</p>
      <h2 className="mt-2 font-display text-xl font-extrabold">Contact</h2>
      {CONTACTS.map((c) => text(c.key, c.label))}
      <button disabled={busy} className="min-h-[50px] rounded-full bg-forest font-bold text-lime disabled:opacity-60">{busy ? 'Saving…' : 'Save settings'}</button>
    </form>
  );
}

function PasswordForm() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      await changePassword(current, next);
      setCurrent('');
      setNext('');
      toast('Password changed');
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid content-start gap-4 rounded-2xl border border-hairline bg-surface p-5">
      <h2 className="font-display text-xl font-extrabold">Change admin password</h2>
      <label className="grid gap-1 text-sm font-semibold">
        Current password
        <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" required className="min-h-[46px] rounded-xl border border-hairline px-3 font-normal" />
      </label>
      <label className="grid gap-1 text-sm font-semibold">
        New password (8+ characters)
        <input type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" minLength={8} required className="min-h-[46px] rounded-xl border border-hairline px-3 font-normal" />
      </label>
      {err && <p role="alert" className="text-sm font-semibold text-danger">{err}</p>}
      <button disabled={busy} className="min-h-[50px] rounded-full border border-forest font-bold text-forest disabled:opacity-60">{busy ? 'Updating…' : 'Update password'}</button>
    </form>
  );
}
