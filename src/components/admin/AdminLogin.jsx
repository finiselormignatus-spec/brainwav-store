import { useEffect, useState } from 'react';
import { Eye, EyeSlash } from '@phosphor-icons/react';
import { login, setupAdminPassword, adminPasswordSet } from '../../lib/admin.js';

export default function AdminLogin({ onIn }) {
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(null);

  useEffect(() => {
    adminPasswordSet().then((set) => setNeedsSetup(!set)).catch(() => setNeedsSetup(false));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (needsSetup) {
        if (pw !== pw2) throw new Error('The two passwords do not match.');
        await setupAdminPassword(pw);
      } else {
        await login(pw);
      }
      setPw('');
      setPw2('');
      onIn();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (needsSetup === null) return <div className="mx-auto mt-16 max-w-sm text-center text-muted">Loading…</div>;

  return (
    <form onSubmit={submit} className="mx-auto mt-16 grid max-w-sm gap-4 rounded-3xl border border-hairline bg-surface p-6">
      <h1 className="font-display text-2xl font-extrabold">{needsSetup ? 'Set admin password' : 'Admin sign in'}</h1>
      {needsSetup && <p className="text-sm text-muted">First run: choose a password only you know (8+ characters). Use it to sign in from now on.</p>}
      <label className="grid gap-1.5 text-sm font-semibold">
        Password
        <span className="relative">
          <input
            type={show ? 'text' : 'password'}
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            autoComplete={needsSetup ? 'new-password' : 'current-password'}
            minLength={needsSetup ? 8 : undefined}
            required
            aria-invalid={!!error}
            className="min-h-[52px] w-full rounded-xl border border-hairline px-4 pr-12 text-base font-normal outline-none focus:border-royal focus:ring-4 focus:ring-royal/20"
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? 'Hide password' : 'Show password'}
            className="absolute right-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full text-muted"
          >
            {show ? <EyeSlash size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
          </button>
        </span>
      </label>
      {needsSetup && (
        <label className="grid gap-1.5 text-sm font-semibold">
          Confirm password
          <input type={show ? 'text' : 'password'} value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" required
            className="min-h-[52px] w-full rounded-xl border border-hairline px-4 text-base font-normal outline-none focus:border-royal focus:ring-4 focus:ring-royal/20" />
        </label>
      )}
      {error && <p role="alert" className="text-sm font-semibold text-danger">{error}</p>}
      <button disabled={busy} className="min-h-[52px] rounded-full bg-forest font-bold text-lime disabled:opacity-60">
        {busy ? 'Checking…' : needsSetup ? 'Save password and sign in' : 'Sign in'}
      </button>
    </form>
  );
}
