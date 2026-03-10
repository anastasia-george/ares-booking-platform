// pages/index.tsx — ModelCall homepage + marketplace directory
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import prisma from '../lib/prisma';

const CATEGORIES = ['All', 'Lashes', 'Nails', 'Facials', 'Hair', 'Brows', 'Makeup', 'Waxing', 'Massage', 'Injectables'];

interface ServiceSnippet {
  id: string;
  name: string;
  price: number;
  originalPrice: number | null;
  durationMin: number;
  category: string | null;
}

interface BusinessCard {
  id: string;
  name: string;
  slug: string;
  suburb: string | null;
  city: string | null;
  state: string | null;
  avgRating: number | null;
  services: ServiceSnippet[];
}

interface Props {
  businesses: BusinessCard[];
  total: number;
  filters: { q: string; suburb: string; category: string; maxPrice: string };
}

const MODEL_STEPS = [
  { icon: '🔍', title: 'Search', desc: 'Find discounted treatments near you — filter by city, category, or price.' },
  { icon: '📅', title: 'Apply & Book', desc: 'Secure your spot instantly with zero phone calls or DMs needed.' },
  { icon: '✨', title: 'Get Glam', desc: 'Enjoy premium services for a fraction of the cost and leave glowing.' },
];

const BIZ_STEPS = [
  { icon: '📣', title: 'Post a Call', desc: 'List your training days or open slots in under two minutes.' },
  { icon: '💺', title: 'Fill Seats', desc: 'Connect with reliable, motivated models quickly — no chasing needed.' },
  { icon: '⭐', title: 'Build Portfolio', desc: 'Train your staff, collect reviews, and showcase your best work.' },
];

const FEATURED_CATS = [
  {
    label: 'Injectables & Cosmetic',
    emoji: '💉',
    desc: 'Anti-wrinkle, lip filler, and cosmetic consultations',
    gradient: 'linear-gradient(135deg,#67e8f9 0%,#0e7490 100%)',
    slug: 'Injectables',
  },
  {
    label: 'Lashes & Brows',
    emoji: '👁️',
    desc: 'Extensions, lifts, lamination, and designer brow shaping',
    gradient: 'linear-gradient(135deg,#f9a8d4 0%,#9d174d 100%)',
    slug: 'Lashes',
  },
  {
    label: 'Hair Styling & Color',
    emoji: '💇',
    desc: 'Cuts, balayage, keratin treatments, and blow-drys',
    gradient: 'linear-gradient(135deg,#7dd3fc 0%,#1d4ed8 100%)',
    slug: 'Hair',
  },
  {
    label: 'Skin & Laser',
    emoji: '🧖',
    desc: 'Facials, peels, laser treatments, and skin consultations',
    gradient: 'linear-gradient(135deg,#fde68a 0%,#b45309 100%)',
    slug: 'Facials',
  },
];

const TESTIMONIALS = [
  {
    quote: "I got a full set of lashes for free and the student was incredibly skilled. The booking took 30 seconds — I'll be back every month.",
    name: 'Emily R.',
    role: 'Model, Sydney',
    tag: 'Model',
    tagColor: '#0D9488',
    tagBg: 'rgba(13,148,136,0.12)',
  },
  {
    quote: "We filled 4 training slots in a single day. No more chasing people through Facebook groups or DMing hundreds of followers.",
    name: 'Priya M.',
    role: 'Clinic Director, Polished by Priya',
    tag: 'Clinic Director',
    tagColor: '#6366F1',
    tagBg: 'rgba(99,102,241,0.12)',
  },
  {
    quote: "Finally an easy way to find model calls near me. The whole booking experience felt professional — like a real app should.",
    name: 'Jess T.',
    role: 'Model, Melbourne',
    tag: 'Model',
    tagColor: '#0D9488',
    tagBg: 'rgba(13,148,136,0.12)',
  },
];

const CAT_GRADIENTS: Record<string, string> = {
  Lashes: 'linear-gradient(135deg,#f9a8d4 0%,#9d174d 100%)',
  Nails: 'linear-gradient(135deg,#c4b5fd 0%,#5b21b6 100%)',
  Facials: 'linear-gradient(135deg,#fde68a 0%,#b45309 100%)',
  Hair: 'linear-gradient(135deg,#7dd3fc 0%,#1d4ed8 100%)',
  Brows: 'linear-gradient(135deg,#86efac 0%,#15803d 100%)',
  Makeup: 'linear-gradient(135deg,#fca5a5 0%,#b91c1c 100%)',
  Waxing: 'linear-gradient(135deg,#6ee7b7 0%,#065f46 100%)',
  Massage: 'linear-gradient(135deg,#a5b4fc 0%,#3730a3 100%)',
  Injectables: 'linear-gradient(135deg,#67e8f9 0%,#0e7490 100%)',
  Other: 'linear-gradient(135deg,#94a3b8 0%,#334155 100%)',
};
const DEFAULT_GRADIENT = 'linear-gradient(135deg,#0D9488 0%,#0F172A 100%)';
function catGradient(cat: string | null) {
  return (cat && CAT_GRADIENTS[cat]) ? CAT_GRADIENTS[cat] : DEFAULT_GRADIENT;
}
const CAT_EMOJIS: Record<string, string> = {
  Lashes: '👁️', Nails: '💅', Facials: '🧖', Hair: '💇',
  Brows: '🪮', Makeup: '💄', Waxing: '✨', Massage: '🙌',
  Injectables: '💉', Other: '⭐',
};
function catEmoji(cat: string | null) {
  return (cat && CAT_EMOJIS[cat]) ? CAT_EMOJIS[cat] : '✨';
}

export default function Home({ businesses, total, filters }: Props) {
  const router = useRouter();
  const [q, setQ] = useState(filters.q);
  const [suburb, setSuburb] = useState(filters.suburb);
  const [category, setCategory] = useState(filters.category || 'All');
  const [maxPrice, setMaxPrice] = useState(filters.maxPrice);
  const [howTab, setHowTab] = useState<'model' | 'biz'>('model');
  const hasFilters = !!(filters.q || filters.suburb || filters.category || filters.maxPrice);

  function applyFilters(overrides?: Partial<typeof filters>) {
    const params = new URLSearchParams();
    const f = { q, suburb, category, maxPrice, ...overrides };
    if (f.q) params.set('q', f.q);
    if (f.suburb) params.set('suburb', f.suburb);
    if (f.category && f.category !== 'All') params.set('category', f.category);
    if (f.maxPrice) params.set('maxPrice', f.maxPrice);
    router.push(`/?${params.toString()}`);
  }

  const steps = howTab === 'model' ? MODEL_STEPS : BIZ_STEPS;

  return (
    <>
      <Head>
        <title>Model Call — Free &amp; Discounted Beauty Treatments Across Australia</title>
        <meta name="description" content="Book free and discounted beauty model calls across Australia. Find lashes, injectables, facials, nails and more from talented students and professionals." />
      </Head>

      {/* ════════════════════════════════════════════════════════════════
          HERO
      ════════════════════════════════════════════════════════════════ */}
      {!hasFilters && (
        <section style={{ backgroundColor: '#F8FAFC' }} className="relative overflow-hidden">
          {/* Decorative background blobs */}
          <div className="absolute inset-0 pointer-events-none" aria-hidden>
            <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full opacity-[0.07] blur-3xl"
              style={{ backgroundColor: '#0D9488' }} />
            <div className="absolute top-1/2 -left-32 w-72 h-72 rounded-full opacity-[0.05] blur-3xl"
              style={{ backgroundColor: '#0F172A' }} />
          </div>

          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-28 text-center">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase mb-8"
              style={{ backgroundColor: 'rgba(13,148,136,0.1)', color: '#0D9488' }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#0D9488' }} />
              Australia&rsquo;s Beauty Marketplace
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold leading-[1.04] mb-6"
              style={{ color: '#0F172A', letterSpacing: '-2px' }}>
              Find your next<br />
              <span style={{ color: '#0D9488' }}>beauty model call.</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed mb-10"
              style={{ color: '#64748B' }}>
              Discover free and discounted treatments from talented students and industry
              professionals across Australia.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a href="#browse"
                className="w-full sm:w-auto px-9 py-4 rounded-2xl font-bold text-base text-white transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5"
                style={{
                  background: 'linear-gradient(135deg,#0D9488 0%,#065F46 100%)',
                  boxShadow: '0 8px 28px rgba(13,148,136,0.35)',
                }}>
                Browse Treatments
              </a>
              <Link href="/onboard"
                className="w-full sm:w-auto px-9 py-4 rounded-2xl font-bold text-base border-2 transition-all duration-200 hover:-translate-y-0.5 hover:bg-gray-50"
                style={{ borderColor: '#0F172A', color: '#0F172A' }}>
                List a Service
              </Link>
            </div>

            {/* Trust indicator */}
            <p className="mt-6 text-sm font-medium" style={{ color: '#94A3B8' }}>
              ✓&nbsp; Trusted by 500+ top clinics and academies across Australia
            </p>

            {/* Stat pills */}
            <div className="mt-16 flex flex-wrap justify-center gap-4">
              {[
                { val: 'Free', label: 'treatments available' },
                { val: '5-star', label: 'rated businesses' },
                { val: '100%', label: 'vetted & verified' },
              ].map(({ val, label }) => (
                <div key={val}
                  className="bg-white rounded-2xl px-7 py-4 shadow-sm border border-gray-100 text-center"
                  style={{ minWidth: '130px' }}>
                  <p className="text-2xl font-extrabold" style={{ color: '#0F172A' }}>{val}</p>
                  <p className="text-xs mt-0.5 font-medium" style={{ color: '#94A3B8' }}>{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════════════════════
          HOW IT WORKS — DUAL TOGGLE
      ════════════════════════════════════════════════════════════════ */}
      {!hasFilters && (
        <section id="how-it-works" className="py-24 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">

            <div className="text-center mb-14">
              <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: '#0D9488' }}>How it works</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold mb-8"
                style={{ color: '#0F172A', letterSpacing: '-1px' }}>
                Built for both sides of the beauty industry
              </h2>

              {/* Toggle pill */}
              <div className="inline-flex items-center rounded-2xl p-1.5 gap-1" style={{ backgroundColor: '#F1F5F9' }}>
                {(['model', 'biz'] as const).map((tab) => (
                  <button key={tab}
                    onClick={() => setHowTab(tab)}
                    className="px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-200"
                    style={howTab === tab
                      ? { backgroundColor: '#0F172A', color: '#fff', boxShadow: '0 2px 10px rgba(15,23,42,0.25)' }
                      : { backgroundColor: 'transparent', color: '#64748B' }}>
                    {tab === 'model' ? "I'm a Model / Customer" : "I'm a Business"}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {steps.map((s, i) => (
                <div key={s.title}
                  className="relative rounded-3xl p-8 overflow-hidden border border-gray-100 group hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300"
                  style={{ backgroundColor: '#F8FAFC' }}>
                  {/* Watermark */}
                  <div className="absolute -top-6 -right-2 text-[120px] font-extrabold select-none pointer-events-none leading-none"
                    style={{ color: howTab === 'model' ? 'rgba(13,148,136,0.05)' : 'rgba(15,23,42,0.04)' }}>
                    {i + 1}
                  </div>
                  <div className="relative">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-6"
                      style={{
                        background: howTab === 'model'
                          ? 'linear-gradient(135deg,#0D9488,#065F46)'
                          : 'linear-gradient(135deg,#0F172A,#1E3A5F)',
                      }}>
                      {s.icon}
                    </div>
                    <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: '#0D9488' }}>Step {i + 1}</p>
                    <h3 className="text-xl font-extrabold mb-2" style={{ color: '#0F172A' }}>{s.title}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: '#64748B' }}>{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-10">
              <Link
                href={howTab === 'model' ? '/for-models' : '/for-businesses'}
                className="text-sm font-bold inline-flex items-center gap-1 hover:gap-2 transition-all"
                style={{ color: '#0D9488' }}>
                {howTab === 'model' ? 'Learn more about being a model' : 'Why businesses choose Model Call'}
                <span>→</span>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════════════════════
          FEATURED CATEGORIES
      ════════════════════════════════════════════════════════════════ */}
      {!hasFilters && (
        <section className="py-24" style={{ backgroundColor: '#F8FAFC' }}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: '#0D9488' }}>Categories</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold"
                style={{ color: '#0F172A', letterSpacing: '-1px' }}>
                Popular Treatments
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {FEATURED_CATS.map((c) => (
                <button key={c.label}
                  onClick={() => { setCategory(c.slug); applyFilters({ category: c.slug }); }}
                  className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group text-left">

                  {/* Gradient header */}
                  <div className="h-36 relative flex items-center justify-center overflow-hidden"
                    style={{ background: c.gradient }}>
                    {/* Dot pattern overlay */}
                    <div className="absolute inset-0 opacity-10"
                      style={{
                        backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                        backgroundSize: '18px 18px',
                      }} />
                    <span className="text-5xl relative z-10 select-none drop-shadow-lg group-hover:scale-110 transition-transform duration-300">
                      {c.emoji}
                    </span>
                  </div>

                  {/* Card body */}
                  <div className="p-5">
                    <h3 className="font-extrabold text-sm leading-snug mb-1.5" style={{ color: '#0F172A' }}>
                      {c.label}
                    </h3>
                    <p className="text-xs leading-relaxed mb-3" style={{ color: '#94A3B8' }}>{c.desc}</p>
                    <span className="text-xs font-bold inline-flex items-center gap-1" style={{ color: '#0D9488' }}>
                      Browse
                      <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <div className="text-center mt-10">
              <button
                onClick={() => { setCategory('All'); applyFilters({ category: '' }); }}
                className="text-sm font-bold inline-flex items-center gap-1 hover:gap-2 transition-all"
                style={{ color: '#0D9488' }}>
                View All Categories →
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════════════════════
          SOCIAL PROOF — DARK NAVY
      ════════════════════════════════════════════════════════════════ */}
      {!hasFilters && (
        <section className="py-24" style={{ backgroundColor: '#0F172A' }}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-16">
              <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: '#0D9488' }}>Testimonials</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white"
                style={{ letterSpacing: '-1px' }}>
                Elevating the beauty industry,<br className="hidden sm:block" /> together.
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {TESTIMONIALS.map((t) => (
                <div key={t.name}
                  className="rounded-3xl p-8 border flex flex-col transition-all duration-200 hover:-translate-y-1"
                  style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.07)' }}>

                  {/* Role tag */}
                  <span className="inline-block self-start text-xs font-bold px-3 py-1 rounded-full mb-5"
                    style={{ backgroundColor: t.tagBg, color: t.tagColor }}>
                    {t.tag}
                  </span>

                  {/* Stars */}
                  <div className="text-amber-400 text-sm tracking-wide mb-4">★★★★★</div>

                  {/* Quote */}
                  <p className="text-base leading-relaxed flex-1 mb-6" style={{ color: '#CBD5E1' }}>
                    &ldquo;{t.quote}&rdquo;
                  </p>

                  {/* Author */}
                  <div className="flex items-center gap-3 pt-4"
                    style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-extrabold text-white shrink-0"
                      style={{ background: `linear-gradient(135deg,${t.tagColor} 0%,#0F172A 100%)` }}>
                      {t.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{t.name}</p>
                      <p className="text-xs" style={{ color: '#64748B' }}>{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════════════════════
          FINAL CTA BAND
      ════════════════════════════════════════════════════════════════ */}
      {!hasFilters && (
        <section className="py-24 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg,#0D9488 0%,#065F46 100%)' }}>
          {/* Decorative circles */}
          <div className="absolute inset-0 pointer-events-none" aria-hidden>
            <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-[0.12]"
              style={{ backgroundColor: '#fff' }} />
            <div className="absolute -bottom-16 -left-16 w-72 h-72 rounded-full opacity-[0.08]"
              style={{ backgroundColor: '#fff' }} />
          </div>
          <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-5"
              style={{ letterSpacing: '-1px' }}>
              Ready to put out the call?
            </h2>
            <p className="text-lg font-medium mb-10" style={{ color: 'rgba(255,255,255,0.78)' }}>
              Join thousands of models and top-tier beauty professionals today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/onboard"
                className="px-9 py-4 rounded-2xl font-bold text-base transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
                style={{ backgroundColor: '#fff', color: '#0D9488' }}>
                Create Free Account
              </Link>
              <a href="#browse"
                className="px-9 py-4 rounded-2xl font-bold text-base border-2 text-white transition-all duration-200 hover:-translate-y-0.5"
                style={{ borderColor: 'rgba(255,255,255,0.45)' }}>
                Browse Treatments
              </a>
            </div>
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════════════════════
          SEARCH + LISTINGS
      ════════════════════════════════════════════════════════════════ */}
      <section id="browse" className="py-16" style={{ backgroundColor: '#F8FAFC' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">

          {/* Section header when no filters */}
          {!hasFilters && (
            <div className="mb-10">
              <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: '#0D9488' }}>Listings</p>
              <h2 className="text-2xl sm:text-3xl font-extrabold" style={{ color: '#0F172A', letterSpacing: '-0.5px' }}>Available near you</h2>
            </div>
          )}

          {/* Search bar */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-8">
            <form onSubmit={(e) => { e.preventDefault(); applyFilters(); }}
              className="flex flex-col sm:flex-row gap-3">
              <input
                type="text" placeholder="Search treatments, businesses…" value={q}
                onChange={(e) => setQ(e.target.value)}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': '#0D9488' } as React.CSSProperties}
              />
              <input
                type="text" placeholder="Suburb or city" value={suburb}
                onChange={(e) => setSuburb(e.target.value)}
                className="w-full sm:w-44 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': '#0D9488' } as React.CSSProperties}
              />
              <button type="submit"
                className="px-6 py-3 text-white rounded-xl font-semibold text-sm transition hover:opacity-90"
                style={{ backgroundColor: '#0D9488' }}>
                Search
              </button>
            </form>

            {/* Category pills */}
            <div className="flex gap-2 flex-wrap mt-4 items-center">
              {CATEGORIES.map((cat) => (
                <button key={cat} onClick={() => { setCategory(cat); applyFilters({ category: cat }); }}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium border transition`}
                  style={category === cat
                    ? { backgroundColor: '#0D9488', color: '#fff', borderColor: '#0D9488' }
                    : { backgroundColor: '#fff', color: '#64748B', borderColor: '#E2E8F0' }}>
                  {cat}
                </button>
              ))}
              <div className="ml-auto flex items-center gap-2">
                <label className="text-xs whitespace-nowrap" style={{ color: '#64748B' }}>Max $</label>
                <input type="number" min={0} placeholder="Any" value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)} onBlur={() => applyFilters()}
                  className="w-20 px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none"
                />
              </div>
            </div>
          </div>

          <p className="text-sm mb-5" style={{ color: '#64748B' }}>{total} {total === 1 ? 'listing' : 'listings'} found</p>

          {businesses.length === 0 ? (
            <div className="text-center py-24">
              <div className="text-5xl mb-4">🔍</div>
              <p className="text-lg font-semibold mb-2" style={{ color: '#0F172A' }}>No listings found</p>
              <p className="text-sm mb-6" style={{ color: '#94A3B8' }}>Try a different suburb, category, or clear your filters.</p>
              <Link href="/" className="inline-block px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ backgroundColor: '#0D9488' }}>Clear filters</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {businesses.map((biz) => {
                const featured = biz.services[0];
                const isFree = featured?.price === 0;
                return (
                  <Link key={biz.id} href={`/businesses/${biz.slug}`}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 overflow-hidden flex flex-col group">
                    {/* Gradient cover */}
                    <div className="relative h-28 flex items-center justify-center overflow-hidden"
                      style={{ background: catGradient(featured?.category ?? null) }}>
                      <span className="text-5xl select-none group-hover:scale-110 transition-transform duration-300 ease-out">
                        {catEmoji(featured?.category ?? null)}
                      </span>
                      {isFree && (
                        <span className="absolute top-3 left-3 text-xs font-extrabold tracking-wider px-2.5 py-1 rounded-full text-white"
                          style={{ backgroundColor: 'rgba(13,148,136,0.95)' }}>FREE</span>
                      )}
                      {biz.avgRating && (
                        <span className="absolute top-3 right-3 text-xs font-semibold px-2 py-1 rounded-full"
                          style={{ backgroundColor: 'rgba(0,0,0,0.35)', color: '#FDE68A' }}>
                          ★ {biz.avgRating.toFixed(1)}
                        </span>
                      )}
                    </div>
                    {/* Body */}
                    <div className="p-5 flex flex-col flex-1">
                      <h2 className="font-bold text-base leading-snug mb-1" style={{ color: '#0F172A' }}>
                        {biz.name}
                      </h2>
                      {(biz.suburb || biz.city) && (
                        <p className="text-xs mb-3" style={{ color: '#94A3B8' }}>
                          📍 {[biz.suburb, biz.city].filter(Boolean).join(', ')}
                        </p>
                      )}
                      {featured && (
                        <div className="mt-auto pt-3 border-t border-gray-100">
                          <p className="text-sm font-medium mb-2 truncate" style={{ color: '#64748B' }}>
                            {featured.name}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-xl font-extrabold" style={{ color: isFree ? '#0D9488' : '#0F172A' }}>
                                {isFree ? 'FREE' : `$${(featured.price / 100).toFixed(0)}`}
                              </span>
                              {featured.originalPrice && featured.originalPrice > featured.price && (
                                <span className="text-xs line-through font-medium" style={{ color: '#CBD5E1' }}>
                                  ${(featured.originalPrice / 100).toFixed(0)}
                                </span>
                              )}
                            </div>
                            <span className="text-xs font-medium px-2 py-1 rounded-lg"
                              style={{ backgroundColor: '#F1F5F9', color: '#64748B' }}>
                              {featured.durationMin} min
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    {/* Hover CTA */}
                    <div className="px-5 pb-5">
                      <div className="py-2.5 rounded-xl text-sm font-bold text-center text-white opacity-0 group-hover:opacity-100 transition-all duration-200"
                        style={{ background: 'linear-gradient(135deg,#0D9488 0%,#065F46 100%)' }}>
                        View &amp; Book →
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ query }) => {
  const q = (query.q as string) || '';
  const suburb = (query.suburb as string) || '';
  const category = (query.category as string) || '';
  const maxPrice = (query.maxPrice as string) || '';

  try {
    const businesses = await prisma.business.findMany({
      where: {
        verified: true,
        isAcceptingModels: true,
        services: {
          some: {
            isActive: true,
            ...(category ? { category: { equals: category, mode: 'insensitive' } } : {}),
            ...(q ? { name: { contains: q, mode: 'insensitive' } } : {}),
            ...(maxPrice ? { price: { lte: Math.round(parseFloat(maxPrice) * 100) } } : {}),
          },
        },
        ...(suburb ? {
          OR: [
            { suburb: { contains: suburb, mode: 'insensitive' } },
            { city: { contains: suburb, mode: 'insensitive' } },
          ],
        } : {}),
      },
      include: {
        services: {
          where: { isActive: true },
          orderBy: { price: 'asc' },
          take: 3,
        },
      },
      orderBy: [{ avgRating: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }],
      take: 48,
    });

    return {
      props: {
        businesses: businesses.map((b) => ({
          id: b.id, name: b.name, slug: b.slug,
          suburb: b.suburb ?? null, city: b.city ?? null, state: b.state ?? null,
          avgRating: b.avgRating ?? null,
          services: b.services.map((s) => ({
            id: s.id, name: s.name, price: s.price,
            originalPrice: s.originalPrice ?? null,
            durationMin: s.durationMin, category: s.category ?? null,
          })),
        })),
        total: businesses.length,
        filters: { q, suburb, category, maxPrice },
      },
    };
  } catch (err) {
    console.error('[getServerSideProps /]', err);
    return { props: { businesses: [], total: 0, filters: { q, suburb, category, maxPrice } } };
  }
};
