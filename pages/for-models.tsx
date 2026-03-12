// pages/for-models.tsx
import Head from 'next/head';
import Link from 'next/link';

const BENEFITS = [
  {
    icon: '💸',
    title: 'Save hundreds every year',
    desc: 'Access professional-grade treatments like lashes, injectables, facials, and hair at free or deeply discounted prices.',
  },
  {
    icon: '🎓',
    title: 'Support emerging talent',
    desc: "You're the canvas that helps a student graduate and a clinic grow. Your visit genuinely matters.",
  },
  {
    icon: '⚡',
    title: 'Instant online booking',
    desc: 'No DMs, no waitlists, no phone tag. Find a session and book it in under 60 seconds.',
  },
  {
    icon: '🛡️',
    title: 'Vetted, trusted providers',
    desc: 'Every business on Model Call is verified. Ratings and reviews from real models keep standards high.',
  },
  {
    icon: '📍',
    title: 'Find calls near you',
    desc: 'Filter by suburb, city, or category. Currently available in Sydney, expanding to Melbourne and Brisbane soon.',
  },
  {
    icon: '📆',
    title: 'Flexible scheduling',
    desc: 'Sessions are offered across weekdays and weekends, so there is always something that fits your calendar.',
  },
];

const FAQS = [
  {
    q: 'Do I need any experience?',
    a: 'No. Model calls welcome all skill levels. You just need to show up on time, follow instructions, and be honest in your review.',
  },
  {
    q: 'Is it really free?',
    a: 'Many sessions are genuinely free. Some are heavily discounted (e.g. $20 instead of $180). Each listing clearly shows the model price.',
  },
  {
    q: 'What if I need to cancel?',
    a: 'Cancellations within 24 hours may incur a small no-show fee at the business\'s discretion. We always show the cancellation policy before you book.',
  },
  {
    q: 'Are providers qualified?',
    a: 'Businesses and academies are manually reviewed. Students are supervised by qualified practitioners. Always read the listing details.',
  },
];

export default function ForModels() {
  return (
    <>
      <Head>
        <title>For Models: Free Beauty Treatments Australia | Model Call</title>
        <meta name="description" content="Book free and discounted beauty treatments across Australia. Find model calls for lashes, injectables, facials, nails, hair and more, no experience needed, zero booking fees." />
        <link rel="canonical" href="https://modelcall.app/for-models" />
        <meta property="og:title" content="For Models: Free Beauty Treatments Australia" />
        <meta property="og:description" content="Book free and discounted beauty treatments. Lashes, injectables, facials, nails, hair. No experience needed." />
        <meta property="og:url" content="https://modelcall.app/for-models" />
        <meta name="twitter:title" content="For Models: Free Beauty Treatments" />
        <meta name="twitter:description" content="Book free and discounted beauty treatments across Australia, no experience needed." />
        <meta name="keywords" content="free beauty treatments, beauty model, model call, free lashes, free facials, free injectables, discounted beauty, beauty model Australia" />
      </Head>

      {/* Hero */}
      <section style={{ backgroundColor: '#0F172A' }} className="py-24 text-center px-4">
        <span className="inline-block text-xs font-semibold tracking-widest uppercase mb-4 px-3 py-1 rounded-full border"
          style={{ color: '#0D9488', borderColor: '#0D9488' }}>
          For Models &amp; Customers
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight max-w-3xl mx-auto">
          Look amazing. <span style={{ color: '#0D9488' }}>Pay less.</span><br />Support beauty talent.
        </h1>
        <p className="mt-6 text-lg max-w-2xl mx-auto" style={{ color: '#94A3B8' }}>
          Model Call connects you with clinics, academies, and students who need real people for training and portfolio shoots at free or discounted rates.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/#browse"
            className="px-8 py-4 rounded-xl font-semibold text-white text-base transition hover:opacity-90"
            style={{ backgroundColor: '#0D9488' }}>
            Browse Treatments
          </Link>
          <Link href="/faq"
            className="px-8 py-4 rounded-xl font-semibold text-base border-2 transition"
            style={{ borderColor: '#0D9488', color: '#0D9488' }}>
            Read the FAQ
          </Link>
        </div>
      </section>

      {/* Benefits grid */}
      <section className="py-20" style={{ backgroundColor: '#F8FAFC' }}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#0D9488' }}>Why models love it</span>
            <h2 className="text-3xl font-extrabold mt-2" style={{ color: '#0F172A' }}>Everything in your favour</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {BENEFITS.map((b) => (
              <div key={b.title} className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                <div className="text-3xl mb-4">{b.icon}</div>
                <h3 className="text-base font-bold mb-2" style={{ color: '#0F172A' }}>{b.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#64748B' }}>{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#0D9488' }}>How it works</span>
            <h2 className="text-3xl font-extrabold mt-2" style={{ color: '#0F172A' }}>Three steps to your next treatment</h2>
          </div>
          <div className="space-y-6">
            {[
              { step: '01', title: 'Create a free account', desc: 'Sign up with your email. No credit card needed unless you book a paid session.' },
              { step: '02', title: 'Find a session near you', desc: 'Search by suburb, category, or price. Filter to free only if that\'s what you\'re after.' },
              { step: '03', title: 'Book and show up', desc: 'Confirm your slot, add it to your calendar, and arrive on time. Leave a review to help the community.' },
            ].map((s) => (
              <div key={s.step} className="flex gap-6 items-start rounded-2xl p-6 border border-gray-100" style={{ backgroundColor: '#F8FAFC' }}>
                <span className="text-3xl font-extrabold shrink-0" style={{ color: '#0D9488' }}>{s.step}</span>
                <div>
                  <h3 className="font-bold text-base mb-1" style={{ color: '#0F172A' }}>{s.title}</h3>
                  <p className="text-sm" style={{ color: '#64748B' }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20" style={{ backgroundColor: '#F8FAFC' }}>
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#0D9488' }}>Common questions</span>
            <h2 className="text-3xl font-extrabold mt-2" style={{ color: '#0F172A' }}>Model FAQs</h2>
          </div>
          <div className="space-y-4">
            {FAQS.map((f) => (
              <div key={f.q} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h3 className="font-bold text-sm mb-2" style={{ color: '#0F172A' }}>{f.q}</h3>
                <p className="text-sm" style={{ color: '#64748B' }}>{f.a}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/faq" className="text-sm font-semibold hover:underline" style={{ color: '#0D9488' }}>
              See all FAQs →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-white text-center px-4">
        <h2 className="text-3xl font-extrabold mb-4" style={{ color: '#0F172A' }}>Ready to find your next call?</h2>
        <p className="text-base mb-8 max-w-md mx-auto" style={{ color: '#64748B' }}>
          Browse hundreds of free and discounted treatments right now, no account needed to look.
        </p>
        <Link href="/#browse"
          className="inline-block px-10 py-4 rounded-xl font-semibold text-white text-base transition hover:opacity-90"
          style={{ backgroundColor: '#0D9488' }}>
          Browse Treatments
        </Link>
      </section>
    </>
  );
}
