// pages/index.tsx — ModelCall homepage + marketplace directory
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import prisma from '../lib/prisma';

const CATEGORIES = ['All', 'Lashes', 'Nails', 'Facials', 'Hair', 'Brows', 'Makeup', 'Waxing', 'Massage'];

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
  { icon: '🔍', title: 'Search Treatments', desc: 'Filter by city, category, or price to find the perfect call.' },
  { icon: '📅', title: 'Book a Spot', desc: 'Claim your appointment in seconds — no phone calls needed.' },
  { icon: '✨', title: 'Get Glam', desc: 'Show up, experience a premium treatment, and leave glowing.' },
];

const BIZ_STEPS = [
  { icon: '📣', title: 'Post a Model Call', desc: 'List your service, set your price, and publish in minutes.' },
  { icon: '💺', title: 'Fill Your Seats', desc: 'Motivated models book instantly — zero follow-up required.' },
  { icon: '⭐', title: 'Build Your Portfolio', desc: 'Collect reviews, grow your reputation, and attract more clients.' },
];

const FEATURED_CATS = [
  { label: 'Lashes', emoji: '👁️' },
  { label: 'Injectables', emoji: '💉' },
  { label: 'Nails', emoji: '💅' },
  { label: 'Hair', emoji: '💇' },
  { label: 'Brows', emoji: '🪮' },
  { label: 'Facials', emoji: '🧖' },
  { label: 'Makeup', emoji: '💄' },
  { label: 'Massage', emoji: '🙌' },
];

export default function Home({ businesses, total, filters }: Props) {
  const router = useRouter();
  const [q, setQ] = useState(filters.q);
  const [suburb, setSuburb] = useState(filters.suburb);
  const [category, setCategory] = useState(filters.category || 'All');
  const [maxPrice, setMaxPrice] = useState(filters.maxPrice);
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

  return (
    <>
      <Head>
        <title>Model Call — Free &amp; Discounted Beauty Treatments Across Australia</title>
        <meta name="description" content="Book free and discounted beauty model calls across Australia. Find lashes, injectables, facials, nails and more from talented students and professionals." />
      </Head>

      {/* ─── HERO ─────────────────────────────────────────────────────── */}
      {!hasFilters && (
        <section style={{ backgroundColor: '#0F172A' }} className="relative overflow-hidden">
          {/* Subtle teal glow */}
          <div className="absolute inset-0 pointer-events-none" aria-hidden>
            <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full opacity-10"
              style={{ background: 'radial-gradient(circle, #0D9488 0%, transparent 70%)' }} />
          </div>
          <div className="relative max-w-6xl mx-auto px-4 py-24 text-center">
            <span className="inline-block text-xs font-semibold tracking-widest uppercase mb-4 px-3 py-1 rounded-full border"
              style={{ color: '#0D9488', borderColor: '#0D9488' }}>
              Australia&rsquo;s Beauty Marketplace
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight tracking-tight">
              Get glam. <span style={{ color: '#0D9488' }}>Save big.</span><br />
              Support the next generation.
            </h1>
            <p className="mt-6 text-lg md:text-xl max-w-2xl mx-auto" style={{ color: '#94A3B8' }}>
              Discover free and discounted beauty treatments from talented students, clinics, and academies across Australia.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <a href="#browse"
                className="px-8 py-4 rounded-xl font-semibold text-white text-base transition hover:opacity-90"
                style={{ backgroundColor: '#0D9488' }}>
                Browse Treatments
              </a>
              <Link href="/onboard"
                className="px-8 py-4 rounded-xl font-semibold text-base border-2 transition"
                style={{ borderColor: '#0D9488', color: '#0D9488' }}>
                List a Service
              </Link>
            </div>
            {/* Stats row */}
            <div className="mt-16 grid grid-cols-3 gap-6 max-w-md mx-auto">
              {[['Free', 'treatments available'], ['Sydney', 'launched city'], ['100%', 'vetted businesses']].map(([val, label]) => (
                <div key={val}>
                  <p className="text-2xl font-extrabold text-white">{val}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── HOW IT WORKS — MODELS ────────────────────────────────────── */}
      {!hasFilters && (
        <section className="py-20" style={{ backgroundColor: '#F8FAFC' }}>
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#0D9488' }}>For Models &amp; Customers</span>
              <h2 className="text-3xl font-extrabold mt-2" style={{ color: '#0F172A' }}>Three steps to your next treatment</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {MODEL_STEPS.map((s, i) => (
                <div key={s.title} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
                  <div className="text-4xl mb-4">{s.icon}</div>
                  <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: '#0D9488' }}>Step {i + 1}</p>
                  <h3 className="text-lg font-bold mb-2" style={{ color: '#0F172A' }}>{s.title}</h3>
                  <p className="text-sm" style={{ color: '#64748B' }}>{s.desc}</p>
                </div>
              ))}
            </div>
            <div className="text-center mt-10">
              <Link href="/for-models" className="text-sm font-semibold hover:underline" style={{ color: '#0D9488' }}>
                Learn more about being a model →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ─── HOW IT WORKS — BUSINESSES ────────────────────────────────── */}
      {!hasFilters && (
        <section className="py-20 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#0D9488' }}>For Clinics &amp; Academies</span>
              <h2 className="text-3xl font-extrabold mt-2" style={{ color: '#0F172A' }}>Fill every seat. Build your brand.</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {BIZ_STEPS.map((s, i) => (
                <div key={s.title} className="rounded-2xl p-8 shadow-sm border border-gray-100 text-center" style={{ backgroundColor: '#F8FAFC' }}>
                  <div className="text-4xl mb-4">{s.icon}</div>
                  <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: '#0D9488' }}>Step {i + 1}</p>
                  <h3 className="text-lg font-bold mb-2" style={{ color: '#0F172A' }}>{s.title}</h3>
                  <p className="text-sm" style={{ color: '#64748B' }}>{s.desc}</p>
                </div>
              ))}
            </div>
            <div className="text-center mt-10">
              <Link href="/for-businesses" className="text-sm font-semibold hover:underline" style={{ color: '#0D9488' }}>
                Why businesses choose Model Call →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ─── FEATURED CATEGORIES ──────────────────────────────────────── */}
      {!hasFilters && (
        <section className="py-20" style={{ backgroundColor: '#F8FAFC' }}>
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-10">
              <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#0D9488' }}>Categories</span>
              <h2 className="text-3xl font-extrabold mt-2" style={{ color: '#0F172A' }}>Popular treatments</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {FEATURED_CATS.map((c) => (
                <button key={c.label}
                  onClick={() => { setCategory(c.label); applyFilters({ category: c.label }); }}
                  className="flex flex-col items-center gap-3 bg-white rounded-2xl py-8 px-4 border border-gray-100 shadow-sm hover:shadow-md transition hover:-translate-y-0.5">
                  <span className="text-3xl">{c.emoji}</span>
                  <span className="text-sm font-semibold" style={{ color: '#0F172A' }}>{c.label}</span>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── SOCIAL PROOF / TRUST PLACEHOLDER ────────────────────────── */}
      {!hasFilters && (
        <section className="py-20 bg-white">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#0D9488' }}>Trusted by the community</span>
            <h2 className="text-3xl font-extrabold mt-2 mb-10" style={{ color: '#0F172A' }}>What models &amp; businesses say</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { quote: '"I got a full set of lashes for free — the student was incredibly skilled. I\'ll definitely be back."', name: 'Emily R.', role: 'Model, Sydney' },
                { quote: '"We filled 4 student training slots in one day. No more empty chairs."', name: 'Priya M.', role: 'Owner, Polished by Priya' },
                { quote: '"Finally an easy way to find model calls near me. The booking was seamless."', name: 'Jess T.', role: 'Model, Melbourne' },
              ].map((t) => (
                <div key={t.name} className="rounded-2xl p-8 text-left border border-gray-100 shadow-sm" style={{ backgroundColor: '#F8FAFC' }}>
                  <p className="text-sm leading-relaxed mb-5" style={{ color: '#0F172A' }}>{t.quote}</p>
                  <p className="text-sm font-bold" style={{ color: '#0F172A' }}>{t.name}</p>
                  <p className="text-xs" style={{ color: '#64748B' }}>{t.role}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── SEARCH + LISTINGS ────────────────────────────────────────── */}
      <section id="browse" className="py-16" style={{ backgroundColor: '#F8FAFC' }}>
        <div className="max-w-6xl mx-auto px-4">
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
            <div className="text-center py-20">
              <p className="text-lg" style={{ color: '#94A3B8' }}>No listings found for your search.</p>
              <Link href="/" className="mt-4 inline-block text-sm font-medium hover:underline" style={{ color: '#0D9488' }}>Clear filters</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {businesses.map((biz) => {
                const featured = biz.services[0];
                const isFree = featured?.price === 0;
                return (
                  <Link key={biz.id} href={`/businesses/${biz.slug}`}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition overflow-hidden flex flex-col hover:-translate-y-0.5">
                    <div className="h-1.5 rounded-t-2xl" style={{ background: 'linear-gradient(to right, #0D9488, #06B6D4)' }} />
                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <h2 className="font-bold text-base leading-tight" style={{ color: '#0F172A' }}>{biz.name}</h2>
                        {biz.avgRating && (
                          <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full ml-2 shrink-0">
                            ★ {biz.avgRating.toFixed(1)}
                          </span>
                        )}
                      </div>
                      {(biz.suburb || biz.city) && (
                        <p className="text-xs mb-3" style={{ color: '#94A3B8' }}>
                          📍 {[biz.suburb, biz.city, biz.state].filter(Boolean).join(', ')}
                        </p>
                      )}
                      {featured && (
                        <div className="mt-auto pt-3 border-t border-gray-100">
                          <p className="text-sm font-medium" style={{ color: '#0F172A' }}>{featured.name}</p>
                          <div className="flex items-center justify-between mt-1">
                            <div className="flex items-baseline gap-2">
                              <span className="text-base font-bold" style={{ color: isFree ? '#0D9488' : '#0F172A' }}>
                                {isFree ? 'FREE' : `$${(featured.price / 100).toFixed(0)}`}
                              </span>
                              {featured.originalPrice && featured.originalPrice > featured.price && (
                                <span className="text-xs line-through" style={{ color: '#94A3B8' }}>
                                  ${(featured.originalPrice / 100).toFixed(0)}
                                </span>
                              )}
                            </div>
                            <span className="text-xs" style={{ color: '#94A3B8' }}>{featured.durationMin} min</span>
                          </div>
                          {featured.category && (
                            <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full font-medium"
                              style={{ backgroundColor: '#F0FDFA', color: '#0D9488' }}>
                              {featured.category}
                            </span>
                          )}
                        </div>
                      )}
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
