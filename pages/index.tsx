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

// ─── Gradient + emoji helpers ─────────────────────────────────────────────────

const CAT_GRADIENTS: Record<string, string> = {
  Lashes:      'linear-gradient(135deg,#f9a8d4 0%,#9d174d 100%)',
  Nails:       'linear-gradient(135deg,#c4b5fd 0%,#5b21b6 100%)',
  Facials:     'linear-gradient(135deg,#fde68a 0%,#b45309 100%)',
  Hair:        'linear-gradient(135deg,#7dd3fc 0%,#1d4ed8 100%)',
  Brows:       'linear-gradient(135deg,#86efac 0%,#15803d 100%)',
  Makeup:      'linear-gradient(135deg,#fca5a5 0%,#b91c1c 100%)',
  Waxing:      'linear-gradient(135deg,#6ee7b7 0%,#065f46 100%)',
  Massage:     'linear-gradient(135deg,#a5b4fc 0%,#3730a3 100%)',
  Injectables: 'linear-gradient(135deg,#67e8f9 0%,#0e7490 100%)',
  Other:       'linear-gradient(135deg,#94a3b8 0%,#334155 100%)',
};
const DEFAULT_GRADIENT = 'linear-gradient(135deg,#0D9488 0%,#0F172A 100%)';
function catGradient(cat: string | null) {
  return cat && CAT_GRADIENTS[cat] ? CAT_GRADIENTS[cat] : DEFAULT_GRADIENT;
}
const CAT_EMOJIS: Record<string, string> = {
  Lashes: '👁️', Nails: '💅', Facials: '🧖', Hair: '💇',
  Brows: '🪮', Makeup: '💄', Waxing: '✨', Massage: '🙌',
  Injectables: '💉', Other: '⭐',
};
function catEmoji(cat: string | null) {
  return cat && CAT_EMOJIS[cat] ? CAT_EMOJIS[cat] : '✨';
}

// ─── Static page data ─────────────────────────────────────────────────────────

const FEATURED_CATS = [
  {
    label: 'Injectables & Cosmetic',
    emoji: '💉',
    desc: 'Anti-wrinkle, lip filler & cosmetic consultations',
    gradient: 'linear-gradient(135deg,#67e8f9 0%,#0e7490 100%)',
    slug: 'Injectables',
  },
  {
    label: 'Lashes & Brows',
    emoji: '👁️',
    desc: 'Extensions, lifts, lamination & brow design',
    gradient: 'linear-gradient(135deg,#f9a8d4 0%,#9d174d 100%)',
    slug: 'Lashes',
  },
  {
    label: 'Hair Styling & Color',
    emoji: '💇',
    desc: 'Cuts, balayage, keratin treatments & blow-drys',
    gradient: 'linear-gradient(135deg,#7dd3fc 0%,#1d4ed8 100%)',
    slug: 'Hair',
  },
  {
    label: 'Skin & Laser',
    emoji: '🧖',
    desc: 'Facials, peels, laser & skin consultations',
    gradient: 'linear-gradient(135deg,#fde68a 0%,#b45309 100%)',
    slug: 'Facials',
  },
];

const MOCK_LISTINGS: BusinessCard[] = [
  {
    id: 'mock-1', name: 'Lip Filler Model Needed', slug: '',
    suburb: 'Surry Hills', city: 'Sydney', state: 'NSW', avgRating: 5.0,
    services: [{ id: 's1', name: 'Lip Filler', price: 0, originalPrice: 49900, durationMin: 45, category: 'Injectables' }],
  },
  {
    id: 'mock-2', name: 'Volume Lash Extensions', slug: '',
    suburb: 'Prahran', city: 'Melbourne', state: 'VIC', avgRating: 5.0,
    services: [{ id: 's2', name: 'Volume Lash Set', price: 0, originalPrice: 18000, durationMin: 90, category: 'Lashes' }],
  },
  {
    id: 'mock-3', name: 'Balayage Colour Model', slug: '',
    suburb: 'Newtown', city: 'Sydney', state: 'NSW', avgRating: 4.9,
    services: [{ id: 's3', name: 'Full Balayage', price: 2000, originalPrice: 32000, durationMin: 180, category: 'Hair' }],
  },
];

const TESTIMONIALS = [
  {
    quote: "I got a full set of lashes for free and the student was incredibly skilled. The booking took 30 seconds — I'll be back every month.",
    name: 'Emily R.', role: 'Model, Sydney', tag: 'Model', tagColor: '#0D9488',
  },
  {
    quote: "We filled 4 training slots in a single day. No more chasing people through Facebook groups or DMing hundreds of followers.",
    name: 'Priya M.', role: 'Clinic Director, Polished by Priya', tag: 'Clinic Director', tagColor: '#6366F1',
  },
  {
    quote: "Finally an easy way to find model calls near me. The whole booking experience felt professional — like a real app should.",
    name: 'Jess T.', role: 'Model, Melbourne', tag: 'Model', tagColor: '#0D9488',
  },
];

// ─── Page component ───────────────────────────────────────────────────────────

export default function Home({ businesses, total, filters }: Props) {
  const router = useRouter();
  const [q, setQ]           = useState(filters.q);
  const [suburb, setSuburb] = useState(filters.suburb);
  const [category, setCategory] = useState(filters.category || 'All');
  const [maxPrice, setMaxPrice] = useState(filters.maxPrice);
  const hasFilters = !!(filters.q || filters.suburb || filters.category || filters.maxPrice);

  function applyFilters(overrides?: Partial<typeof filters>) {
    const params = new URLSearchParams();
    const f = { q, suburb, category, maxPrice, ...overrides };
    if (f.q)                             params.set('q',        f.q);
    if (f.suburb)                        params.set('suburb',   f.suburb);
    if (f.category && f.category !== 'All') params.set('category', f.category);
    if (f.maxPrice)                      params.set('maxPrice', f.maxPrice);
    router.push(`/?${params.toString()}`);
  }

  const previewListings = businesses.length > 0 ? businesses.slice(0, 3) : MOCK_LISTINGS;

  return (
    <>
      <Head>
        <title>Model Call — Free &amp; Discounted Beauty Treatments Across Australia</title>
        <meta name="description" content="Book free and discounted beauty model calls across Australia. Find lashes, injectables, facials, nails and more from talented students and professionals." />
      </Head>

      {/* ══════════════════════════════════════════════════════════════
          A.  HERO
      ══════════════════════════════════════════════════════════════ */}
      {!hasFilters && (
        <section className="min-h-[85vh] flex items-center justify-center bg-[#F8FAFC] py-20 px-6 relative overflow-hidden">
          {/* bg blobs */}
          <div className="absolute inset-0 pointer-events-none" aria-hidden>
            <div className="absolute -top-40 -right-32 w-[560px] h-[560px] rounded-full bg-[#0D9488] opacity-[0.06] blur-3xl" />
            <div className="absolute bottom-0 -left-24 w-80 h-80 rounded-full bg-[#0F172A] opacity-[0.04] blur-3xl" />
          </div>

          <div className="relative max-w-4xl mx-auto text-center">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-[0.18em] uppercase mb-8 bg-[#0D9488]/10 text-[#0D9488]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488] animate-pulse" />
              Australia&rsquo;s Beauty Marketplace
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-[#0F172A] tracking-tighter leading-[1.02] mb-6">
              Australia&rsquo;s<br />
              <span className="text-[#0D9488]">Beauty Marketplace.</span>
            </h1>

            {/* Sub */}
            <p className="text-xl text-[#64748B] mb-10 max-w-2xl mx-auto leading-relaxed">
              Discover free and discounted treatments from talented students and industry
              professionals across Australia.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <a href="#browse"
                className="bg-[#0D9488] text-white px-8 py-4 rounded-full font-semibold shadow-lg shadow-[#0D9488]/30 hover:scale-105 hover:shadow-xl hover:shadow-[#0D9488]/40 transition-all duration-200 text-base w-full sm:w-auto text-center min-w-[200px]">
                Browse Treatments
              </a>
              <Link href="/onboard"
                className="bg-white border-2 border-[#0F172A] text-[#0F172A] px-8 py-4 rounded-full font-semibold hover:bg-[#0F172A] hover:text-white transition-all duration-200 text-base w-full sm:w-auto text-center min-w-[200px]">
                List a Service
              </Link>
            </div>

            {/* Trust line */}
            <p className="text-xs text-[#94A3B8] tracking-[0.18em] uppercase mb-10">
              ✓&nbsp; Trusted by 500+ top clinics and academies across Australia
            </p>

            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-8 sm:gap-14">
              {[
                { stat: '10k+', label: 'Treatments Available' },
                { stat: '500+', label: 'Rated Businesses'     },
                { stat: '100%', label: 'Vetted & Verified'    },
              ].map(({ stat, label }) => (
                <div key={stat} className="text-center">
                  <p className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tighter">{stat}</p>
                  <p className="text-xs text-[#94A3B8] mt-1 font-medium uppercase tracking-widest">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════
          B.  HOW IT WORKS — 2-column side by side
      ══════════════════════════════════════════════════════════════ */}
      {!hasFilters && (
        <section id="how-it-works" className="py-24 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">

            <div className="text-center mb-16">
              <p className="text-xs font-bold tracking-[0.18em] uppercase text-[#0D9488] mb-3">How it works</p>
              <h2 className="text-4xl sm:text-5xl font-extrabold text-[#0F172A] tracking-tighter">
                How Model Call Works
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

              {/* For Models ─ cream card */}
              <div className="bg-[#F8FAFC] p-8 sm:p-10 rounded-3xl border border-gray-100 hover:shadow-xl transition-all duration-300">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-[#0D9488]/10 text-[#0D9488] mb-6 uppercase tracking-[0.15em]">
                  For Models &amp; Customers
                </div>
                <h3 className="text-2xl font-extrabold text-[#0F172A] mb-8 tracking-tight">Get glam. Save big.</h3>
                <div className="space-y-7">
                  {[
                    { icon: '🔍', step: '01', title: 'Search',       desc: 'Find discounted treatments near you — filter by city, category, or price.' },
                    { icon: '📅', step: '02', title: 'Apply & Book', desc: 'Secure your spot instantly with zero phone calls, DMs, or queues.' },
                    { icon: '✨', step: '03', title: 'Get Glam',     desc: 'Show up, enjoy a premium service for a fraction of the cost, and leave glowing.' },
                  ].map((s) => (
                    <div key={s.title} className="flex items-start gap-4">
                      <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-lg shrink-0 shadow-sm"
                        style={{ background: 'linear-gradient(135deg,#0D9488,#065F46)' }}>
                        {s.icon}
                      </div>
                      <div>
                        <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#0D9488] mb-0.5">{s.step}</p>
                        <p className="font-extrabold text-[#0F172A] mb-1">{s.title}</p>
                        <p className="text-sm text-[#64748B] leading-relaxed">{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Link href="/for-models"
                  className="inline-flex items-center gap-2 mt-9 text-sm font-bold text-[#0D9488] group hover:gap-3 transition-all duration-200">
                  Learn more about being a model
                  <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
                </Link>
              </div>

              {/* For Businesses ─ dark navy card */}
              <div className="bg-[#0F172A] p-8 sm:p-10 rounded-3xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden">
                <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-[#0D9488] opacity-10 blur-3xl pointer-events-none" />
                <div className="relative">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-[#0D9488]/20 text-[#0D9488] mb-6 uppercase tracking-[0.15em]">
                    For Clinics &amp; Academies
                  </div>
                  <h3 className="text-2xl font-extrabold text-white mb-8 tracking-tight">Fill every seat. Build your brand.</h3>
                  <div className="space-y-7">
                    {[
                      { icon: '📣', step: '01', title: 'Post a Call',    desc: 'List your training days or open slots in under two minutes.' },
                      { icon: '💺', step: '02', title: 'Fill Seats',      desc: 'Reliable, motivated models book instantly — no chasing needed.' },
                      { icon: '⭐', step: '03', title: 'Build Portfolio', desc: 'Collect verified reviews, grow your reputation, and attract clients.' },
                    ].map((s) => (
                      <div key={s.title} className="flex items-start gap-4">
                        <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-lg shrink-0 bg-[#0D9488]/20 border border-[#0D9488]/30">
                          {s.icon}
                        </div>
                        <div>
                          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#0D9488] mb-0.5">{s.step}</p>
                          <p className="font-extrabold text-white mb-1">{s.title}</p>
                          <p className="text-sm text-[#94A3B8] leading-relaxed">{s.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Link href="/for-businesses"
                    className="inline-flex items-center gap-2 mt-9 text-sm font-bold text-[#0D9488] group hover:gap-3 transition-all duration-200">
                    Why businesses choose Model Call
                    <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════
          C.  FEATURED CATEGORIES
      ══════════════════════════════════════════════════════════════ */}
      {!hasFilters && (
        <section className="py-24 bg-[#F8FAFC]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <p className="text-xs font-bold tracking-[0.18em] uppercase text-[#0D9488] mb-3">Categories</p>
              <h2 className="text-4xl sm:text-5xl font-extrabold text-[#0F172A] tracking-tighter">
                Popular Treatments
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {FEATURED_CATS.map((c) => (
                <button key={c.label}
                  onClick={() => { setCategory(c.slug); applyFilters({ category: c.slug }); }}
                  className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 p-6 flex flex-col items-center justify-center text-center cursor-pointer border-2 border-transparent hover:border-[#0D9488] group">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-5 shadow-md group-hover:scale-110 transition-transform duration-300"
                    style={{ background: c.gradient }}>
                    {c.emoji}
                  </div>
                  <h3 className="font-extrabold text-[#0F172A] text-sm mb-2 leading-snug">{c.label}</h3>
                  <p className="text-xs text-[#94A3B8] leading-relaxed mb-4">{c.desc}</p>
                  <span className="text-xs font-bold text-[#0D9488] flex items-center gap-1 group-hover:gap-2 transition-all duration-200">
                    Browse <span className="group-hover:translate-x-0.5 transition-transform duration-200">→</span>
                  </span>
                </button>
              ))}
            </div>

            <div className="text-center mt-10">
              <button
                onClick={() => { setCategory('All'); applyFilters({ category: '' }); }}
                className="text-sm font-bold text-[#0D9488] hover:opacity-70 transition-opacity">
                View All Categories →
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════
          D.  LIVE LISTINGS PREVIEW
      ══════════════════════════════════════════════════════════════ */}
      {!hasFilters && (
        <section className="py-20 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
              <div>
                <p className="text-xs font-bold tracking-[0.18em] uppercase text-[#0D9488] mb-2">Live Listings</p>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tighter">
                  Available Near You
                </h2>
              </div>
              <a href="#browse"
                className="inline-flex items-center gap-1 text-sm font-bold text-[#0D9488] hover:gap-2 transition-all duration-200 shrink-0">
                View all listings <span>→</span>
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {previewListings.map((biz) => {
                const featured   = biz.services[0];
                const isFree     = featured?.price === 0;
                const hasDiscount = !isFree && featured?.originalPrice && featured.originalPrice > featured.price;
                const grad       = catGradient(featured?.category ?? null);
                const emoji      = catEmoji(featured?.category ?? null);
                const href       = biz.slug ? `/businesses/${biz.slug}` : '/#browse';
                return (
                  <Link key={biz.id} href={href}
                    className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col bg-white">
                    {/* Gradient image placeholder — h-48 */}
                    <div className="h-48 relative flex items-center justify-center overflow-hidden"
                      style={{ background: grad }}>
                      <div className="absolute inset-0 opacity-[0.08]"
                        style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                      <span className="text-6xl select-none relative z-10 group-hover:scale-110 transition-transform duration-300 drop-shadow-lg">
                        {emoji}
                      </span>
                      {isFree && (
                        <span className="absolute top-3 left-3 bg-[#0D9488] text-white text-xs font-extrabold px-3 py-1.5 rounded-full shadow-lg">
                          FREE
                        </span>
                      )}
                      {hasDiscount && (
                        <span className="absolute top-3 left-3 bg-amber-500 text-white text-xs font-extrabold px-3 py-1.5 rounded-full shadow-lg">
                          DISCOUNT
                        </span>
                      )}
                      {biz.avgRating && (
                        <span className="absolute top-3 right-3 bg-black/30 text-yellow-300 text-xs font-semibold px-2.5 py-1.5 rounded-full backdrop-blur-sm flex items-center gap-1">
                          ★ {biz.avgRating.toFixed(1)}
                        </span>
                      )}
                    </div>

                    {/* Body */}
                    <div className="p-5 flex flex-col flex-1">
                      <h3 className="font-extrabold text-[#0F172A] text-base mb-1 leading-snug">{biz.name}</h3>
                      {(biz.suburb || biz.city) && (
                        <p className="text-sm text-[#94A3B8] mb-2 flex items-center gap-1">
                          <span>📍</span>
                          {[biz.suburb, biz.city].filter(Boolean).join(', ')}
                        </p>
                      )}
                      {featured && (
                        <p className="text-xs text-[#64748B] mb-3 truncate">
                          {featured.name} &middot; {featured.durationMin} min
                        </p>
                      )}
                      {featured && (
                        <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between">
                          <div className="flex items-baseline gap-1.5">
                            <span className={`font-extrabold text-xl ${isFree ? 'text-[#0D9488]' : 'text-[#0F172A]'}`}>
                              {isFree ? 'Free' : `$${(featured.price / 100).toFixed(0)}`}
                            </span>
                            {featured.originalPrice && featured.originalPrice > featured.price && (
                              <span className="text-xs line-through text-[#CBD5E1] font-medium">
                                ${(featured.originalPrice / 100).toFixed(0)}
                              </span>
                            )}
                          </div>
                          <span className="bg-[#0D9488] text-white text-xs font-bold px-4 py-2 rounded-full hover:bg-teal-700 transition-colors cursor-pointer">
                            Apply Now
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════
          E.  TESTIMONIALS — dark navy
      ══════════════════════════════════════════════════════════════ */}
      {!hasFilters && (
        <section className="py-24 bg-[#0F172A] text-white relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" aria-hidden>
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-[#0D9488] opacity-[0.05] blur-3xl" />
          </div>
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-16">
              <p className="text-xs font-bold tracking-[0.18em] uppercase text-[#0D9488] mb-3">Testimonials</p>
              <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tighter">
                Elevating the beauty industry,<br className="hidden sm:block" /> together.
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {TESTIMONIALS.map((t) => (
                <div key={t.name}
                  className="bg-white/10 p-8 rounded-2xl backdrop-blur-sm border border-white/20 flex flex-col hover:-translate-y-1.5 transition-all duration-300">
                  <div className="text-yellow-400 text-xl tracking-wider mb-5">★★★★★</div>
                  <span className="inline-block self-start text-xs font-bold px-3 py-1 rounded-full mb-5"
                    style={{ backgroundColor: `${t.tagColor}25`, color: t.tagColor }}>
                    {t.tag}
                  </span>
                  <p className="text-[#CBD5E1] leading-relaxed flex-1 mb-7 text-[15px]">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="flex items-center gap-3 pt-5 border-t border-white/10">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-extrabold text-white shrink-0"
                      style={{ background: `linear-gradient(135deg,${t.tagColor} 0%,#0F172A 100%)` }}>
                      {t.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{t.name}</p>
                      <p className="text-xs text-[#64748B]">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════
          F.  CTA BANNER — electric teal
      ══════════════════════════════════════════════════════════════ */}
      {!hasFilters && (
        <section className="bg-[#0D9488] py-20 text-center text-white relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" aria-hidden>
            <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/10" />
            <div className="absolute -bottom-16 -left-16 w-72 h-72 rounded-full bg-white/5" />
          </div>
          <div className="relative max-w-3xl mx-auto px-4 sm:px-6">
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tighter mb-5">
              Join thousands of models<br className="hidden sm:block" /> and professionals today.
            </h2>
            <p className="text-white/80 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
              Create a free account and start booking — or list your first service in under two minutes.
            </p>
            <Link href="/onboard"
              className="inline-block bg-white text-[#0D9488] px-10 py-4 rounded-full font-bold text-base hover:scale-105 transition-all duration-200 shadow-2xl">
              Create Free Account
            </Link>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════
          G.  SEARCH + FULL LISTINGS
      ══════════════════════════════════════════════════════════════ */}
      <section id="browse" className="py-16 bg-[#F8FAFC]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">

          {!hasFilters && (
            <div className="mb-10">
              <p className="text-xs font-bold tracking-[0.18em] uppercase text-[#0D9488] mb-2">Browse All</p>
              <h2 className="text-3xl font-extrabold text-[#0F172A] tracking-tight">All Listings</h2>
            </div>
          )}

          {/* Search bar */}
          <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-5 mb-8">
            <form onSubmit={(e) => { e.preventDefault(); applyFilters(); }}
              className="flex flex-col sm:flex-row gap-3">
              <input
                type="text" placeholder="Search treatments, businesses…" value={q}
                onChange={(e) => setQ(e.target.value)}
                className="flex-1 px-4 py-3 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 text-[#0F172A] placeholder:text-[#94A3B8]"
              />
              <input
                type="text" placeholder="Suburb or city" value={suburb}
                onChange={(e) => setSuburb(e.target.value)}
                className="w-full sm:w-44 px-4 py-3 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 text-[#0F172A] placeholder:text-[#94A3B8]"
              />
              <button type="submit"
                className="px-6 py-3 bg-[#0D9488] text-white rounded-xl font-semibold text-sm hover:bg-teal-700 transition-colors">
                Search
              </button>
            </form>

            {/* Category pills */}
            <div className="flex gap-2 flex-wrap mt-4 items-center">
              {CATEGORIES.map((cat) => (
                <button key={cat}
                  onClick={() => { setCategory(cat); applyFilters({ category: cat }); }}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all duration-150 ${
                    category === cat
                      ? 'bg-[#0D9488] text-white border-[#0D9488]'
                      : 'bg-white text-[#64748B] border-[#E2E8F0] hover:border-[#0D9488] hover:text-[#0D9488]'
                  }`}>
                  {cat}
                </button>
              ))}
              <div className="ml-auto flex items-center gap-2">
                <label className="text-xs text-[#64748B] whitespace-nowrap">Max $</label>
                <input type="number" min={0} placeholder="Any" value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)} onBlur={() => applyFilters()}
                  className="w-20 px-2 py-1.5 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none text-[#0F172A]"
                />
              </div>
            </div>
          </div>

          <p className="text-sm text-[#64748B] mb-5 font-medium">
            {total} {total === 1 ? 'listing' : 'listings'} found
          </p>

          {businesses.length === 0 ? (
            <div className="text-center py-24">
              <div className="text-5xl mb-4">🔍</div>
              <p className="text-lg font-extrabold mb-2 text-[#0F172A]">No listings found</p>
              <p className="text-sm mb-6 text-[#94A3B8]">Try a different suburb, category, or clear your filters.</p>
              <Link href="/" className="inline-block px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#0D9488] hover:bg-teal-700 transition-colors">
                Clear filters
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {businesses.map((biz) => {
                const featured = biz.services[0];
                const isFree   = featured?.price === 0;
                return (
                  <Link key={biz.id} href={`/businesses/${biz.slug}`}
                    className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] hover:shadow-xl hover:-translate-y-1 transition-all duration-200 overflow-hidden flex flex-col group">
                    <div className="relative h-28 flex items-center justify-center overflow-hidden"
                      style={{ background: catGradient(featured?.category ?? null) }}>
                      <span className="text-5xl select-none group-hover:scale-110 transition-transform duration-300 ease-out">
                        {catEmoji(featured?.category ?? null)}
                      </span>
                      {isFree && (
                        <span className="absolute top-3 left-3 text-xs font-extrabold tracking-wider px-2.5 py-1 rounded-full text-white bg-[#0D9488]">
                          FREE
                        </span>
                      )}
                      {biz.avgRating && (
                        <span className="absolute top-3 right-3 text-xs font-semibold px-2 py-1 rounded-full bg-black/30 text-yellow-300 backdrop-blur-sm">
                          ★ {biz.avgRating.toFixed(1)}
                        </span>
                      )}
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      <h2 className="font-bold text-base leading-snug mb-1 text-[#0F172A]">{biz.name}</h2>
                      {(biz.suburb || biz.city) && (
                        <p className="text-xs mb-3 text-[#94A3B8]">
                          📍 {[biz.suburb, biz.city].filter(Boolean).join(', ')}
                        </p>
                      )}
                      {featured && (
                        <div className="mt-auto pt-3 border-t border-slate-100">
                          <p className="text-sm font-medium mb-2 truncate text-[#64748B]">{featured.name}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-baseline gap-1.5">
                              <span className={`text-xl font-extrabold ${isFree ? 'text-[#0D9488]' : 'text-[#0F172A]'}`}>
                                {isFree ? 'FREE' : `$${(featured.price / 100).toFixed(0)}`}
                              </span>
                              {featured.originalPrice && featured.originalPrice > featured.price && (
                                <span className="text-xs line-through font-medium text-[#CBD5E1]">
                                  ${(featured.originalPrice / 100).toFixed(0)}
                                </span>
                              )}
                            </div>
                            <span className="text-xs font-medium px-2 py-1 rounded-lg bg-[#F1F5F9] text-[#64748B]">
                              {featured.durationMin} min
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="px-5 pb-5">
                      <div className="py-2.5 rounded-xl text-sm font-bold text-center text-white opacity-0 group-hover:opacity-100 transition-all duration-200 bg-[#0D9488]">
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

// ─── Data fetching ─────────────────────────────────────────────────────────────

export const getServerSideProps: GetServerSideProps = async ({ query }) => {
  const q        = (query.q        as string) || '';
  const suburb   = (query.suburb   as string) || '';
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
            ...(q        ? { name:     { contains: q,        mode: 'insensitive' } } : {}),
            ...(maxPrice ? { price:    { lte: Math.round(parseFloat(maxPrice) * 100) } } : {}),
          },
        },
        ...(suburb ? {
          OR: [
            { suburb: { contains: suburb, mode: 'insensitive' } },
            { city:   { contains: suburb, mode: 'insensitive' } },
          ],
        } : {}),
      },
      include: {
        services: {
          where:   { isActive: true },
          orderBy: { price: 'asc' },
          take:    3,
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
