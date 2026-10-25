import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { WhatsappLogo, Phone, SnapchatLogo, ChatCircle, ArrowsLeftRight } from '@phosphor-icons/react';
import { CONTACT } from '../lib/store.js';

export default function Support() {
  const reduce = useReducedMotion();
  const channels = [
    { href: CONTACT.whatsappUrl, label: 'WhatsApp', detail: CONTACT.whatsappNumber, icon: WhatsappLogo, primary: true, external: true },
    { href: `tel:${CONTACT.phone}`, label: 'Call us', detail: CONTACT.phone, icon: Phone },
    { href: CONTACT.snapchatUrl, label: 'Snapchat', detail: CONTACT.snapchat, icon: SnapchatLogo, external: true },
    { href: '/send-money', label: 'Exchange', detail: 'Receive money from abroad, paid in cedis in Ghana', icon: ArrowsLeftRight, internal: true },
  ];
  return (
    <div className="mx-auto max-w-2xl px-4 pt-5 md:pt-10">
      <h1 className="font-display text-3xl font-extrabold md:text-4xl">Support</h1>
      <p className="mt-2 flex items-center gap-2 text-muted"><ChatCircle size={18} aria-hidden="true" /> Chat with us anytime</p>
      <ul className="mt-6 grid gap-3">
        {channels.map((c, i) => {
          const Icon = c.icon;
          return (
            <motion.li key={c.label} initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 320, damping: 30, delay: i * 0.05 }}>
              {(() => {
                const cls = `flex min-h-[72px] items-center gap-4 rounded-2xl p-5 transition-transform active:scale-[0.98] ${c.primary ? 'bg-forest text-white' : 'border border-hairline bg-surface'}`;
                const inner = (
                  <>
                    <span className={`grid h-12 w-12 place-items-center rounded-xl ${c.primary ? 'bg-lime text-forest' : 'bg-royal text-white'}`}><Icon size={24} weight="bold" aria-hidden="true" /></span>
                    <span className="flex-1">
                      <span className="block font-display text-lg font-bold">{c.label}</span>
                      <span className={`block text-sm ${c.primary ? 'text-white/80' : 'text-muted'}`}>{c.detail}</span>
                    </span>
                  </>
                );
                return c.internal
                  ? <Link to={c.href} className={cls}>{inner}</Link>
                  : <a href={c.href} {...(c.external ? { target: '_blank', rel: 'noreferrer' } : {})} className={cls}>{inner}</a>;
              })()}
            </motion.li>
          );
        })}
      </ul>
      <p className="mt-6 text-sm text-muted md:mt-8">Your trust, our reputation. Marc Brainwav Premium Deals, Accra, Ghana.</p>
    </div>
  );
}
