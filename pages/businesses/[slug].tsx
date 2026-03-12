// pages/businesses/[slug].tsx
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import prismaClient from '../../lib/prisma';
import dynamic from 'next/dynamic';
import {
  ArrowLeft, MapPin, Star, CheckCircle2, Share2,
  Heart, Clock, Calendar, ChevronRight, BadgeCheck,
  Instagram, Shield, Users,
} from 'lucide-react';

const BookingCalendar = dynamic(() => import('../../components/BookingCalendar'), { ssr: false });

// ---------------------------------------------------------------------------
// Image helpers
// ---------------------------------------------------------------------------
const CAT_PHOTOS: Record<string, string[]> = {
  Injectables: [
    'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1512496015851-a9083832c668?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1522337660859-02fbefca4702?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1503236823255-94609f598e71?q=80&w=800&auto=format&fit=crop',
  ],
  Lashes: [
    'https://images.unsplash.com/photo-1583001931096-959e9a1a6223?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1522337660859-02fbefca4702?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1512496015851-a9083832c668?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1503236823255-94609f598e71?q=80&w=800&auto=format&fit=crop',
  ],
  Hair: [
    'https://images.unsplash.com/photo-1562322140-8baeececf3df?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1522337660859-02fbefca4702?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1604654894610-df63bc536371?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=800&auto=format&fit=crop',
  ],
  Nails: [
    'https://images.unsplash.com/photo-1604654894610-df63bc536371?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1522337660859-02fbefca4702?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1503236823255-94609f598e71?q=80&w=800&auto=format&fit=crop',
  ],
};

const FALLBACK_PHOTOS = [
  'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1522337660859-02fbefca4702?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1562322140-8baeececf3df?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1604654894610-df63bc536371?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=800&auto=format&fit=crop',
];

function getPhotos(cat: string | null): string[] {
  return (cat && CAT_PHOTOS[cat]) ? CAT_PHOTOS[cat] : FALLBACK_PHOTOS;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ServiceInfo {
  id: string;
  name: string;
  price: number;
  originalPrice: number | null;
  durationMin: number;
  category: string | null;
  description: string | null;
}

interface ReviewInfo {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: { name: string | null };
}

interface BusinessData {
  id: string;
  name: string;
  slug: string;
  suburb: string | null;
  city: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  bio: string | null;
  instagramHandle: string | null;
  avgRating: number | null;
  verified: boolean;
  services: ServiceInfo[];
  reviews: ReviewInfo[];
}

interface Props {
  business: BusinessData | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map((n) => (
        <Star
          key={n}
          className={`w-3.5 h-3.5 ${n <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-[#E2E8F0]'}`}
          strokeWidth={0}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function BusinessProfilePage({ business }: Props) {
  const { data: session }  = useSession();
  const [selectedSvc, setSelectedSvc] = useState<ServiceInfo | null>(
    business?.services[0] ?? null
  );
  const [saved, setSaved]           = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [nextAvailable, setNextAvailable] = useState<string | null>(null);
  const [slotsToday, setSlotsToday] = useState(0);
  const [availLoading, setAvailLoading] = useState(true);

  // Fetch availability client-side
  useEffect(() => {
    if (!business?.id) return;
    async function fetchAvail() {
      try {
        const qs = new URLSearchParams({ businessId: business!.id, days: '7' }).toString();
        const res = await fetch(`/api/availability/next?${qs}`);
        if (!res.ok) return;
        const data = await res.json();
        setNextAvailable(data.nextAvailable);
        const todayStr = new Date().toISOString().slice(0, 10);
        const todaySlots = data.dates?.[todayStr]?.length ?? 0;
        setSlotsToday(todaySlots);
      } catch { /* non-critical */ }
      finally { setAvailLoading(false); }
    }
    fetchAvail();
  }, [business?.id]);

  if (!business) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center gap-5 px-4">
        <MapPin className="w-14 h-14 text-[#CBD5E1]" strokeWidth={1.5} />
        <h1 className="text-2xl font-bold text-[#0F172A]">Listing not found</h1>
        <p className="text-[#64748B] text-sm text-center max-w-xs">
          This listing may have been removed or the link is incorrect.
        </p>
        <Link
          href="/"
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#0D9488] text-white font-bold text-sm hover:bg-teal-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Browse listings
        </Link>
      </div>
    );
  }

  const firstCat  = business.services[0]?.category ?? null;
  const photos    = getPhotos(firstCat);
  const lowestSvc = business.services.reduce<ServiceInfo | null>((a, b) => (!a || b.price < a.price ? b : a), null);

  return (
    <>
      <Head>
        <title>{business.name} — Free & Discounted {firstCat ?? 'Beauty'} Treatments | Model Call</title>
        <meta name="description" content={business.bio ?? `Book a free or discounted ${firstCat ?? 'beauty'} treatment with ${business.name} in ${[business.suburb, business.state].filter(Boolean).join(', ') || 'Australia'}. Verified clinic on Model Call.`} />
        <link rel="canonical" href={`https://modelcall.app/businesses/${business.slug}`} />
        <meta property="og:title" content={`${business.name} — Model Call`} />
        <meta property="og:description" content={`Book ${firstCat ?? 'beauty'} treatments with ${business.name}. ${lowestSvc?.price === 0 ? 'FREE sessions available.' : `From $${lowestSvc ? (lowestSvc.price / 100).toFixed(0) : '0'}.`}`} />
        <meta property="og:url" content={`https://modelcall.app/businesses/${business.slug}`} />
        <meta name="twitter:title" content={`${business.name} — Model Call`} />
        <meta name="twitter:description" content={`${firstCat ?? 'Beauty'} model call in ${[business.suburb, business.state].filter(Boolean).join(', ') || 'Australia'}.`} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'HealthAndBeautyBusiness',
              name: business.name,
              url: `https://modelcall.app/businesses/${business.slug}`,
              image: photos[0],
              ...(business.suburb || business.state ? {
                address: {
                  '@type': 'PostalAddress',
                  addressLocality: business.suburb ?? undefined,
                  addressRegion: business.state ?? undefined,
                  addressCountry: 'AU',
                },
              } : {}),
              ...(business.bio ? { description: business.bio } : {}),
              ...(business.avgRating && business.reviews.length > 0 ? {
                aggregateRating: {
                  '@type': 'AggregateRating',
                  ratingValue: business.avgRating.toFixed(1),
                  reviewCount: business.reviews.length,
                  bestRating: 5,
                  worstRating: 1,
                },
              } : {}),
              ...(business.reviews.length > 0 ? {
                review: business.reviews.slice(0, 5).map((rev) => ({
                  '@type': 'Review',
                  reviewRating: {
                    '@type': 'Rating',
                    ratingValue: rev.rating,
                    bestRating: 5,
                  },
                  author: {
                    '@type': 'Person',
                    name: rev.user.name ?? 'Anonymous',
                  },
                  datePublished: rev.createdAt.split('T')[0],
                  ...(rev.comment ? { reviewBody: rev.comment } : {}),
                })),
              } : {}),
              hasOfferCatalog: {
                '@type': 'OfferCatalog',
                name: 'Model Call Treatments',
                itemListElement: business.services.map((svc) => ({
                  '@type': 'Offer',
                  itemOffered: {
                    '@type': 'Service',
                    name: svc.name,
                    ...(svc.description ? { description: svc.description } : {}),
                  },
                  price: (svc.price / 100).toFixed(2),
                  priceCurrency: 'AUD',
                  availability: 'https://schema.org/InStock',
                })),
              },
            }),
          }}
        />
      </Head>

      <div className="bg-[#F8FAFC] min-h-screen">

        {/* ── Breadcrumb ────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-3">
          <div className="flex items-center justify-between">
            <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-[#64748B] hover:text-[#0F172A] transition-colors group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" strokeWidth={2} />
              Model Calls
            </Link>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSaved(!saved)}
                className="flex items-center gap-1.5 text-sm font-semibold text-[#0F172A] hover:text-[#64748B] transition-colors px-3 py-1.5"
              >
                <Heart className={`w-4 h-4 ${saved ? 'fill-rose-500 text-rose-500' : ''}`} strokeWidth={2} />
                Save
              </button>
              <button className="flex items-center gap-1.5 text-sm font-semibold text-[#0F172A] hover:text-[#64748B] transition-colors px-3 py-1.5">
                <Share2 className="w-4 h-4" strokeWidth={2} />
                Share
              </button>
            </div>
          </div>
        </div>

        {/* ── 5-Photo Grid ──────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-10">
          <div className="rounded-2xl overflow-hidden" style={{ height: 460 }}>
            <div className="grid grid-cols-4 grid-rows-2 gap-1.5 h-full">
              {/* Hero: left half, full height */}
              <div className="col-span-2 row-span-2 overflow-hidden relative group">
                <img
                  src={photos[0]}
                  alt={business.name}
                  className="w-full h-full object-cover group-hover:scale-[1.025] transition-transform duration-700"
                />
              </div>
              {/* 4 small tiles */}
              {photos.slice(1, 5).map((src, idx) => (
                <div key={idx} className="overflow-hidden relative group">
                  <img
                    src={src}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Two-col body ──────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-14">

            {/* ════════════════════════════════════════
                LEFT — Content (2/3)
            ════════════════════════════════════════ */}
            <div className="lg:col-span-2 space-y-10">

              {/* Title */}
              <div className="pb-8 border-b border-[#E2E8F0]">
                <div className="flex items-center gap-2.5 flex-wrap mb-2">
                  <h1 className="text-2xl sm:text-[28px] font-black text-[#0F172A] leading-tight">
                    {business.name}
                  </h1>
                  {business.verified && (
                    <span className="flex items-center gap-1.5 bg-blue-50 text-blue-700 text-[11px] font-bold px-2.5 py-1 rounded-full">
                      <BadgeCheck className="w-3.5 h-3.5" strokeWidth={2.5} />
                      Verified Academy
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-[13px] text-[#64748B] mt-2">
                  {(business.suburb || business.state) && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" strokeWidth={2} />
                      {[business.suburb, business.city, business.state].filter(Boolean).join(', ')}
                    </span>
                  )}
                  {business.avgRating && (
                    <span className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" strokeWidth={0} />
                      <strong className="text-[#0F172A]">{business.avgRating.toFixed(1)}</strong>
                      <span>({business.reviews.length} review{business.reviews.length !== 1 ? 's' : ''})</span>
                    </span>
                  )}
                  {business.instagramHandle && (
                    <a href={`https://instagram.com/${business.instagramHandle}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[#0D9488] hover:underline">
                      <Instagram className="w-3.5 h-3.5" strokeWidth={2} />
                      @{business.instagramHandle}
                    </a>
                  )}
                </div>
              </div>

              {/* Host */}
              <div className="flex items-center gap-4 pb-8 border-b border-[#E2E8F0]">
                <div className="relative shrink-0">
                  <img src="https://i.pravatar.cc/80?img=45" alt="Host" className="w-14 h-14 rounded-full object-cover" />
                  {business.verified && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-[#0D9488] rounded-full flex items-center justify-center border-2 border-white">
                      <CheckCircle2 className="w-3 h-3 text-white" strokeWidth={2.5} />
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-[#0F172A] text-[15px]">
                    Hosted by {business.name.split(' ')[0]}
                  </p>
                  <p className="text-[13px] text-[#94A3B8]">Joined 2024 · Beauty Professional</p>
                </div>
                <div className="hidden sm:flex items-center gap-6 text-center">
                  {[
                    { val: business.reviews.length, label: 'Reviews' },
                    ...(business.avgRating ? [{ val: business.avgRating.toFixed(1), label: 'Rating' }] : []),
                    { val: business.services.length, label: 'Services' },
                  ].map((stat) => (
                    <div key={stat.label}>
                      <p className="text-[17px] font-black text-[#0F172A] leading-none">{stat.val}</p>
                      <p className="text-[11px] text-[#94A3B8] mt-0.5">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trust badges */}
              <div className="grid sm:grid-cols-3 gap-5 pb-8 border-b border-[#E2E8F0]">
                {[
                  { Icon: BadgeCheck, title: 'Certified professional', sub: 'Fully qualified & insured' },
                  { Icon: Shield,     title: 'Safe & hygienic',         sub: 'Clinical standards maintained' },
                  { Icon: Users,      title: 'Model-friendly',          sub: 'Great for first-timers' },
                ].map(({ Icon, title, sub }) => (
                  <div key={title} className="flex items-start gap-3">
                    <Icon className="w-6 h-6 text-[#0D9488] shrink-0 mt-0.5" strokeWidth={1.75} />
                    <div>
                      <p className="font-semibold text-[#0F172A] text-[14px]">{title}</p>
                      <p className="text-[13px] text-[#94A3B8]">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* About */}
              {business.bio && (
                <div className="pb-8 border-b border-[#E2E8F0]">
                  <h2 className="text-[17px] font-black text-[#0F172A] mb-4">About this clinic</h2>
                  <p className="text-[15px] text-[#475569] leading-relaxed whitespace-pre-line">{business.bio}</p>
                </div>
              )}

              {/* Services */}
              <div className="pb-8 border-b border-[#E2E8F0]">
                <h2 className="text-[17px] font-black text-[#0F172A] mb-5">Model call treatments</h2>
                <div className="space-y-3">
                  {business.services.map((svc) => {
                    const isSelected = selectedSvc?.id === svc.id;
                    const free = svc.price === 0;
                    return (
                      <div
                        key={svc.id}
                        onClick={() => { setSelectedSvc(svc); setShowBooking(true); }}
                        className={`
                          flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer
                          transition-all duration-150 hover:-translate-y-px
                          ${isSelected
                            ? 'border-[#0D9488] bg-[#F0FDFA] shadow-[0_2px_16px_rgba(13,148,136,0.1)]'
                            : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1] hover:shadow-sm'
                          }
                        `}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <p className="font-semibold text-[#0F172A] text-[14px]">{svc.name}</p>
                            {svc.category && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F0FDFA] text-[#0D9488]">
                                {svc.category}
                              </span>
                            )}
                          </div>
                          {svc.description && (
                            <p className="text-[13px] text-[#94A3B8] truncate">{svc.description}</p>
                          )}
                          <span className="inline-flex items-center gap-1 mt-1.5 text-[12px] text-[#94A3B8]">
                            <Clock className="w-3 h-3" strokeWidth={2} />
                            {svc.durationMin} min
                          </span>
                        </div>
                        <div className="flex items-center gap-4 shrink-0">
                          <div className="text-right">
                            <p className={`text-[15px] font-black leading-none ${free ? 'text-[#0D9488]' : 'text-[#0F172A]'}`}>
                              {free ? 'FREE' : `$${(svc.price / 100).toFixed(0)}`}
                            </p>
                            {svc.originalPrice && svc.originalPrice > svc.price && (
                              <p className="text-[12px] text-[#CBD5E1] line-through mt-0.5">
                                ${(svc.originalPrice / 100).toFixed(0)}
                              </p>
                            )}
                          </div>
                          <button className={`
                            px-4 py-2 rounded-xl text-[13px] font-bold border-2 transition-all duration-150
                            ${isSelected
                              ? 'border-[#0D9488] bg-[#0D9488] text-white'
                              : 'border-[#E2E8F0] text-[#0F172A] hover:border-[#0D9488] hover:text-[#0D9488]'
                            }
                          `}>
                            {isSelected ? 'Selected' : 'Select'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Map */}
              <div className="pb-8 border-b border-[#E2E8F0]">
                <h2 className="text-[17px] font-black text-[#0F172A] mb-1">Location</h2>
                {(business.suburb || business.state) && (
                  <p className="text-[14px] text-[#64748B] mb-4 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-[#0D9488]" strokeWidth={2} />
                    {[business.suburb, business.city, business.state].filter(Boolean).join(', ')}
                  </p>
                )}
                {business.latitude && business.longitude ? (
                  <div className="rounded-2xl overflow-hidden" style={{ height: 200 }}>
                    <iframe
                      title="Business location"
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${business.longitude - 0.01},${business.latitude - 0.008},${business.longitude + 0.01},${business.latitude + 0.008}&layer=mapnik&marker=${business.latitude},${business.longitude}`}
                    />
                  </div>
                ) : (
                  <div
                    className="relative rounded-2xl overflow-hidden bg-[#E2E8F0] flex items-center justify-center"
                    style={{ height: 200 }}
                  >
                    <div className="bg-white rounded-2xl px-5 py-3 shadow-xl flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#0D9488] flex items-center justify-center shrink-0">
                        <MapPin className="w-4 h-4 text-white fill-white" strokeWidth={2} />
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-[#0F172A]">{business.name}</p>
                        <p className="text-[11px] text-[#94A3B8]">
                          {[business.suburb, business.state].filter(Boolean).join(', ') || 'Australia'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                <p className="mt-3 text-[12px] text-[#94A3B8]">Exact address shared after booking confirmation.</p>
              </div>

              {/* Reviews */}
              {business.reviews.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-7">
                    <Star className="w-5 h-5 fill-[#0F172A] text-[#0F172A]" strokeWidth={0} />
                    <span className="text-[22px] font-black text-[#0F172A]">
                      {business.avgRating?.toFixed(1)}
                    </span>
                    <span className="w-px h-6 bg-[#E2E8F0]" />
                    <span className="text-[17px] font-black text-[#0F172A]">
                      {business.reviews.length} review{business.reviews.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-5">
                    {business.reviews.map((rev) => (
                      <div key={rev.id} className="bg-white rounded-2xl p-5 border border-[#E2E8F0]">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0D9488] to-[#0F172A] flex items-center justify-center text-white text-xs font-bold shrink-0">
                              {(rev.user.name ?? 'A')[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="text-[13px] font-semibold text-[#0F172A]">{rev.user.name ?? 'Anonymous'}</p>
                              <p className="text-[11px] text-[#CBD5E1]">
                                {new Date(rev.createdAt).toLocaleDateString('en-AU', { dateStyle: 'medium' })}
                              </p>
                            </div>
                          </div>
                          <StarRow rating={rev.rating} />
                        </div>
                        {rev.comment && (
                          <p className="text-[13px] text-[#475569] leading-relaxed">{rev.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ════════════════════════════════════════
                RIGHT — Sticky Booking Widget (1/3)
            ════════════════════════════════════════ */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <div className="bg-white rounded-3xl shadow-2xl border border-[#E2E8F0] overflow-hidden">

                  {/* Price header */}
                  <div className="px-6 pt-6 pb-5 border-b border-[#E2E8F0]">
                    <div className="flex items-baseline gap-3 mb-1.5">
                      <span className={`text-2xl font-black ${lowestSvc?.price === 0 ? 'text-[#0D9488]' : 'text-[#0F172A]'}`}>
                        {lowestSvc?.price === 0 ? 'FREE' : lowestSvc ? `From $${(lowestSvc.price / 100).toFixed(0)}` : 'Free'}
                      </span>
                      {lowestSvc?.originalPrice && lowestSvc.originalPrice > lowestSvc.price && (
                        <span className="text-[15px] text-[#CBD5E1] line-through">
                          ${(lowestSvc.originalPrice / 100).toFixed(0)}
                        </span>
                      )}
                    </div>
                    {business.avgRating ? (
                      <div className="flex items-center gap-1.5 text-[13px]">
                        <Star className="w-3.5 h-3.5 fill-[#0F172A] text-[#0F172A]" strokeWidth={0} />
                        <span className="font-semibold text-[#0F172A]">{business.avgRating.toFixed(1)}</span>
                        <span className="text-[#94A3B8]">·</span>
                        <span className="text-[#94A3B8] underline cursor-pointer">
                          {business.reviews.length} review{business.reviews.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    ) : (
                      <p className="text-[13px] text-[#94A3B8]">No reviews yet</p>
                    )}
                  </div>

                  {/* Treatment picker */}
                  {business.services.length > 1 && (
                    <div className="px-6 py-4 border-b border-[#E2E8F0]">
                      <p className="text-[10px] font-black text-[#0F172A] tracking-widest uppercase mb-2">Treatment</p>
                      <select
                        value={selectedSvc?.id ?? ''}
                        onChange={(e) => {
                          const found = business.services.find(s => s.id === e.target.value);
                          if (found) setSelectedSvc(found);
                        }}
                        className="w-full text-[13px] font-medium text-[#0F172A] bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] transition-all"
                      >
                        {business.services.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} — {s.price === 0 ? 'FREE' : `$${(s.price / 100).toFixed(0)}`} ({s.durationMin} min)
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Next available info */}
                  <div className="px-6 py-4 border-b border-[#E2E8F0]">
                    {availLoading ? (
                      <div className="rounded-xl border-2 border-[#E2E8F0] px-4 py-3 text-center">
                        <div className="w-4 h-4 border-2 border-[#0D9488] border-t-transparent rounded-full animate-spin mx-auto mb-1" />
                        <p className="text-[12px] text-[#94A3B8]">Checking availability&hellip;</p>
                      </div>
                    ) : nextAvailable ? (
                      <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50/50 px-4 py-3">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <p className="text-[10px] font-black text-emerald-700 tracking-widest uppercase">Next Available</p>
                        </div>
                        <p className="text-[14px] font-bold text-[#0F172A]">
                          {new Date(nextAvailable).toLocaleDateString('en-AU', {
                            weekday: 'long', day: 'numeric', month: 'short',
                          })}
                        </p>
                        {slotsToday > 0 && (
                          <p className="text-[12px] text-emerald-600 font-medium mt-0.5">
                            {slotsToday} spot{slotsToday !== 1 ? 's' : ''} available today
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="rounded-xl border-2 border-[#E2E8F0] px-4 py-3 text-center">
                        <Clock className="w-5 h-5 text-[#CBD5E1] mx-auto mb-1" strokeWidth={2} />
                        <p className="text-[13px] text-[#94A3B8]">No upcoming availability</p>
                      </div>
                    )}
                  </div>

                  {/* BookingCalendar (expanded when signed in & a service is selected) */}
                  {showBooking && selectedSvc && session && (
                    <div className="px-4 pt-2">
                      <BookingCalendar
                        businessId={business.id}
                        serviceId={selectedSvc.id}
                        durationMin={selectedSvc.durationMin}
                      />
                    </div>
                  )}

                  {/* CTA */}
                  <div className="px-6 pt-4 pb-6">
                    {session ? (
                      <button
                        onClick={() => setShowBooking(!showBooking)}
                        className="w-full py-4 rounded-2xl font-bold text-[15px] bg-gradient-to-r from-[#0D9488] to-teal-600 text-white hover:opacity-90 active:opacity-80 transition-opacity shadow-lg shadow-teal-900/20 flex items-center justify-center gap-2"
                      >
                        Apply for Model Call
                        <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
                      </button>
                    ) : (
                      <button
                        onClick={() => signIn()}
                        className="w-full py-4 rounded-2xl font-bold text-[15px] bg-gradient-to-r from-[#0D9488] to-teal-600 text-white hover:opacity-90 active:opacity-80 transition-opacity shadow-lg shadow-teal-900/20"
                      >
                        Sign in to Apply
                      </button>
                    )}
                    <p className="text-center text-[12px] text-[#94A3B8] mt-3">You won&rsquo;t be charged yet.</p>

                    {/* Breakdown */}
                    {selectedSvc && (
                      <div className="mt-5 space-y-2 text-[13px]">
                        <div className="flex justify-between text-[#64748B]">
                          <span>{selectedSvc.name}</span>
                          <span>{selectedSvc.price === 0 ? 'FREE' : `$${(selectedSvc.price / 100).toFixed(0)}`}</span>
                        </div>
                        {selectedSvc.originalPrice && selectedSvc.originalPrice > selectedSvc.price && (
                          <div className="flex justify-between text-[#64748B]">
                            <span>Model Call discount</span>
                            <span className="text-[#0D9488] font-semibold">
                              –${((selectedSvc.originalPrice - selectedSvc.price) / 100).toFixed(0)}
                            </span>
                          </div>
                        )}
                        <div className="border-t border-[#E2E8F0] pt-2 flex justify-between font-bold text-[#0F172A]">
                          <span>Total</span>
                          <span>{selectedSvc.price === 0 ? 'FREE' : `$${(selectedSvc.price / 100).toFixed(0)}`}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-center mt-4 text-[12px] text-[#CBD5E1] hover:text-[#94A3B8] cursor-pointer transition-colors">
                  Report this listing
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------
export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const slug = params?.slug as string;
  try {
    const business = await prismaClient.business.findUnique({
      where:   { slug },
      include: {
        services: { where: { isActive: true }, orderBy: { price: 'asc' } },
        bookings: {
          where:   { status: 'COMPLETED' },
          include: { review: { include: { user: { select: { name: true } } } } },
          orderBy: { startTime: 'desc' },
          take:    20,
        },
      },
    });

    if (!business) return { props: { business: null } };

    const reviews = business.bookings
      .filter((b) => b.review)
      .map((b) => ({
        id:        b.review!.id,
        rating:    b.review!.rating,
        comment:   b.review!.comment ?? null,
        createdAt: b.review!.createdAt.toISOString(),
        user:      b.review!.user,
      }));

    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : null;

    return {
      props: {
        business: {
          id:              business.id,
          name:            business.name,
          slug:            business.slug,
          suburb:          business.suburb          ?? null,
          city:            business.city            ?? null,
          state:           business.state           ?? null,
          latitude:        business.latitude        ?? null,
          longitude:       business.longitude       ?? null,
          bio:             business.bio             ?? null,
          instagramHandle: business.instagramHandle ?? null,
          verified:        business.verified,
          avgRating,
          services: business.services.map((s) => ({
            id:            s.id,
            name:          s.name,
            price:         s.price,
            originalPrice: s.originalPrice ?? null,
            durationMin:   s.durationMin,
            category:      s.category     ?? null,
            description:   s.description  ?? null,
          })),
          reviews,
        },
      },
    };
  } catch (err) {
    console.error('[slug] SSP error:', err);
    return { props: { business: null } };
  }
};
