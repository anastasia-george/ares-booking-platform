// pages/for-businesses.tsx
import Head from 'next/head';
import Link from 'next/link';

const BENEFITS = [
  {
    icon: '🪑',
    title: 'Fill every empty chair',
    desc: 'Stop leaving revenue on the table. Model Call turns downtime into paid training hours and portfolio content.',
  },
  {
    icon: '📲',
    title: 'Zero admin overhead',
    desc: 'List in minutes. Models self-book, receive confirmations, and are reminded automatically — all without a single DM.',
  },
  {
    icon: '⭐',
    title: 'Build your reputation',
    desc: 'Each completed session generates a verified review. Your rating grows, your listing rises, your calendar fills.',
  },
  {
    icon: '🎓',
    title: 'Perfect for student training',
    desc: 'Academies use Model Call to source willing, informed models for supervised student assessments.',
  },
  {
    icon: '💳',
    title: 'Flexible pricing',
    desc: 'Offer sessions for free, at a flat rate, or at a discount from your standard menu price. You decide.',
  },
  {
    icon: '🛡️',
    title: 'No-show protection',
    desc: 'Models add a card on file at checkout. If they ghost you, you can charge a no-show fee automatically.',
  },
];

const FAQS = [
  {
    q: 'How quickly can I get listed?',
    a: "Complete the onboarding wizard in about 5 minutes. We'll review and approve your listing within 1 business day.",
  },
  {
    q: 'What does it cost to list?',
    a: 'Model Call is free during our launch period. A small platform fee will apply when we introduce paid tiers — existing businesses will be grandfathered in.',
  },
  {
    q: 'Can I list multiple services?',
    a: 'Yes. You can list as many services as you like from your business dashboard. Each service can have its own price, duration, and availability.',
  },
  {
    q: 'How do no-show fees work?',
    a: "Models provide a card on file at booking. If they don't show, you can trigger a charge from your dashboard — up to the maximum fee you set in your policy.",
  },
  {
    q: 'Can I approve models before they book?',
    a: 'Currently listings are instant-book. Approval-gated bookings are on our roadmap.',
  },
];

export default function ForBusinesses() {
  return (
    <>
      <Head>
        <title>For Businesses — Model Call</title>
        <meta name="description" content="Fill empty chairs, run student training days, and build your reputation with Model Call — Australia's beauty marketplace." />
      </Head>

      {/* Hero */}
      <section style={{ backgroundColor: '#0F172A' }} className="py-24 text-center px-4">
        <span className="inline-block text-xs font-semibold tracking-widest uppercase mb-4 px-3 py-1 rounded-full border"
          style={{ color: '#0D9488', borderColor: '#0D9488' }}>
          For Clinics &amp; Academies
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight max-w-3xl mx-auto">
          Fill your seats.<br /><span style={{ color: '#0D9488' }}>Grow your brand.</span>
        </h1>
        <p className="mt-6 text-lg max-w-2xl mx-auto" style={{ color: '#94A3B8' }}>
          Model Call makes it effortless to attract motivated models for training days, student assessments, and portfolio shoots — with zero DMs required.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/onboard"
            className="px-8 py-4 rounded-xl font-semibold text-white text-base transition hover:opacity-90"
            style={{ backgroundColor: '#0D9488' }}>
            List Your First Service
          </Link>
          <Link href="/faq"
            className="px-8 py-4 rounded-xl font-semibold text-base border-2 transition"
            style={{ borderColor: '#0D9488', color: '#0D9488' }}>
            Read the FAQ
          </Link>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20" style={{ backgroundColor: '#F8FAFC' }}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#0D9488' }}>Why businesses choose us</span>
            <h2 className="text-3xl font-extrabold mt-2" style={{ color: '#0F172A' }}>Your calendar, always full</h2>
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
            <h2 className="text-3xl font-extrabold mt-2" style={{ color: '#0F172A' }}>From sign-up to booked out</h2>
          </div>
          <div className="space-y-6">
            {[
              { step: '01', title: 'List your business', desc: 'Complete the onboarding wizard with your business name, location, and first service. Takes about 5 minutes.' },
              { step: '02', title: 'Set your availability', desc: 'Define your open time slots. Models browse and claim spots in real time — no back-and-forth needed.' },
              { step: '03', title: 'Show up and deliver', desc: 'Models arrive, you do your thing, and reviews roll in automatically after each session.' },
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

      {/* Pricing teaser */}
      <section className="py-20" style={{ backgroundColor: '#F8FAFC' }}>
        <div className="max-w-3xl mx-auto px-4 text-center">
          <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#0D9488' }}>Pricing</span>
          <h2 className="text-3xl font-extrabold mt-2 mb-4" style={{ color: '#0F172A' }}>Free during launch</h2>
          <p className="text-base mb-8" style={{ color: '#64748B' }}>
            During our launch period, listing on Model Call is completely free. No subscription, no per-booking fee. Sign up now and lock in early-adopter rates when paid tiers launch.
          </p>
          <Link href="/onboard"
            className="inline-block px-10 py-4 rounded-xl font-semibold text-white text-base transition hover:opacity-90"
            style={{ backgroundColor: '#0D9488' }}>
            Get Listed for Free
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#0D9488' }}>Common questions</span>
            <h2 className="text-3xl font-extrabold mt-2" style={{ color: '#0F172A' }}>Business FAQs</h2>
          </div>
          <div className="space-y-4">
            {FAQS.map((f) => (
              <div key={f.q} className="rounded-2xl p-6 border border-gray-100 shadow-sm" style={{ backgroundColor: '#F8FAFC' }}>
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
    </>
  );
}
