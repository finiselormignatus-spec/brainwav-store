import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { registerCustomer, loginCustomer } from '../lib/customers.js';
import { useCustomer } from '../lib/useCustomer.js';

// Only allow same-site relative redirects (e.g. /checkout), never external URLs.
export function safeNext(raw) {
  return raw && raw.startsWith('/') && !raw.startsWith('//') ? raw : '/account';
}

const inputClass = 'min-h-[52px] rounded-xl border border-hairline bg-surface px-4 text-base font-normal outline-none focus:border-royal focus:ring-4 focus:ring-royal/20';

function Field({ label, error, ...props }) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold">
      {label}
      <input {...props} aria-invalid={!!error} className={inputClass} />
      {error && <span className="text-sm font-semibold text-danger">{error}</span>}
    </label>
  );
}

export function Register() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNext(params.get('next'));
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await registerCustomer(form);
      navigate(next, { replace: true });
    } catch (err) {
      setError(err.message || 'Could not create your account. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 pt-4 md:pt-12">
      <h1 className="font-display text-3xl font-extrabold">Create your account</h1>
      <p className="mt-2 text-muted">You need an account to check out. Your orders and status show up here.</p>
      <form onSubmit={submit} noValidate className="mt-5 grid gap-4 rounded-3xl border border-hairline bg-surface p-4 md:mt-6 md:p-5">
        <Field label="Full name" name="name" autoComplete="name" required value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Field label="Email" name="email" type="email" autoComplete="email" required value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Field label="Phone number" name="phone" type="tel" inputMode="tel" autoComplete="tel" required value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <Field label="Password (at least 8 characters)" name="password" type="password" autoComplete="new-password" required value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })} />
        {error && <p role="alert" className="rounded-2xl bg-red-50 p-4 font-semibold text-danger">{error}</p>}
        <button type="submit" disabled={busy}
          className="min-h-[56px] rounded-full bg-forest font-bold text-lime disabled:opacity-60">
          {busy ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <p className="mt-5 text-center text-sm text-muted">
        Already have an account? <Link to={`/login?next=${encodeURIComponent(next)}`} className="font-bold text-royal">Log in</Link>
      </p>
    </div>
  );
}

export function Login() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNext(params.get('next'));
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await loginCustomer(form);
      navigate(next, { replace: true });
    } catch (err) {
      setError(err.message || 'Could not log in. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 pt-4 md:pt-12">
      <h1 className="font-display text-3xl font-extrabold">Log in</h1>
      <p className="mt-2 text-muted">Log in to check out and see your orders.</p>
      <form onSubmit={submit} noValidate className="mt-5 grid gap-4 rounded-3xl border border-hairline bg-surface p-4 md:mt-6 md:p-5">
        <Field label="Email" name="email" type="email" autoComplete="email" required value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <label className="grid gap-1.5 text-sm font-semibold">
          Password
          <span className="relative">
            <input name="password" type={showPw ? 'text' : 'password'} autoComplete="current-password" required value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} className={`${inputClass} w-full pr-20`} />
            <button type="button" onClick={() => setShowPw((v) => !v)} aria-pressed={showPw}
              className="absolute right-2 top-1/2 min-h-[40px] -translate-y-1/2 rounded-full px-3 text-sm font-bold text-forest">
              {showPw ? 'Hide' : 'Show'}
            </button>
          </span>
          <a href={`https://wa.me/233595484295?text=${encodeURIComponent('Hi, I forgot my password for Marc Brainwav Premium Deals. My email is: ' + (form.email || ''))}`}
            target="_blank" rel="noreferrer" className="justify-self-end pt-1 text-sm font-bold text-forest underline-offset-4 hover:underline">Forgot password? Message us on WhatsApp</a>
        </label>
        {error && <p role="alert" className="rounded-2xl bg-red-50 p-4 font-semibold text-danger">{error}</p>}
        <button type="submit" disabled={busy}
          className="min-h-[56px] rounded-full bg-forest font-bold text-lime disabled:opacity-60">
          {busy ? 'Logging in…' : 'Log in'}
        </button>
      </form>
      <p className="mt-5 text-center text-sm text-muted">
        New here? <Link to={`/register?next=${encodeURIComponent(next)}`} className="font-bold text-forest underline-offset-4 hover:underline">Create an account</Link>
      </p>
    </div>
  );
}

/** Shown in place of checkout for guests. */
export function AccountRequired({ next = '/checkout' }) {
  return (
    <div className="mx-auto max-w-md px-4 pt-6 text-center md:pt-10">
      <h1 className="font-display text-3xl font-extrabold">Create an account to check out</h1>
      <p className="mt-3 text-muted">Accounts keep your order history and status in one place.</p>
      <div className="mt-5 grid gap-3 md:mt-6">
        <Link to={`/register?next=${encodeURIComponent(next)}`} className="inline-flex min-h-[52px] items-center justify-center rounded-full bg-forest font-bold text-lime">Create account</Link>
        <Link to={`/login?next=${encodeURIComponent(next)}`} className="inline-flex min-h-[52px] items-center justify-center rounded-full border border-hairline font-bold">I have an account</Link>
      </div>
    </div>
  );
}

export function RequireCustomer({ children }) {
  const { customer, loading } = useCustomer();
  if (loading) return <div className="mx-auto max-w-md px-4 py-20 text-center text-muted">Loading…</div>;
  if (!customer) return <AccountRequired />;
  return children;
}

export { useCustomer };
