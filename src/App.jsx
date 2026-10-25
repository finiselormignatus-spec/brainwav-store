import { Routes, Route, Link, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { House, Storefront, ShoppingBag, Headset, WhatsappLogo, Phone } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import Home from './pages/Home.jsx';
import Shop from './pages/Shop.jsx';
import Product from './pages/Product.jsx';
import Cart from './pages/Cart.jsx';
import Checkout from './pages/Checkout.jsx';
import Order from './pages/Order.jsx';
import Support from './pages/Support.jsx';
import SendMoney from './pages/SendMoney.jsx';
import Admin from './pages/Admin.jsx';
import Account from './pages/Account.jsx';
import { Register, Login } from './pages/Auth.jsx';
import { useCustomer } from './lib/useCustomer.js';
import { UserCircle } from '@phosphor-icons/react';
import { readCart, CONTACT } from './lib/store.js';
import { Toaster } from 'sonner';

function useCartCount() {
  const [count, setCount] = useState(() => readCart().reduce((s, i) => s + i.qty, 0));
  useEffect(() => {
    const sync = () => setCount(readCart().reduce((s, i) => s + i.qty, 0));
    window.addEventListener('cart-change', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('cart-change', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);
  return count;
}

// Support lives in one place only: this bottom tab on mobile, and the header link on desktop.
const tabs = [
  { to: '/', label: 'Home', icon: House, end: true },
  { to: '/shop', label: 'Shop', icon: Storefront },
  { to: '/cart', label: 'Cart', icon: ShoppingBag, cart: true },
  { to: '/account', label: 'Account', icon: UserCircle },
  { to: '/support', label: 'Support', icon: Headset },
];

function BottomNav() {
  const count = useCartCount();
  const reduce = useReducedMotion();
  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-surface md:hidden">
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {tabs.map(({ to, label, icon: Icon, end, cart }) => (
          <li key={to}>
            <NavLink to={to} end={end} className="flex min-h-[60px] flex-col items-center justify-center gap-1 text-xs font-semibold text-muted aria-[current=page]:text-forest">
              {({ isActive }) => (
                <>
                  <span className="relative grid h-8 w-12 place-items-center">
                    {isActive && (
                      <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-full bg-lime"
                        transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 500, damping: 40 }} />
                    )}
                    <Icon size={22} weight={isActive ? 'fill' : 'regular'} className="relative" aria-hidden="true" />
                    {cart && count > 0 && (
                      <motion.span key={count} initial={reduce ? false : { scale: 0.4 }} animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 600, damping: 18 }}
                        className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-royal px-1 text-[11px] font-bold text-white">
                        {count}
                      </motion.span>
                    )}
                  </span>
                  {label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function Brand() {
  return (
    <Link to="/" aria-label="Marc Brainwav Premium Deals home" className="flex min-w-0 items-center gap-3">
      <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-forest font-display text-lg font-extrabold text-lime">M</span>
      <span className="min-w-0 leading-tight">
        <span className="block truncate font-display text-sm font-extrabold tracking-wide">Marc Brainwav Premium Deals</span>
        <span className="block text-[11px] font-semibold text-muted">Your trust, our reputation</span>
      </span>
    </Link>
  );
}

function TopBar() {
  const count = useCartCount();
  return (
    <header className="sticky top-0 z-30 border-b border-hairline bg-surface">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        <Brand />
        <nav aria-label="Desktop" className="hidden items-center gap-1 text-sm font-semibold md:flex">
          <NavLink to="/shop" className="rounded-full px-4 py-2 text-muted hover:text-ink aria-[current=page]:bg-forest aria-[current=page]:text-lime">Shop</NavLink>
          <NavLink to="/send-money" className="rounded-full px-4 py-2 text-muted hover:text-ink aria-[current=page]:bg-forest aria-[current=page]:text-lime">Exchange</NavLink>
          <NavLink to="/support" className="rounded-full px-4 py-2 text-muted hover:text-ink aria-[current=page]:bg-forest aria-[current=page]:text-lime">Support</NavLink>
          <AccountLink />
          <NavLink to="/cart" className="ml-2 flex items-center gap-2 rounded-full bg-royal px-4 py-2 text-white aria-[current=page]:bg-navy">
            Cart {count > 0 && <span className="rounded-full bg-white px-2 text-xs text-navy">{count}</span>}
          </NavLink>
        </nav>
      </div>
    </header>
  );
}

function AccountLink() {
  const { customer, loading } = useCustomer();
  if (loading) return null;
  return (
    <NavLink to={customer ? '/account' : '/login'} className="rounded-full px-4 py-2 text-muted hover:text-ink aria-[current=page]:bg-forest aria-[current=page]:text-lime">
      {customer ? 'Account' : 'Log in'}
    </NavLink>
  );
}

function Footer() {
  return (
    <footer className="mt-4 border-t border-hairline bg-surface px-4 pb-28 pt-5 md:mt-16 md:pb-10 md:pt-10 md:px-6">
      <div className="mx-auto grid max-w-6xl gap-4 md:gap-8 md:grid-cols-3">
        <div>
          <p className="font-display text-base font-extrabold">Marc Brainwav Premium Deals</p>
          <p className="mt-1 text-sm text-muted">Your trust, our reputation. Accra, Ghana.</p>
        </div>
        <div className="grid gap-2 text-sm font-semibold">
          <a href={CONTACT.whatsappUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-[44px] items-center gap-2 text-forest">
            <WhatsappLogo size={18} weight="bold" aria-hidden="true" /> WhatsApp +233595484295
          </a>
          <a href="tel:0501994337" className="inline-flex min-h-[44px] items-center gap-2 text-forest">
            <Phone size={18} weight="bold" aria-hidden="true" /> Call 0501994337
          </a>
          <p className="text-muted">Snapchat: keli_brainwav21</p>
        </div>
        <div className="hidden gap-3 text-sm md:grid">
          <p><span className="font-bold">Orders and problems:</span> <span className="text-muted">Message us on WhatsApp about any order. We confirm payment with you directly.</span></p>
        </div>
      </div>
      <p className="mx-auto mt-5 max-w-6xl border-t border-hairline pt-4 text-xs text-muted md:mt-8 md:pt-5">
        © {new Date().getFullYear()} Marc Brainwav Premium Deals. All rights reserved.
        <span className="block pt-1">Built with <span aria-hidden="true">❤</span> in Accra.</span>
      </p>
    </footer>
  );
}

export default function App() {
  const location = useLocation();
  const reduce = useReducedMotion();
  const isAdmin = location.pathname.startsWith('/admin');
  return (
    <div className="min-h-screen">
      {!isAdmin && <TopBar />}
      <AnimatePresence mode="wait" initial={false}>
        <motion.main
          key={location.pathname.split('/')[1] || 'home'}
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
          transition={{ type: 'spring', stiffness: 380, damping: 36 }}
          className={isAdmin ? '' : 'pb-24 md:pb-8'}
        >
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/product/:slug" element={<Product />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/account" element={<Account />} />
            <Route path="/checkout/callback" element={<Checkout />} />
            <Route path="/order/:ref" element={<Order />} />
            <Route path="/support" element={<Support />} />
            <Route path="/send-money" element={<SendMoney />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </motion.main>
      </AnimatePresence>
      {!isAdmin && <Footer />}
      {!isAdmin && <BottomNav />}
      <Toaster position="top-center" toastOptions={{ className: 'font-body font-semibold' }} />
    </div>
  );
}

function NotFound() {
  return (
    <div className="mx-auto max-w-md px-5 py-20 text-center">
      <h1 className="font-display text-3xl font-extrabold">Oops, this page wandered off</h1>
      <p className="mt-3 text-muted">It may have moved or never existed. The good phones are still right here.</p>
      <Link to="/" className="mt-6 inline-flex min-h-[48px] items-center rounded-full bg-forest px-6 font-bold text-lime">Back to home</Link>
    </div>
  );
}
