import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { SignOut } from '@phosphor-icons/react';
import { init } from '../lib/store.js';
import { verifySession, logout } from '../lib/admin.js';
import AdminLogin from '../components/admin/AdminLogin.jsx';
import Dashboard from '../components/admin/Dashboard.jsx';
import Products from '../components/admin/Products.jsx';
import Orders from '../components/admin/Orders.jsx';
import Settings from '../components/admin/Settings.jsx';

const TABS = [
  { id: 'Dashboard', view: Dashboard },
  { id: 'Products', view: Products },
  { id: 'Orders', view: Orders },
  { id: 'Settings', view: Settings },
];

export default function Admin() {
  const [state, setState] = useState('checking');
  const [tab, setTab] = useState('Dashboard');
  const reduce = useReducedMotion();

  useEffect(() => {
    init().then(verifySession).then((ok) => setState(ok ? 'in' : 'out')).catch(() => setState('out'));
  }, []);

  if (state === 'checking') {
    return <div className="grid min-h-[60vh] place-items-center text-muted" aria-busy="true">Checking access…</div>;
  }
  if (state === 'out') return <AdminLogin onIn={() => setState('in')} />;

  const Current = TABS.find((t) => t.id === tab).view;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-5 md:px-6 md:pt-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-royal">Admin</p>
          <h1 className="font-display text-3xl font-extrabold">Marc Brainwav Premium Deals</h1>
        </div>
        <button
          onClick={async () => { await logout(); setState('out'); }}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-hairline px-4 font-semibold"
        >
          <SignOut size={18} aria-hidden="true" /> Log out
        </button>
      </header>

      <div role="tablist" aria-label="Admin sections" className="mt-6 flex gap-2 overflow-x-auto">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} className="relative min-h-[44px] shrink-0 rounded-full px-5 text-sm font-bold">
            {tab === t.id && (
              <motion.span layoutId="admin-tab" className="absolute inset-0 rounded-full bg-forest" transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 480, damping: 36 }} />
            )}
            <span className={`relative ${tab === t.id ? 'text-lime' : 'text-muted'}`}>{t.id}</span>
          </button>
        ))}
      </div>

      <motion.div key={tab} initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 380, damping: 34 }} className="mt-6">
        <Current />
      </motion.div>
    </div>
  );
}
