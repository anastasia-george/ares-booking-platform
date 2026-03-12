// pages/faq.tsx
import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';

const SECTIONS = [
  {
    heading: 'For Models',
    items: [
      { q: 'Do I need any experience to be a model?', a: 'No experience is needed. Model calls are open to everyone. You just need to show up on time, be cooperative during the treatment, and leave an honest review.' },
      { q: 'Is it really free?', a: 'Many sessions are completely free. Others are offered at a significant discount (e.g. $20 instead of $180). Each listing clearly displays the model price before you book.' },
      { q: 'Is it safe?', a: 'Every business on Model Call is manually verified before going live. Students are always supervised by qualified practitioners. You can also read reviews from past models before booking.' },
      { q: 'What if I need to cancel?', a: 'Cancellations are allowed, but cancelling within 24 hours of your appointment may result in a no-show fee, depending on the business\'s cancellation policy. Policy details are always shown before you confirm your booking.' },
      { q: 'Do I need to create an account?', a: 'You need an account to book. Browsing listings is free and open to everyone, no sign-up required.' },
      { q: 'What happens after my appointment?', a: "You'll receive an automated prompt to leave a review. Reviews help other models make informed decisions and help businesses improve." },
    ],
  },
  {
    heading: 'For Businesses',
    items: [
      { q: 'How do I get listed?', a: 'Click "List a Service" in the navigation and complete the onboarding wizard. It takes about 5 minutes. We\'ll review and approve your listing within 1 business day.' },
      { q: 'What does it cost?', a: 'Model Call is free to list during our launch period. A small platform fee will apply when we introduce paid tiers; businesses who join now will be offered early-adopter pricing.' },
      { q: 'Can I list multiple services?', a: 'Yes. From your business dashboard you can add as many services as you like. Each can have its own price, duration, category, and availability schedule.' },
      { q: 'How are no-show fees handled?', a: "Models add a card on file at the time of booking. If a model doesn't show up, you can trigger a no-show charge from your dashboard up to the maximum amount you set in your cancellation policy." },
      { q: 'Can I choose which models book with me?', a: 'Currently all listings are instant-book. Approval-gated bookings (where you review model profiles before confirming) are on our near-term roadmap.' },
      { q: 'What if a model behaves badly?', a: 'You can flag a model through your dashboard. Our trust and safety team reviews all reports. Repeated issues result in account suspension.' },
    ],
  },
  {
    heading: 'Payments & Cancellations',
    items: [
      { q: 'How do payments work for paid sessions?', a: 'For discounted sessions, models pay a deposit at the time of booking. The remainder (if any) is settled at your discretion. Free sessions require a card on file only, and no charge is made unless there is a no-show.' },
      { q: 'What payment methods are accepted?', a: 'All major credit and debit cards via Stripe. Apple Pay and Google Pay are supported on compatible devices.' },
      { q: 'Is my card information safe?', a: 'Yes. Model Call never stores your raw card details. All payment data is processed and stored by Stripe, a PCI-compliant payment processor.' },
      { q: 'Can I get a refund?', a: 'Refunds are handled on a case-by-case basis. If a business cancels your booking or the service was materially different from what was advertised, contact our support team and we\'ll investigate.' },
    ],
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="w-full flex justify-between items-center py-5 text-left gap-4"
      >
        <span className="text-sm font-semibold" style={{ color: '#0F172A' }}>{q}</span>
        <span className="text-xl shrink-0 transition-transform" style={{ color: '#0D9488', transform: open ? 'rotate(45deg)' : 'none' }} aria-hidden="true">+</span>
      </button>
      {open && (
        <p className="text-sm pb-5 leading-relaxed" style={{ color: '#64748B' }}>{a}</p>
      )}
    </div>
  );
}

export default function FAQ() {
  return (
    <>
      <Head>
        <title>FAQ | Model Call | Free Beauty Treatments Australia</title>
        <meta name="description" content="Frequently asked questions about Model Call: how to book free beauty treatments, business listings, payments, cancellations, and safety. Everything you need to know." />
        <link rel="canonical" href="https://modelcall.app/faq" />
        <meta property="og:title" content="FAQ | Model Call" />
        <meta property="og:description" content="Everything you need to know about booking free beauty treatments and listing your business on Model Call." />
        <meta property="og:url" content="https://modelcall.app/faq" />
        <meta name="twitter:title" content="FAQ | Model Call" />
        <meta name="twitter:description" content="Frequently asked questions about Model Call, for models, businesses, and payments." />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: SECTIONS.flatMap((section) =>
                section.items.map((item) => ({
                  '@type': 'Question',
                  name: item.q,
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: item.a,
                  },
                }))
              ),
            }),
          }}
        />
      </Head>

      {/* Hero */}
      <section style={{ backgroundColor: '#0F172A' }} className="py-20 text-center px-4">
        <h1 className="text-4xl font-extrabold text-white mb-4">Frequently asked questions</h1>
        <p className="text-lg max-w-xl mx-auto" style={{ color: '#94A3B8' }}>
          Everything you need to know about Model Call. Can&rsquo;t find what you&rsquo;re looking for? Email us at{' '}
          <a href="mailto:hello@modelcall.app" className="underline" style={{ color: '#0D9488' }}>hello@modelcall.app</a>.
        </p>
      </section>

      {/* FAQ sections */}
      <section className="py-16" style={{ backgroundColor: '#F8FAFC' }}>
        <div className="max-w-3xl mx-auto px-4 space-y-16">
          {SECTIONS.map((section) => (
            <div key={section.heading}>
              <h2 className="text-xl font-extrabold mb-6" style={{ color: '#0F172A' }}>{section.heading}</h2>
              <div className="bg-white rounded-2xl px-6 border border-gray-100 shadow-sm">
                {section.items.map((item) => (
                  <FAQItem key={item.q} q={item.q} a={item.a} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 bg-white text-center px-4">
        <h2 className="text-2xl font-extrabold mb-3" style={{ color: '#0F172A' }}>Still have questions?</h2>
        <p className="text-base mb-6" style={{ color: '#64748B' }}>Our team is happy to help.</p>
        <a href="mailto:hello@modelcall.app"
          className="inline-block px-8 py-4 rounded-xl font-semibold text-white text-base transition hover:opacity-90"
          style={{ backgroundColor: '#0D9488' }}>
          Contact Support
        </a>
        <div className="mt-8 flex gap-6 justify-center text-sm font-medium">
          <Link href="/for-models" className="hover:underline" style={{ color: '#0D9488' }}>For Models</Link>
          <Link href="/for-businesses" className="hover:underline" style={{ color: '#0D9488' }}>For Businesses</Link>
          <Link href="/legal/terms" className="hover:underline" style={{ color: '#64748B' }}>Terms of Service</Link>
          <Link href="/legal/privacy" className="hover:underline" style={{ color: '#64748B' }}>Privacy Policy</Link>
        </div>
      </section>
    </>
  );
}
