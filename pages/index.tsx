// pages/index.tsx — ModelCall marketplace directory
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

export default function Home({ businesses, total, filters }: Props) {
  const router = useRouter();
  const [q, setQ] = useState(filters.q);
  const [suburb, setSuburb] = useState(filters.suburb);
  const [category, setCategory] = useState(filters.category || 'All');
  const [maxPrice, setMaxPrice] = useState(filters.maxPrice);

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
        <title>ModelCall — Find Free &amp; Discounted Beauty Treatments in Australia</title>
        <meta name="description" content="Book free and discounted beauty model calls across Australia." />
      </Head>
      <div className="min-h-screen bg-gray-50">
        {/* Hero */}
        <div className="bg-white border-b">
          <div className="max-w-5xl mx-auto px-4 py-10 text-center">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
              Find your next beauty model call
            </h1>
            <p className="mt-3 text-gray-500 text-lg">
              Free &amp; discounted treatments from talented students and professionals across Australia.
            </p>
            <form
              onSubmit={(e) => { e.preventDefault(); applyFilters(); }}
              className="mt-6 flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto"
            >
              <input
                type="text" placeholder="Search treatments, businesses…" value={q}
                onChange={(e) => setQ(e.target.value)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
              />
              <input
                type="text" placeholder="Suburb or city" value={suburb}
                onChange={(e) => setSuburb(e.target.value)}
                className="w-full sm:w-44 px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
              />
              <button type="submit" className="px-6 py-3 bg-pink-500 hover:bg-pink-600 text-white rounded-lg font-medium text-sm transition">
                Search
              </button>
            </form>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-8">
          {/* Category pills */}
          <div className="flex gap-2 flex-wrap mb-6 items-center">
            {CATEGORIES.map((cat) => (
              <button key={cat} onClick={() => { setCategory(cat); applyFilters({ category: cat }); }}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition ${
                  category === cat ? 'bg-pink-500 text-white border-pink-500' : 'bg-white text-gray-600 border-gray-300 hover:border-pink-400'
                }`}>
                {cat}
              </button>
            ))}
            <div className="ml-auto flex items-center gap-2">
              <label className="text-xs text-gray-500 whitespace-nowrap">Max $</label>
              <input type="number" min={0} placeholder="Any" value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)} onBlur={() => applyFilters()}
                className="w-20 px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
              />
            </div>
          </div>

          <p className="text-sm text-gray-500 mb-4">{total} {total === 1 ? 'listing' : 'listings'} found</p>

          {businesses.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-400 text-lg">No listings found for your search.</p>
              <Link href="/" className="mt-4 inline-block text-pink-500 hover:underline text-sm">Clear filters</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {businesses.map((biz) => {
                const featured = biz.services[0];
                const isFree = featured?.price === 0;
                return (
                  <Link key={biz.id} href={`/businesses/${biz.slug}`}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition overflow-hidden flex flex-col">
                    <div className="h-2 bg-gradient-to-r from-pink-400 to-purple-400" />
                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <h2 className="font-semibold text-gray-900 text-base leading-tight">{biz.name}</h2>
                        {biz.avgRating && (
                          <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full ml-2 shrink-0">
                            ★ {biz.avgRating.toFixed(1)}
                          </span>
                        )}
                      </div>
                      {(biz.suburb || biz.city) && (
                        <p className="text-xs text-gray-400 mb-3">
                          📍 {[biz.suburb, biz.city, biz.state].filter(Boolean).join(', ')}
                        </p>
                      )}
                      {featured && (
                        <div className="mt-auto pt-3 border-t border-gray-100">
                          <p className="text-sm font-medium text-gray-800">{featured.name}</p>
                          <div className="flex items-center justify-between mt-1">
                            <div className="flex items-baseline gap-2">
                              <span className={`text-base font-bold ${isFree ? 'text-green-600' : 'text-pink-600'}`}>
                                {isFree ? 'FREE' : `$${(featured.price / 100).toFixed(0)}`}
                              </span>
                              {featured.originalPrice && featured.originalPrice > featured.price && (
                                <span className="text-xs text-gray-400 line-through">
                                  ${(featured.originalPrice / 100).toFixed(0)}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-gray-400">{featured.durationMin} min</span>
                          </div>
                          {featured.category && (
                            <span className="inline-block mt-2 text-xs bg-pink-50 text-pink-600 px-2 py-0.5 rounded-full">
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
      </div>
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
