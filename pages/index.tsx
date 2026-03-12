// pages/index.tsx
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useState, useMemo, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import {
  Search, MapPin, Heart, Star, ChevronRight,
  Sparkles, Scissors, Zap, Droplets, Hand,
  Wind, Flower2, Brush, Waves, SlidersHorizontal,
  Clock, CalendarCheck,
} from 'lucide-react';
import prismaClient from '../lib/prisma';

// ---------------------------------------------------------------------------
// Image maps
// ---------------------------------------------------------------------------
const CAT_IMAGES: Record<string, string> = {
  Injectables: 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?q=80&w=800&auto=format&fit=crop',
  Lashes:      'https://images.unsplash.com/photo-1583001931096-959e9a1a6223?q=80&w=800&auto=format&fit=crop',
  Brows:       'https://images.unsplash.com/photo-1512496015851-a9083832c668?q=80&w=800&auto=format&fit=crop',
  Hair:        'https://images.unsplash.com/photo-1562322140-8baeececf3df?q=80&w=800&auto=format&fit=crop',
  Skin:        'https://images.unsplash.com/photo-1522337660859-02fbefca4702?q=80&w=800&auto=format&fit=crop',
  Facials:     'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=800&auto=format&fit=crop',
  Waxing:      'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?q=80&w=800&auto=format&fit=crop',
  Nails:       'https://images.unsplash.com/photo-1604654894610-df63bc536371?q=80&w=800&auto=format&fit=crop',
  Massage:     'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=800&auto=format&fit=crop',
  Makeup:      'https://images.unsplash.com/photo-1503236823255-94609f598e71?q=80&w=800&auto=format&fit=crop',
};

const LISTING_IMAGES = [
  'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1604654894610-df63bc536371?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1522337660859-02fbefca4702?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1562322140-8baeececf3df?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1583001931096-959e9a1a6223?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1503236823255-94609f598e71?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1512496015851-a9083832c668?q=80&w=600&auto=format&fit=crop',
];

function catImage(category: string | null | undefined, index = 0): string {
  if (category && CAT_IMAGES[category]) return CAT_IMAGES[category];
  return LISTING_IMAGES[index % LISTING_IMAGES.length];
}

// ---------------------------------------------------------------------------
// Category bar
// ---------------------------------------------------------------------------
const CATEGORY_BAR = [
  { label: 'All',         Icon: SlidersHorizontal, value: '' },
  { label: 'Injectables', Icon: Zap,                value: 'Injectables' },
  { label: 'Lashes',      Icon: Sparkles,           value: 'Lashes' },
  { label: 'Brows',       Icon: Flower2,            value: 'Brows' },
  { label: 'Hair',        Icon: Wind,               value: 'Hair' },
  { label: 'Nails',       Icon: Hand,               value: 'Nails' },
  { label: 'Facials',     Icon: Droplets,           value: 'Facials' },
  { label: 'Makeup',      Icon: Brush,              value: 'Makeup' },
  { label: 'Massage',     Icon: Waves,              value: 'Massage' },
  { label: 'Waxing',      Icon: Scissors,           value: 'Waxing' },
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface BusinessCard {
  slug: string;
  name: string;
  suburb: string | null;
  state: string | null;
  verified: boolean;
  category: string | null;
  minPrice: number;
  serviceCount: number;
  nextAvailable: string | null;
  slotsToday: number;
}

type SortOption = 'soonest' | 'rated' | 'value';
type TimeFilter = '' | 'today' | 'tomorrow' | 'week' | 'weekend';

const TIME_FILTERS: { label: string; value: TimeFilter }[] = [
  { label: 'All', value: '' },
  { label: 'Today', value: 'today' },
  { label: 'Tomorrow', value: 'tomorrow' },
  { label: 'This Week', value: 'week' },
  { label: 'Weekend', value: 'weekend' },
];

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: 'Soonest Available', value: 'soonest' },
  { label: 'Highest Rated', value: 'rated' },
  { label: 'Best Value', value: 'value' },
];

function availabilityBadge(card: BusinessCard): { text: string; color: string } | null {
  if (!card.nextAvailable) return null;
  const nextDate = new Date(card.nextAvailable);
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const tomorrowDate = new Date(today);
  tomorrowDate.setUTCDate(tomorrowDate.getUTCDate() + 1);
  const tomorrowStr = tomorrowDate.toISOString().slice(0, 10);
  const nextStr = nextDate.toISOString().slice(0, 10);

  if (nextStr === todayStr) {
    return { text: card.slotsToday > 1 ? `${card.slotsToday} spots today` : 'Available today', color: 'bg-emerald-500' };
  }
  if (nextStr === tomorrowStr) {
    return { text: 'Tomorrow', color: 'bg-teal-500' };
  }
  // Within this week
  const diffDays = Math.ceil((nextDate.getTime() - today.getTime()) / 86400000);
  if (diffDays <= 7) {
    return { text: nextDate.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' }), color: 'bg-sky-500' };
  }
  return null;
}

interface Props {
  listings: BusinessCard[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function Home({ listings: ssrListings }: Props) {
  const { data: session } = useSession();
  const [activeCat, setActiveCat]         = useState('');
  const [heroLoc, setHeroLoc]             = useState('');
  const [heroTreatment, setHeroTreatment] = useState('');
  const [saved, setSaved]                 = useState<Set<string>>(new Set());
  const [timeFilter, setTimeFilter]       = useState<TimeFilter>('');
  const [sortBy, setSortBy]               = useState<SortOption>('soonest');
  const [listings, setListings]           = useState(ssrListings);

  // Fetch availability data client-side (keeps SSR fast)
  useEffect(() => {
    async function fetchAvailability() {
      try {
        const res = await fetch('/api/availability/browse?filter=week');
        if (!res.ok) return;
        const data = await res.json();
        const availMap = new Map<string, { nextAvailable: string | null; slotsCount: number }>();
        for (const biz of data.businesses ?? []) {
          availMap.set(biz.slug, { nextAvailable: biz.nextAvailable, slotsCount: biz.slotsCount });
        }
        setListings((prev) =>
          prev.map((l) => {
            const avail = availMap.get(l.slug);
            if (!avail) return l;
            const todayStr = new Date().toISOString().slice(0, 10);
            const isToday = avail.nextAvailable?.slice(0, 10) === todayStr;
            return {
              ...l,
              nextAvailable: avail.nextAvailable,
              slotsToday: isToday ? avail.slotsCount : 0,
            };
          })
        );
      } catch { /* non-critical */ }
    }
    fetchAvailability();
  }, []);

  const filtered = useMemo(() => {
    let result = listings.filter((b) => {
      if (activeCat && b.category !== activeCat) return false;
      if (heroLoc && !`${b.suburb ?? ''} ${b.state ?? ''}`.toLowerCase().includes(heroLoc.toLowerCase())) return false;
      if (heroTreatment && !b.name.toLowerCase().includes(heroTreatment.toLowerCase())) return false;

      // Time filter
      if (timeFilter && b.nextAvailable) {
        const nextDate = new Date(b.nextAvailable);
        const today = new Date();
        const todayStr = today.toISOString().slice(0, 10);
        const nextStr = nextDate.toISOString().slice(0, 10);
        const tomorrow = new Date(today);
        tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

        if (timeFilter === 'today' && nextStr !== todayStr) return false;
        if (timeFilter === 'tomorrow' && nextStr !== tomorrow.toISOString().slice(0, 10)) return false;
        if (timeFilter === 'week') {
          const diff = Math.ceil((nextDate.getTime() - today.getTime()) / 86400000);
          if (diff > 7) return false;
        }
        if (timeFilter === 'weekend') {
          const dow = nextDate.getUTCDay();
          if (dow !== 0 && dow !== 6) return false;
        }
      } else if (timeFilter) {
        return false; // No availability at all
      }

      return true;
    });

    // Sort
    result = [...result].sort((a, b) => {
      if (sortBy === 'soonest') {
        if (!a.nextAvailable) return 1;
        if (!b.nextAvailable) return -1;
        return a.nextAvailable.localeCompare(b.nextAvailable);
      }
      if (sortBy === 'value') return a.minPrice - b.minPrice;
      return 0; // 'rated' — keep SSR order (mock ratings)
    });

    return result;
  }, [listings, activeCat, heroLoc, heroTreatment, timeFilter, sortBy]);

  function toggleSave(slug: string) {
    setSaved((prev) => {
      const next = new Set(prev);
      next.has(slug) ? next.delete(slug) : next.add(slug);
      return next;
    });
  }

  // Deterministic mock data per listing index
  const MOCK_RATINGS  = [4.9, 4.8, 5.0, 4.7, 4.9, 4.8, 4.6, 5.0, 4.9, 4.7];
  const MOCK_REVIEWS  = [124, 83, 47, 210, 96, 61, 38, 152, 73, 118];
  const MOCK_ORIGINALS= [180, 150, 220, 120, 195, 160, 240, 130, 175, 200];
  const TIME_AGO      = ['Added 2 hours ago', 'Added yesterday', 'Added 3 days ago', 'Added this week'];

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Model Call',
    url: 'https://modelcall.app',
    description: 'Australia\'s marketplace for free and discounted beauty model calls. Book lashes, facials, injectables, hair and more at top clinics.',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://modelcall.app/?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <>
    <Head>
      <title>Model Call — Free &amp; Discounted Beauty Treatments in Australia</title>
      <meta name="description" content="Book free and discounted beauty treatments at verified clinics across Australia. Find model calls for lashes, facials, injectables, hair, nails and more — zero booking fees." />
      <link rel="canonical" href="https://modelcall.app" />
      <meta property="og:title" content="Model Call — Free & Discounted Beauty Treatments in Australia" />
      <meta property="og:description" content="Book free and discounted beauty treatments at verified clinics across Australia. Lashes, facials, injectables, hair, nails and more." />
      <meta property="og:url" content="https://modelcall.app" />
      <meta name="twitter:title" content="Model Call — Free & Discounted Beauty Treatments" />
      <meta name="twitter:description" content="Australia’s beauty model call platform. Book free or discounted treatments at top clinics." />
      <meta name="keywords" content="model call, free beauty treatments Australia, discounted beauty treatments, beauty model call, free lashes Sydney, free facials, free injectables, beauty model booking" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
    </Head>
    <div className="bg-[#F8FAFC]">

      {/* ================================================================
          HERO
      ================================================================ */}
      <section
        className="relative flex flex-col items-center justify-center overflow-hidden"
        style={{
          minHeight: 580,
          backgroundImage: `url('https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=2000&auto=format&fit=crop')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 35%',
        }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0F172A]/60 via-[#0F172A]/50 to-[#0F172A]/40" />

        <div className="relative z-10 w-full max-w-3xl mx-auto px-4 sm:px-6 text-center pb-12 pt-6">
          <span className="inline-block text-[11px] font-bold tracking-[0.22em] uppercase text-white/60 mb-5">
            Australia&rsquo;s Beauty Model Call Platform
          </span>

          <h1 className="text-5xl sm:text-[64px] font-black text-white leading-[1.03] tracking-tight mb-5">
            Premium beauty.<br />
            <em className="not-italic text-[#0D9488]">Free or discounted.</em>
          </h1>

          <p className="text-[17px] text-white/65 mb-10 max-w-lg mx-auto leading-relaxed">
            Book with top clinics seeking models for hair, skin, lashes &amp; more — at a fraction of the price.
          </p>

          {/* ── HERO SEARCH PILL ── */}
          <div className="bg-white rounded-full shadow-[0_8px_40px_rgba(0,0,0,0.25)] flex items-stretch divide-x divide-[#F1F5F9] overflow-hidden max-w-2xl mx-auto">
            {/* Where */}
            <div className="flex items-center gap-3 px-5 py-3.5 flex-1 min-w-0">
              <MapPin className="w-4 h-4 text-[#0D9488] shrink-0" strokeWidth={2.5} />
              <div className="flex flex-col min-w-0 text-left">
                <span className="text-[10px] font-black text-[#0F172A] tracking-widest uppercase leading-none mb-1">Where</span>
                <input
                  type="text"
                  placeholder="City or suburb"
                  value={heroLoc}
                  onChange={(e) => setHeroLoc(e.target.value)}
                  className="text-sm text-[#0F172A] placeholder-[#CBD5E1] bg-transparent focus:outline-none font-medium w-full"
                />
              </div>
            </div>

            {/* Treatment */}
            <div className="flex items-center gap-3 px-5 py-3.5 flex-1 min-w-0">
              <Sparkles className="w-4 h-4 text-[#0D9488] shrink-0" strokeWidth={2.5} />
              <div className="flex flex-col min-w-0 text-left">
                <span className="text-[10px] font-black text-[#0F172A] tracking-widest uppercase leading-none mb-1">Treatment</span>
                <input
                  type="text"
                  placeholder="Lashes, facials, hair…"
                  value={heroTreatment}
                  onChange={(e) => setHeroTreatment(e.target.value)}
                  className="text-sm text-[#0F172A] placeholder-[#CBD5E1] bg-transparent focus:outline-none font-medium w-full"
                />
              </div>
            </div>

            {/* Search CTA */}
            <button
              onClick={() => document.getElementById('browse')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-[#0D9488] hover:bg-teal-600 active:bg-teal-700 transition-colors duration-150 px-6 flex items-center justify-center shrink-0 rounded-r-full"
              aria-label="Search"
            >
              <Search className="w-5 h-5 text-white" strokeWidth={2.5} />
            </button>
          </div>

          {/* Trust micro-row */}
          <div className="flex flex-wrap items-center justify-center gap-5 mt-7">
            {['Verified clinics', 'Zero booking fees', 'Cancel anytime'].map((t) => (
              <div key={t} className="flex items-center gap-1.5 text-[13px] text-white/60 font-medium">
                <span className="w-1 h-1 rounded-full bg-[#0D9488] shrink-0" />
                {t}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          STICKY CATEGORY BAR
      ================================================================ */}
      <div className="sticky top-16 z-30 bg-white border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div
            className="flex items-center overflow-x-auto"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {CATEGORY_BAR.map(({ label, Icon, value }) => {
              const active = activeCat === value;
              return (
                <button
                  key={label}
                  onClick={() => setActiveCat(value)}
                  className={`
                    flex flex-col items-center gap-1.5 px-5 py-4 shrink-0
                    text-[11px] font-semibold tracking-wide whitespace-nowrap
                    border-b-[2.5px] transition-all duration-150
                    ${active
                      ? 'border-[#0F172A] text-[#0F172A]'
                      : 'border-transparent text-[#94A3B8] hover:text-[#475569] hover:border-[#CBD5E1]'
                    }
                  `}
                >
                  <Icon className={`w-[22px] h-[22px] ${active ? 'text-[#0F172A]' : 'text-[#94A3B8]'}`} strokeWidth={1.75} />
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ================================================================
          AVAILABLE TODAY STRIP
      ================================================================ */}
      {(() => {
        const availToday = listings.filter((b) => b.slotsToday > 0).slice(0, 6);
        if (availToday.length === 0) return null;
        return (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <h2 className="text-[15px] font-black text-[#0F172A]">Available today</h2>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
              {availToday.map((biz) => (
                <Link
                  key={biz.slug}
                  href={`/businesses/${biz.slug}`}
                  className="shrink-0 flex items-center gap-3 bg-white border border-[#E2E8F0] rounded-2xl px-4 py-3 hover:border-[#0D9488] transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#E2E8F0] shrink-0">
                    <img src={catImage(biz.category, 0)} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-[#0F172A] truncate">{biz.name}</p>
                    <p className="text-[11px] text-emerald-600 font-medium">
                      {biz.slotsToday} spot{biz.slotsToday !== 1 ? 's' : ''} left today
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        );
      })()}

      {/* ================================================================
          LISTING GRID
      ================================================================ */}
      <section id="browse" className="max-w-7xl mx-auto px-4 sm:px-6 py-10">

        {/* Quick filter pills + sort */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
          <div className="flex items-center gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {TIME_FILTERS.map(({ label, value }) => (
              <button
                key={value}
                onClick={() => setTimeFilter(value)}
                className={`
                  shrink-0 px-4 py-2 rounded-full text-[13px] font-semibold border transition-all duration-150
                  ${timeFilter === value
                    ? 'bg-[#0F172A] text-white border-[#0F172A]'
                    : 'bg-white text-[#64748B] border-[#E2E8F0] hover:border-[#94A3B8]'
                  }
                `}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="ml-auto">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="text-[13px] font-semibold text-[#0F172A] bg-white border border-[#E2E8F0] rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30"
            >
              {SORT_OPTIONS.map(({ label, value }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Header row */}
        <div className="flex items-center justify-between mb-8">
          <p className="text-[15px] font-semibold text-[#0F172A]">
            {filtered.length > 0
              ? <>{filtered.length} model call{filtered.length !== 1 ? 's' : ''} available</>
              : 'No listings match'}
          </p>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-28 flex flex-col items-center gap-4">
            <Search className="w-12 h-12 text-[#CBD5E1]" />
            <p className="text-lg font-bold text-[#0F172A]">No listings found</p>
            <p className="text-sm text-[#94A3B8]">Try a different category or location.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-9">
            {filtered.map((biz, i) => {
              const isSaved   = saved.has(biz.slug);
              const rating    = MOCK_RATINGS[i % MOCK_RATINGS.length];
              const reviews   = MOCK_REVIEWS[i % MOCK_REVIEWS.length];
              const origPrice = biz.minPrice === 0 ? MOCK_ORIGINALS[i % MOCK_ORIGINALS.length] : null;
              const timeAgo   = TIME_AGO[i % TIME_AGO.length];

              return (
                <article key={biz.slug} className="group relative flex flex-col">
                  {/* Image */}
                  <Link href={`/businesses/${biz.slug}`} className="block">
                    <div className="relative rounded-2xl overflow-hidden bg-[#E2E8F0] mb-3" style={{ aspectRatio: '1/1' }}>
                      <img
                        src={catImage(biz.category, i)}
                        alt={biz.name}
                        className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
                        loading="lazy"
                      />
                      {biz.verified && (
                        <span className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm text-[#0F172A] text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm tracking-wide">
                          Verified
                        </span>
                      )}
                    </div>
                  </Link>

                  {/* Heart */}
                  <button
                    onClick={() => toggleSave(biz.slug)}
                    className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-sm shadow-sm hover:scale-110 active:scale-95 transition-transform duration-150"
                    aria-label={isSaved ? 'Unsave' : 'Save'}
                  >
                    <Heart
                      className={`w-[15px] h-[15px] transition-colors duration-150 ${
                        isSaved ? 'fill-rose-500 text-rose-500' : 'text-[#0F172A]'
                      }`}
                      strokeWidth={2}
                    />
                  </button>

                  {/* Text details */}
                  <Link href={`/businesses/${biz.slug}`} className="flex-1 flex flex-col">
                    <div className="flex items-start justify-between gap-2">
                      {/* Left: name + location + time */}
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-semibold text-[#0F172A] truncate leading-snug">
                          {biz.name}
                        </p>
                        {(biz.suburb || biz.state) && (
                          <p className="text-[13px] text-[#94A3B8] mt-[1px] truncate">
                            {[biz.suburb, biz.state].filter(Boolean).join(', ')}
                          </p>
                        )}
                        {/* Availability badge */}
                        {(() => {
                          const badge = availabilityBadge(biz);
                          if (!badge) return (
                            <p className="text-[12px] text-[#CBD5E1] mt-[2px] flex items-center gap-1">
                              <Clock className="w-3 h-3" strokeWidth={2} />
                              No upcoming availability
                            </p>
                          );
                          return (
                            <p className="text-[12px] text-emerald-600 font-medium mt-[2px] flex items-center gap-1">
                              <CalendarCheck className="w-3 h-3" strokeWidth={2} />
                              {badge.text}
                            </p>
                          );
                        })()}
                      </div>
                      {/* Right: star rating */}
                      <div className="flex items-center gap-1 shrink-0 mt-[2px]">
                        <Star className="w-3 h-3 fill-[#0F172A] text-[#0F172A]" strokeWidth={0} />
                        <span className="text-[13px] font-semibold text-[#0F172A]">{rating}</span>
                      </div>
                    </div>

                    {/* Price row */}
                    <div className="flex items-baseline gap-1.5 mt-1.5">
                      {biz.minPrice === 0 ? (
                        <>
                          <span className="text-[14px] font-bold text-[#0D9488]">FREE</span>
                          {origPrice && (
                            <span className="text-[13px] text-[#94A3B8] line-through">${origPrice}</span>
                          )}
                        </>
                      ) : (
                        <span className="text-[14px] text-[#0F172A]">
                          From <strong>${(biz.minPrice / 100).toFixed(0)}</strong>
                        </span>
                      )}
                    </div>
                    {/* Review count faint */}
                    <p className="text-[12px] text-[#CBD5E1] mt-0.5">({reviews} reviews)</p>
                  </Link>
                </article>
              );
            })}
          </div>
        )}

        {/* Show more */}
        {filtered.length >= 8 && (
          <div className="mt-14 text-center">
            <button className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full border-2 border-[#0F172A] text-[#0F172A] font-bold text-sm hover:bg-[#0F172A] hover:text-white transition-all duration-200">
              Show more
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </section>

      {/* ================================================================
          TRUST STRIP
      ================================================================ */}
      <section className="bg-white border-t border-[#E2E8F0] py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 grid grid-cols-1 sm:grid-cols-3 gap-10 text-center">
          {[
            {
              icon: <Sparkles className="w-6 h-6 text-[#0D9488]" strokeWidth={1.75} />,
              title: 'World-class treatments',
              desc:  'Access elite clinics that would normally cost hundreds — vetted and verified.',
            },
            {
              icon: <Star className="w-6 h-6 text-[#0D9488]" strokeWidth={1.75} />,
              title: 'Thousands of real reviews',
              desc:  'Every business is rated by real customers. Fake reviews are automatically removed.',
            },
            {
              icon: <Heart className="w-6 h-6 text-[#0D9488]" strokeWidth={1.75} />,
              title: 'Zero fees, always',
              desc:  'We never charge models a booking fee. What you see is what you pay — often nothing.',
            },
          ].map((item) => (
            <div key={item.title} className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#F0FDFA] flex items-center justify-center">
                {item.icon}
              </div>
              <div>
                <p className="font-bold text-[#0F172A] mb-1.5 text-[15px]">{item.title}</p>
                <p className="text-[14px] text-[#64748B] leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================================================================
          CTA BANNER
      ================================================================ */}
      <section
        className="relative py-24 overflow-hidden"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1522337660859-02fbefca4702?q=80&w=2000&auto=format&fit=crop')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-[#0F172A]/70" />
        <div className="relative z-10 max-w-xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4 leading-tight">
            Are you a beauty professional?
          </h2>
          <p className="text-lg text-white/65 mb-8 leading-relaxed">
            Post a model call in under 5 minutes and fill your slow days with portfolio shoots and raving reviews.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {session ? (
              <Link href="/onboard" className="px-8 py-4 rounded-full font-bold text-[15px] bg-[#0D9488] text-white hover:bg-teal-600 transition-all duration-200 shadow-lg">
                List a Model Call
              </Link>
            ) : (
              <button onClick={() => signIn()} className="px-8 py-4 rounded-full font-bold text-[15px] bg-[#0D9488] text-white hover:bg-teal-600 transition-all duration-200 shadow-lg">
                List a Model Call
              </button>
            )}
            <Link href="/for-businesses" className="px-8 py-4 rounded-full font-bold text-[15px] border-2 border-white/35 text-white hover:border-white transition-all duration-200">
              Learn more
            </Link>
          </div>
        </div>
      </section>
    </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------
export const getServerSideProps: GetServerSideProps<Props> = async () => {
  try {
    const businesses = await prismaClient.business.findMany({
      where: { services: { some: { isActive: true } } },
      select: {
        slug: true, name: true, suburb: true, state: true, verified: true,
        services: { where: { isActive: true }, select: { price: true, category: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 60,
    });

    const listings: BusinessCard[] = businesses.map((b) => ({
      slug:          b.slug,
      name:          b.name,
      suburb:        b.suburb ?? null,
      state:         b.state  ?? null,
      verified:      b.verified,
      category:      b.services[0]?.category ?? null,
      minPrice:      b.services.length > 0 ? Math.min(...b.services.map((s) => s.price)) : 0,
      serviceCount:  b.services.length,
      nextAvailable: null,
      slotsToday:    0,
    }));

    return { props: { listings } };
  } catch (err) {
    console.error('Homepage SSP error:', err);
    return { props: { listings: [] } };
  }
};
