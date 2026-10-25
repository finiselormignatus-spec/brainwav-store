import { Link } from 'react-router-dom';
import { WhatsappLogo, ArrowLeft, CurrencyDollar, ArrowsLeftRight, Gift } from '@phosphor-icons/react';
import { CONTACT } from '../lib/store.js';

const EXCHANGE_MESSAGE =
  "Hi Marc Brainwav, I want to exchange ___ (CashApp / Zelle / PayPal / Venmo), amount: ___. What's today's rate?";


const GIFT_MESSAGE =
  "Hi Marc Brainwav, I want to redeem a ___ gift card, currency: ___, amount: ___. What's the rate?";

const STEPS = [
  'Contact us on WhatsApp with the amount you want to send.',
  'We send you the cedi rate and the handle to send to.',
  'You send the money in USD to that handle.',
  'Cedis are delivered to the recipient in Ghana, by mobile money or bank.',
];

const waHref = (message) => `${CONTACT.whatsappUrl}?text=${encodeURIComponent(message)}`;

export default function SendMoney() {
  return (
    <div className="mx-auto grid max-w-5xl gap-4 px-4 pt-5 md:grid-cols-[1fr_340px] md:gap-6 md:px-6 md:pt-10">
      <div className="grid gap-4 md:gap-6">
        <Link to="/support" className="inline-flex min-h-[44px] w-fit items-center gap-2 font-semibold text-muted"><ArrowLeft size={18} aria-hidden="true" /> Support</Link>
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-royal">Exchange</p>
          <h1 className="mt-1 font-display text-3xl font-extrabold md:text-4xl">Exchange</h1>
          <p className="mt-3 text-muted">Exchange money from abroad into cedis, or cash in a gift card. Everything happens in a WhatsApp chat with us.</p>
        </div>

        <section aria-labelledby="steps" className="grid gap-4 rounded-3xl border border-hairline bg-surface p-5 md:p-6">
          <h2 id="steps" className="font-display text-xl font-bold">How it works</h2>
          <ol className="grid gap-3">
            {STEPS.map((s, i) => (
              <li key={s} className="flex gap-3 text-sm">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-forest font-bold text-lime">{i + 1}</span>
                <span className="pt-1">{s}</span>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="exchange" className="grid gap-4 rounded-3xl border border-hairline bg-surface p-5 md:p-6">
          <ArrowsLeftRight size={28} weight="bold" className="text-royal" aria-hidden="true" />
          <h2 id="exchange" className="font-display text-xl font-bold">Exchange: CashApp, Zelle, PayPal or Venmo to cedis</h2>
          <p className="text-sm text-muted">Send us the amount and the app you are sending from. We reply with today's rate and where to send.</p>
          <a href={waHref(EXCHANGE_MESSAGE)} target="_blank" rel="noreferrer" className="inline-flex min-h-[56px] items-center justify-center gap-2 rounded-full bg-forest font-bold text-lime">
            <WhatsappLogo size={20} weight="bold" aria-hidden="true" /> Chat on WhatsApp
          </a>
        </section>

        <section aria-labelledby="giftcards" className="grid gap-4 rounded-3xl border border-hairline bg-surface p-5 md:p-6">
          <Gift size={28} weight="bold" className="text-royal" aria-hidden="true" />
          <h2 id="giftcards" className="font-display text-xl font-bold">Gift card redemption for cash</h2>
          <p className="text-sm text-muted">Tell us the brand, currency and amount of your gift card. We reply with the rate and how to get paid.</p>
          <a href={waHref(GIFT_MESSAGE)} target="_blank" rel="noreferrer" className="inline-flex min-h-[56px] items-center justify-center gap-2 rounded-full bg-forest font-bold text-lime">
            <WhatsappLogo size={20} weight="bold" aria-hidden="true" /> Chat on WhatsApp
          </a>
        </section>
      </div>

      <aside className="h-fit rounded-3xl bg-forest p-5 text-white md:p-6 md:sticky md:top-24">
        <CurrencyDollar size={28} weight="bold" className="text-lime" aria-hidden="true" />
        <h2 className="mt-3 font-display text-xl font-bold">Rates change daily</h2>
        <p className="mt-2 text-sm text-white/80">Message us for today's rate before you send. The rate is confirmed on WhatsApp.</p>
        <Link to="/support" className="mt-6 inline-flex min-h-[48px] items-center gap-2 font-semibold text-lime"><WhatsappLogo size={18} aria-hidden="true" /> Other ways to reach us</Link>
      </aside>
    </div>
  );
}
