import { Link } from 'react-router-dom';
import { ArrowLeft, WhatsappLogo, Phone, ChatCircle } from '@phosphor-icons/react';
import { CONTACT } from '../lib/store.js';

const waText = (msg) => `${CONTACT.whatsappUrl}?text=${encodeURIComponent(msg)}`;

// Shared page frame: same width, heading style and back link as the other pages.
function Page({ eyebrow, title, intro, children }) {
  return (
    <div className="mx-auto grid max-w-3xl gap-5 px-4 pt-5 md:gap-6 md:px-6 md:pt-10">
      <Link to="/support" className="inline-flex min-h-[44px] w-fit items-center gap-2 font-semibold text-muted">
        <ArrowLeft size={18} aria-hidden="true" /> Support
      </Link>
      <div>
        {eyebrow && <p className="font-mono text-xs uppercase tracking-wider text-royal">{eyebrow}</p>}
        <h1 className="mt-1 font-display text-3xl font-extrabold md:text-4xl">{title}</h1>
        {intro && <p className="mt-3 text-muted">{intro}</p>}
      </div>
      {children}
    </div>
  );
}

function Card({ title, children, id }) {
  return (
    <section id={id} aria-labelledby={id ? `${id}-h` : undefined} className="grid gap-3 rounded-3xl border border-hairline bg-surface p-5 md:p-6">
      <h2 id={id ? `${id}-h` : undefined} className="font-display text-xl font-bold">{title}</h2>
      <div className="grid gap-3 text-sm leading-relaxed text-ink">{children}</div>
    </section>
  );
}

export function About() {
  return (
    <Page eyebrow="About" title="About Marc Brainwav Premium Deals" intro="Your trust, our reputation.">
      <Card title="Who we are">
        <p>Marc Brainwav Premium Deals is a phone, laptop and subscription shop based in Accra, Ghana. We sell tested phones and laptops at fair cedi prices, and digital subscriptions delivered to you by WhatsApp or email.</p>
        <p>Every phone we list is checked by hand before it goes out. Prices are shown in Ghana cedis (GH₵).</p>
        <p>Business location: Accra, Ghana.</p>
      </Card>
      <Card title="How we work">
        <p>You browse and add items to your cart. We confirm the order and payment with you directly on WhatsApp, then arrange delivery or digital delivery. </p>
      </Card>
      <Card title="Talk to us">
        <a href={CONTACT.whatsappUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-[44px] items-center gap-2 font-semibold text-forest"><WhatsappLogo size={18} weight="bold" aria-hidden="true" /> WhatsApp +233 59 548 4295</a>
        <a href={`tel:${CONTACT.phone}`} className="inline-flex min-h-[44px] items-center gap-2 font-semibold text-forest"><Phone size={18} weight="bold" aria-hidden="true" /> Call 0501994337</a>
        <p className="text-muted">Snapchat: {CONTACT.snapchat}</p>
      </Card>
    </Page>
  );
}

const FAQS = [
  { q: 'How do I place an order?', a: 'Add the items to your cart, create an account, and check out. We confirm the order and the payment with you on WhatsApp.' },
  { q: 'How do I pay?', a: 'You pay the way we confirm with you on WhatsApp. We will send you the payment details for your order before anything is released.' },
  { q: 'Do you deliver outside Accra?', a: 'Yes. Nationwide delivery is available for iPhones. Delivery is arranged after checkout, and we will confirm the fee and timing with you.' },
  { q: 'How do I get a subscription or gift card?', a: 'Subscriptions and gift cards are delivered digitally by WhatsApp or email after your payment is confirmed.' },
  { q: 'Are the phones tested?', a: 'Yes. Every phone is tested by hand before it is listed.' },
  { q: 'What if something is wrong with my order?', a: 'Message us on WhatsApp with your order reference as soon as possible. Faulty items can be returned within 7 days of delivery. See Delivery &amp; Returns for the details.' },
  { q: 'Can I track my order?', a: 'Yes. Open your order from the Account page or use the order link we send you. You can also ask us on WhatsApp.' },
  { q: 'How do I contact you?', a: 'WhatsApp +233 59 548 4295, call 0501994337, or Snapchat keli_brainwav21.' },
];

export function Faqs() {
  return (
    <Page eyebrow="Help" title="Frequently asked questions" intro="Quick answers. Still stuck? Message us on WhatsApp.">
      <Card title="Questions" id="faq">
        <dl className="grid gap-4">
          {FAQS.map((f) => (
            <div key={f.q} className="grid gap-1 border-b border-hairline pb-4 last:border-0 last:pb-0">
              <dt className="font-display text-base font-bold">{f.q}</dt>
              <dd className="text-muted">{f.a}</dd>
            </div>
          ))}
        </dl>
      </Card>
      <a href={waText('Hi Marc Brainwav, I have a question about your store.')} target="_blank" rel="noreferrer" className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-forest px-6 font-bold text-lime"><ChatCircle size={20} aria-hidden="true" /> Ask us on WhatsApp</a>
    </Page>
  );
}

export function Feedback() {
  const msg = 'Hi Marc Brainwav, here is my feedback about my experience with your store: ';
  return (
    <Page eyebrow="Customer feedback" title="Customer feedback" intro="Tell us how we did. Your feedback helps us improve and keeps the shop honest.">
      <Card title="Share your feedback">
        <p>Send us your feedback on WhatsApp. Tell us about the phone or service you got, the delivery, and anything we can do better. Include your order reference if you have one.</p>
        <a href={waText(msg)} target="_blank" rel="noreferrer" className="inline-flex min-h-[48px] w-fit items-center gap-2 rounded-full bg-forest px-6 font-bold text-lime"><WhatsappLogo size={20} weight="bold" aria-hidden="true" /> Send feedback on WhatsApp</a>
      </Card>
      <Card title="How we handle feedback">
        <p>Feedback comes straight to the shop owner on WhatsApp, and complaints are dealt with directly with you.</p>
      </Card>
    </Page>
  );
}

export function Terms() {
  return (
    <Page eyebrow="Legal" title="Terms of service" intro="Last updated 28 October 2026.">
      <Card title="1. Who we are">
        <p>These terms apply to your use of the Marc Brainwav Premium Deals website and to every order placed through it. The shop operates in Accra, Ghana.</p>
      </Card>
      <Card title="2. Products and prices">
        <p>We sell phones, laptops, subscriptions and gift cards. Prices are in Ghana cedis (GH₵). Stock and prices can change. An order is confirmed only after we have confirmed it with you on WhatsApp.</p>
      </Card>
      <Card title="3. Orders and payment">
        <p>You must give accurate contact and delivery details. Payment is confirmed directly with you before an order is released. We may cancel an order if payment is not received or the product is no longer available, and we will tell you when that happens.</p>
      </Card>
      <Card title="4. Delivery and returns">
        <p>Delivery and returns are covered in our Delivery &amp; Returns policy, which forms part of these terms.</p>
      </Card>
      <Card title="5. Accounts">
        <p>You are responsible for keeping your login details private. Do not share your password with anyone.</p>
      </Card>
      <Card title="6. Privacy">
        <p>How we handle your personal information is set out in our Privacy Policy.</p>
      </Card>
      <Card title="7. Contact">
        <p>Business location: Marc Brainwav Premium Deals, Accra, Ghana.</p>
        <p>For any question about these terms, message us on WhatsApp +233 59 548 4295 or call 0501994337.</p>
      </Card>
    </Page>
  );
}

export function Privacy() {
  return (
    <Page eyebrow="Legal" title="Privacy policy" intro="Last updated 28 October 2026.">
      <Card title="What we collect">
        <p>When you create an account, we store your name, email address and phone number. When you place an order, we store the items, the delivery address you give us and the order details.</p>
      </Card>
      <Card title="How we use it">
        <p>We use your information to create and manage your account, process and deliver your orders, confirm payments with you, and reply to your messages. We send order confirmations and account emails to the address you give us.</p>
      </Card>
      <Card title="Who we share it with">
        <p>We do not sell your personal information. We share it only where needed to complete your order, for example with a delivery person, or where the law requires it. When online card or Mobile Money payment is switched on, payments are processed by Paystack. We do not store your card details.</p>
      </Card>
      <Card title="How we keep it safe">
        <p>Passwords are never stored in plain text. We keep only a one-way hash of your password. We keep your information only as long as needed for orders, accounts and legal record keeping.</p>
      </Card>
      <Card title="Your rights">
        <p>You can ask us to see, correct or delete the personal information we hold about you. Message us on WhatsApp +233 59 548 4295 or call 0501994337 to make a request.</p>
      </Card>
      <Card title="Cookies and storage">
        <p>The site uses your browser's local storage to keep your cart and to keep you logged in.</p>
      </Card>
    </Page>
  );
}

export function DeliveryReturns() {
  return (
    <Page eyebrow="Policy" title="Delivery &amp; returns" intro="How we deliver, and what to do if something is wrong.">
      <Card title="Delivery">
        <p>Delivery is arranged after checkout. Nationwide delivery is available for iPhones. Subscriptions and gift cards are delivered digitally by WhatsApp or email once payment is confirmed.</p>
        <p>Our business location is Accra, Ghana.</p>
        <p>We confirm the delivery fee and timing with you on WhatsApp before we send the item.</p>
      </Card>
      <Card title="Checking your order">
        <p>When your item arrives, check that it matches your order before you accept it. Test the phone or laptop where you can before the delivery person leaves.</p>
      </Card>
      <Card title="Returns and faults">
        <p>Return window: you can return an item that is faulty or not as described within 7 days of delivery.</p>
        <p>To start a return, message us on WhatsApp straight away with your order reference and photos or a short video of the problem. We will review it with you and agree the fix or return with you directly.</p>
      </Card>
      <Card title="Refunds">
        <p>Refunds are paid to the Mobile Money number or bank account you give us, or by bank transfer. A refund is only paid after the returned item has been checked, and the amount and timing are agreed with you on WhatsApp.</p>
      </Card>
      <Card title="Questions">
        <p>Message us on WhatsApp +233 59 548 4295 or call 0501994337.</p>
      </Card>
    </Page>
  );
}
