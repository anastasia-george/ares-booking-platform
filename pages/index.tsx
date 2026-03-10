// pages/index.tsx
import { GetServerSideProps } from 'next';
import Link from 'next/link';
import { useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { PrismaClient } from '@prisma/client';

// ---------------------------------------------------------------------------
// Inline SVG Icon Components (Heroicons-style)
// ---------------------------------------------------------------------------
function IconSearch() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
    </svg>
  );
}
function IconCalendar() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3M3 11h18M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" />
    </svg>
  );
}
function IconSparkles() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}
function IconMegaphone() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 0 1-3.417.592l-2.147-6.15M18 13a3 3 0 1 0 0-6M5.436 13.683A4.001 4.001 0 0 1 7.028 8H13l4.028 9.81A4 4 0 0 1 13 21H7.028a4.001 4.001 0 0 1-1.592-7.317z" />
    </svg>
  );
}
function IconUsers() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 0 0-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 0 1 5.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 0 1 9.288 0M15 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
    </svg>
  );
}
function IconStar() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 0 0 .95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 0 0-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 0 0-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 0 0-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 0 0 .951-.69l1.519-4.674z" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Image map
// ---------------------------------------------------------------------------
const CAT_IMAGES: Record<string, string> = {
  Injectables:  'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?q=80&w=800&auto=format&fit=crop',
  Lashes:       'https://images.unsplash.com/photo-1512496015851-a9083832c668?q=80&w=800&auto=format&fit=crop',
  Brows:        'https://images.unsplash.com/photo-1512496015851-a9083832c668?q=80&w=800&auto=format&fit=crop',
  Hair:         'https://images.unsplash.com/photo-1562322140-8baeececf3df?q=80&w=800&auto=format&fit=crop',
  Skin:         'https://images.unsplash.com/photo-1522337660859-02fbefca4702?q=80&w=800&auto=format&fit=crop',
  Facials:      'https://images.unsplash.com/photo-1522337660859-02fbefca4702?q=80&w=800&auto=format&fit=crop',
  Waxing:       'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=800&auto=format&fit=crop',
  Nails:        'https://images.unsplash.com/photo-1604654894610-df63bc536371?q=80&w=800&auto=format&fit=crop',
  Massage:      'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=800&auto=format&fit=crop',
  Makeup:       'https://images.unsplash.com/photo-1503236823255-94609f598e71?q=80&w=800&auto=format&fit=crop',
};
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?q=80&w=800&auto=format&fit=crop';

function catImage(category: string | null | undefined): string {
  if (!category) return FALLBACK_IMAGE;
  return CAT_IMAGES[category] ?? FALLBACK_IMAGE;
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------
const CATEGORIES = [
  'Injectables', 'Lashes', 'Brows', 'Hair', 'Skin',
  'Facials', 'Waxing', 'Nails', 'Massage', 'Makeup',
];

const FEATURED_CATS = [
  { label: 'Injectables', category: 'Injectables', image: CAT_IMAGES['Injectables'] },
  { label: 'Lashes & Brows', category: 'Lashes',       image: CAT_IMAGES['Lashes'] },
  { label: 'Hair',           category: 'Hair',          image: CAT_IMAGES['Hair'] },
  { label: 'Skin & Facials', category: 'Facials',       image: CAT_IMAGES['Facials'] },
  { label: 'Nails',          category: 'Nails',         image: CAT_IMAGES['Nails'] },
  { label: 'Massage',        category: 'Massage',       image: CAT_IMAGES['Massage'] },
];

const TESTIMONIALS = [
  {
    quote: "Found an amazing lash artist in 5 minutes. Saved me $180 and the results were stunning.",
    author: 'Chloe M.',
    location: 'Sydney',
    avatar: 'https://i.pravatar.cc/80?img=47',
  },
  {
    quote: "My injectables business is fully booked every week now. Game-changer for finding models.",
    author: 'Sarah K.',
    location: 'Melbourne',
    avatar: 'https://i.pravatar.cc/80?img=45',
  },
  {
    quote: "The booking process is so smooth. Got a free facial at a top salon — it was incredible.",
    author: 'Priya T.',
    location: 'Brisbane',
    avatar: 'https://i.pravatar.cc/80?img=32',
  },
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ServiceSnippet {
  id: string;
  name: string;
  price: number;
  originalPrice: number | null;
  category: string | null;
  durationMin: number;
  business: {
    name: string;
    slug: string;
    suburb: string | null;
    state: string | null;
    verified: boolean;
  };
}

interface BusinessCard {
  slug: string;
  name: string;
  suburb: string | null;
  state: string | null;
  verified: boolean;
  category: string | null;
  minPrice: number;
  serviceCount: number;
}

interface Props {
  listings: BusinessCard[];
  error?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function applyFilters(
  listings: BusinessCard[],
  cat: string,
  loc: string,
  search: string,
): BusinessCard[] {
  return listings.filter((b) => {
    if (cat && b.category !== cat) return false;
    if (loc && !`${b.suburb ?? ''} ${b.state ?? ''}`.toLowerCase().includes(loc.toLowerCase())) return false;
    if (search && !b.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
}

function hasFilters(cat: string, loc: string, search: string) {
  return !!(cat || loc || search);
}

function previewListings(listings: BusinessCard[], n = 6): BusinessCard[] {
  return listings.slice(0, n);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function Home({ listings }: Props) {
  const { data: session } = useSession();
  const [cat, setCat]       = useState('');
  const [loc, setLoc]       = useState('');
  const [search, setSearch] = useState('');

  const filtered  = applyFilters(listings, cat, loc, search);
  const showing   = hasFilters(cat, loc, search) ? filtered : previewListings(listings, 6);
  const showMore  = !hasFilters(cat, loc, search) && listings.length > 6;

  return (
    <>
      {/* ------------------------------------------------------------------ */}
      {/* HERO                                                                */}
      {/* ------------------------------------------------------------------ */}
      <section
        className="relative min-h-[92vh] flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=2000&auto=format&fit=crop')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-[#0F172A]/55" />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center">
          {/* Eyebrow pill */}
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase bg-white/15 border border-white/30 text-white mb-6">
            Australia&rsquo;s Beauty Model Call Marketplace
          </span>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-white tracking-tight leading-[1.05] mb-6">
            Premium Beauty.<br />
            <span className="text-[#0D9488]">Free or Discounted.</span>
          </h1>

          <p className="text-xl text-white/80 max-w-2xl mx-auto mb-10 leading-relaxed">
            Connect with talented beauty professionals seeking models. Get world-class treatments
            at a fraction of the price — or nothing at all.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-14">
            <a
              href="#browse"
              className="px-8 py-4 rounded-full font-bold text-base bg-[#0D9488] text-white hover:bg-teal-600 transition-all duration-200 shadow-lg shadow-teal-900/30"
            >
              Find a Treatment
            </a>
            {!session ? (
              <button
                onClick={() => signIn()}
                className="px-8 py-4 rounded-full font-bold text-base border-2 border-white text-white hover:bg-white hover:text-[#0F172A] transition-all duration-200"
              >
                List a Service
              </button>
            ) : (
              <Link
                href="/onboard"
                className="px-8 py-4 rounded-full font-bold text-base border-2 border-white text-white hover:bg-white hover:text-[#0F172A] transition-all duration-200"
              >
                List a Service
              </Link>
            )}
          </div>

          {/* Stat pills */}
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { label: 'Free or discounted treatments' },
              { label: 'Verified beauty professionals' },
              { label: 'Trusted by Australians' },
            ].map((s) => (
              <span
                key={s.label}
                className="px-4 py-2 rounded-full text-xs font-medium bg-white/10 backdrop-blur-sm border border-white/20 text-white"
              >
                {s.label}
              </span>
            ))}
          </div>

          <p className="mt-6 text-xs text-white/60">
            No hidden fees. No spam. Just great beauty at an honest price.
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* CATEGORY CARDS                                                      */}
      {/* ------------------------------------------------------------------ */}
      <section className="bg-[#F8FAFC] py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="mb-10">
            <p className="text-xs font-bold tracking-[0.18em] uppercase text-[#0D9488] mb-2">
              Browse by Category
            </p>
            <h2 className="text-3xl sm:text-4xl font-black text-[#0F172A]">
              Every treatment, one place.
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {FEATURED_CATS.map((fc) => (
              <a
                key={fc.category}
                href={`#browse`}
                onClick={() => setCat(fc.category)}
                className="group relative h-64 rounded-2xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-shadow duration-300"
              >
                <img
                  src={fc.image}
                  alt={fc.label}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 p-4">
                  <p className="text-white font-bold text-sm leading-tight">{fc.label}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* HOW IT WORKS                                                        */}
      {/* ------------------------------------------------------------------ */}
      <section id="how-it-works" className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-bold tracking-[0.18em] uppercase text-[#0D9488] mb-2">
              Simple by design
            </p>
            <h2 className="text-3xl sm:text-4xl font-black text-[#0F172A]">How it works</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-16">
            {/* For Models */}
            <div>
              <h3 className="text-lg font-bold text-[#0F172A] mb-8 flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-[#0D9488] text-white text-xs font-bold flex items-center justify-center">M</span>
                For Models
              </h3>
              <div className="space-y-8">
                {[
                  { Icon: IconSearch,   step: '01', title: 'Browse listings',     desc: 'Find free or discounted beauty treatments near you across every category.' },
                  { Icon: IconCalendar, step: '02', title: 'Book instantly',       desc: 'Choose a time that works for you. Confirmation in seconds.' },
                  { Icon: IconSparkles, step: '03', title: 'Get pampered',         desc: 'Turn up, enjoy the treatment, and leave a review.' },
                ].map(({ Icon, step, title, desc }) => (
                  <div key={step} className="flex gap-5">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#0D9488] to-teal-700 flex items-center justify-center text-white shrink-0 shadow-md shadow-teal-900/20">
                      <Icon />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#94A3B8] mb-0.5">Step {step}</p>
                      <p className="font-bold text-[#0F172A] mb-1">{title}</p>
                      <p className="text-sm text-[#64748B] leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* For Businesses */}
            <div>
              <h3 className="text-lg font-bold text-[#0F172A] mb-8 flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-[#0F172A] text-white text-xs font-bold flex items-center justify-center">B</span>
                For Businesses
              </h3>
              <div className="space-y-8">
                {[
                  { Icon: IconMegaphone, step: '01', title: 'List your model call',   desc: 'Post a free or discounted service in minutes. Reach thousands of local models.' },
                  { Icon: IconUsers,     step: '02', title: 'Get qualified bookings', desc: 'Models apply and book directly — your calendar fills automatically.' },
                  { Icon: IconStar,      step: '03', title: 'Build your portfolio',   desc: 'Collect reviews, grow your reputation, and turn models into loyal clients.' },
                ].map(({ Icon, step, title, desc }) => (
                  <div key={step} className="flex gap-5">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#0F172A] to-slate-700 flex items-center justify-center text-white shrink-0 shadow-md shadow-slate-900/20">
                      <Icon />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#94A3B8] mb-0.5">Step {step}</p>
                      <p className="font-bold text-[#0F172A] mb-1">{title}</p>
                      <p className="text-sm text-[#64748B] leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* BROWSE / LISTINGS                                                   */}
      {/* ------------------------------------------------------------------ */}
      <section id="browse" className="bg-[#F8FAFC] py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <p className="text-xs font-bold tracking-[0.18em] uppercase text-[#0D9488] mb-2">
                Live Model Calls
              </p>
              <h2 className="text-3xl sm:text-4xl font-black text-[#0F172A]">
                {hasFilters(cat, loc, search)
                  ? `${filtered.length} result${filtered.length !== 1 ? 's' : ''} found`
                  : 'Browse all listings'}
              </h2>
            </div>
          </div>

          {/* Filter bar */}
          <div className="grid sm:grid-cols-3 gap-3 mb-10">
            <select
              value={cat}
              onChange={(e) => setCat(e.target.value)}
              className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm bg-white text-[#0F172A] font-medium focus:outline-none focus:ring-2 focus:ring-[#0D9488]/40"
            >
              <option value="">All categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Suburb or city..."
              value={loc}
              onChange={(e) => setLoc(e.target.value)}
              className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm bg-white text-[#0F172A] placeholder-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/40"
            />
            <input
              type="text"
              placeholder="Search business name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm bg-white text-[#0F172A] placeholder-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/40"
            />
          </div>

          {/* Cards */}
          {showing.length === 0 ? (
            <div className="text-center py-24 text-[#94A3B8]">
              <p className="text-lg font-semibold mb-2">No listings found</p>
              <p className="text-sm">Try adjusting your filters or check back soon.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {showing.map((biz) => (
                <Link
                  key={biz.slug}
                  href={`/businesses/${biz.slug}`}
                  className="group bg-white rounded-2xl overflow-hidden border border-[#E2E8F0] hover:border-[#0D9488]/40 hover:shadow-lg transition-all duration-300"
                >
                  {/* Photo */}
                  <div className="h-48 relative overflow-hidden">
                    <img
                      src={catImage(biz.category)}
                      alt={biz.category ?? ''}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                    {biz.verified && (
                      <span className="absolute top-3 right-3 bg-[#0D9488] text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                        Verified
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-bold text-[#0F172A] text-base leading-snug line-clamp-1 group-hover:text-[#0D9488] transition-colors">
                        {biz.name}
                      </h3>
                      <span className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full ${
                        biz.minPrice === 0
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-[#F0FDFA] text-[#0D9488]'
                      }`}>
                        {biz.minPrice === 0 ? 'FREE' : `From $${(biz.minPrice / 100).toFixed(0)}`}
                      </span>
                    </div>
                    {(biz.suburb || biz.state) && (
                      <p className="text-xs text-[#94A3B8] mb-3 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {[biz.suburb, biz.state].filter(Boolean).join(', ')}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#64748B]">
                        {biz.serviceCount} service{biz.serviceCount !== 1 ? 's' : ''}
                        {biz.category ? ` · ${biz.category}` : ''}
                      </span>
                      <span className="text-xs font-semibold text-[#0D9488] group-hover:underline">
                        View &rarr;
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {showMore && (
            <div className="mt-10 text-center">
              <button
                onClick={() => setSearch(' ')}
                className="px-8 py-3 rounded-full border-2 border-[#0D9488] text-[#0D9488] font-bold text-sm hover:bg-[#0D9488] hover:text-white transition-all duration-200"
              >
                View all {listings.length} listings
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* TESTIMONIALS                                                        */}
      {/* ------------------------------------------------------------------ */}
      <section className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-bold tracking-[0.18em] uppercase text-[#0D9488] mb-2">
              Real stories
            </p>
            <h2 className="text-3xl sm:text-4xl font-black text-[#0F172A]">
              Loved by models & businesses
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.author}
                className="bg-[#F8FAFC] rounded-2xl p-7 border border-[#E2E8F0] flex flex-col gap-5"
              >
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-4 h-4 text-amber-400 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-[#0F172A] text-sm leading-relaxed font-medium flex-1">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <img
                    src={t.avatar}
                    alt={t.author}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-sm font-bold text-[#0F172A]">{t.author}</p>
                    <p className="text-xs text-[#94A3B8]">{t.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* CTA BANNER                                                          */}
      {/* ------------------------------------------------------------------ */}
      <section className="bg-[#0F172A] py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
            Ready to find your next treatment?
          </h2>
          <p className="text-lg text-[#94A3B8] mb-10">
            Join thousands of Australians getting premium beauty for free or heavily discounted.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#browse"
              className="px-8 py-4 rounded-full font-bold text-base bg-[#0D9488] text-white hover:bg-teal-600 transition-all duration-200 shadow-lg shadow-teal-900/30"
            >
              Browse Treatments
            </a>
            <Link
              href="/for-businesses"
              className="px-8 py-4 rounded-full font-bold text-base border-2 border-white/30 text-white hover:border-white transition-all duration-200"
            >
              List Your Business
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------
export const getServerSideProps: GetServerSideProps<Props> = async () => {
  const prisma = new PrismaClient();
  try {
    const businesses = await prisma.business.findMany({
      where: { services: { some: { isActive: true } } },
      select: {
        slug: true,
        name: true,
        suburb: true,
        state: true,
        verified: true,
        services: {
          where: { isActive: true },
          select: { price: true, category: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const listings: BusinessCard[] = businesses.map((b) => ({
      slug: b.slug,
      name: b.name,
      suburb: b.suburb ?? null,
      state: b.state ?? null,
      verified: b.verified,
      category: b.services[0]?.category ?? null,
      minPrice: Math.min(...b.services.map((s) => s.price)),
      serviceCount: b.services.length,
    }));

    return { props: { listings } };
  } catch (err) {
    console.error('Homepage SSP error:', err);
    return { props: { listings: [] } };
  } finally {
    await prisma.$disconnect();
  }
};
