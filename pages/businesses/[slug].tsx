// pages/businesses/[slug].tsx — Public business profile + booking
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import dynamic from 'next/dynamic';
import prisma from '../../lib/prisma';

const BookingCalendar = dynamic(() => import('../../components/BookingCalendar'), { ssr: false });

interface ReviewSnippet {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: { name: string | null };
}

interface ServiceInfo {
  id: string;
  name: string;
  price: number;
  originalPrice: number | null;
  durationMin: number;
  category: string | null;
  description: string | null;
}

interface BusinessProfile {
  id: string;
  name: string;
  slug: string;
  suburb: string | null;
  city: string | null;
  state: string | null;
  bio: string | null;
  instagramHandle: string | null;
  avgRating: number | null;
  services: ServiceInfo[];
  reviews: ReviewSnippet[];
}

interface Props {
  business: BusinessProfile | null;
}

export default function BusinessProfilePage({ business }: Props) {
  const { data: session } = useSession();
  const [selectedService, setSelectedService] = useState<ServiceInfo | null>(
    business?.services[0] ?? null
  );

  if (!business) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500 text-lg mb-4">Business not found.</p>
          <Link href="/" className="text-pink-500 hover:underline">← Back to listings</Link>
        </div>
      </div>
    );
  }

  const isFree = selectedService?.price === 0;

  return (
    <>
      <Head>
        <title>{business.name} | ModelCall</title>
        <meta name="description" content={business.bio ?? `Book a model call with ${business.name}`} />
      </Head>
      <div className="min-h-screen bg-gray-50">
        {/* Gradient accent bar */}
        <div className="bg-white border-b">
          <div className="h-1.5 bg-gradient-to-r from-pink-400 to-purple-400" />
          <div className="max-w-4xl mx-auto px-4 py-6">
            <Link href="/" className="text-sm text-pink-500 hover:underline mb-3 inline-block">← Back to listings</Link>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-2xl font-extrabold text-gray-900">{business.name}</h1>
                {(business.suburb || business.city) && (
                  <p className="text-sm text-gray-500 mt-1">
                    📍 {[business.suburb, business.city, business.state].filter(Boolean).join(', ')}
                  </p>
                )}
                {business.avgRating && (
                  <span className="inline-block mt-2 text-sm font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                    ★ {business.avgRating.toFixed(1)} average rating
                  </span>
                )}
              </div>
              {business.instagramHandle && (
                <a
                  href={`https://instagram.com/${business.instagramHandle}`}
                  target="_blank" rel="noopener noreferrer"
                  className="text-pink-500 hover:text-pink-600 text-sm font-medium"
                >
                  @{business.instagramHandle}
                </a>
              )}
            </div>
            {business.bio && (
              <p className="mt-4 text-gray-600 text-sm max-w-2xl">{business.bio}</p>
            )}
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left: service list */}
          <div className="md:col-span-1">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Services</h2>
            <div className="space-y-2">
              {business.services.map((svc) => {
                const isSelected = selectedService?.id === svc.id;
                const free = svc.price === 0;
                return (
                  <button key={svc.id} onClick={() => setSelectedService(svc)}
                    className={`w-full text-left rounded-xl border p-4 transition ${
                      isSelected
                        ? 'border-pink-400 bg-pink-50 shadow-sm'
                        : 'border-gray-200 bg-white hover:border-pink-300'
                    }`}>
                    <p className="font-medium text-gray-900 text-sm leading-snug">{svc.name}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={`text-sm font-bold ${free ? 'text-green-600' : 'text-pink-600'}`}>
                        {free ? 'FREE' : `$${(svc.price / 100).toFixed(0)}`}
                      </span>
                      {svc.originalPrice && svc.originalPrice > svc.price && (
                        <span className="text-xs text-gray-400 line-through">${(svc.originalPrice / 100).toFixed(0)}</span>
                      )}
                      <span className="text-xs text-gray-400">{svc.durationMin} min</span>
                    </div>
                    {svc.category && (
                      <span className="text-xs text-pink-500 mt-1 inline-block">{svc.category}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: booking calendar */}
          <div className="md:col-span-2">
            {!session ? (
              <div className="bg-white rounded-xl border p-8 text-center">
                <p className="text-gray-500 mb-4">Sign in to book this service</p>
                <button onClick={() => signIn()}
                  className="px-6 py-2.5 bg-pink-500 hover:bg-pink-600 text-white rounded-lg font-medium text-sm transition">
                  Sign In / Sign Up
                </button>
              </div>
            ) : selectedService ? (
              <div>
                <div className="mb-3 flex items-center gap-3 flex-wrap">
                  <h2 className="font-semibold text-gray-900">{selectedService.name}</h2>
                  <span className={`text-sm font-bold ${isFree ? 'text-green-600' : 'text-pink-600'}`}>
                    {isFree ? 'FREE (card required)' : `$${(selectedService.price / 100).toFixed(0)}`}
                  </span>
                </div>
                {selectedService.description && (
                  <p className="text-sm text-gray-500 mb-4">{selectedService.description}</p>
                )}
                <BookingCalendar
                  businessId={business.id}
                  serviceId={selectedService.id}
                  durationMin={selectedService.durationMin}
                />
              </div>
            ) : null}
          </div>
        </div>

        {/* Reviews */}
        {business.reviews.length > 0 && (
          <div className="max-w-4xl mx-auto px-4 pb-12">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Reviews</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {business.reviews.map((rev) => (
                <div key={rev.id} className="bg-white rounded-xl border p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-800">{rev.user.name ?? 'Anonymous'}</span>
                    <span className="text-amber-400 text-sm">
                      {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                    </span>
                  </div>
                  {rev.comment && <p className="text-sm text-gray-600">{rev.comment}</p>}
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(rev.createdAt).toLocaleDateString('en-AU', { dateStyle: 'medium' })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const slug = params?.slug as string;
  try {
    const business = await prisma.business.findUnique({
      where: { slug },
      include: {
        services: {
          where: { isActive: true },
          orderBy: { price: 'asc' },
        },
        bookings: {
          where: { status: 'COMPLETED' },
          include: {
            review: {
              include: { user: { select: { name: true } } },
            },
          },
          orderBy: { startTime: 'desc' },
          take: 20,
        },
      },
    });

    if (!business) return { props: { business: null } };

    const reviews = business.bookings
      .filter((b) => b.review)
      .map((b) => ({
        id: b.review!.id,
        rating: b.review!.rating,
        comment: b.review!.comment ?? null,
        createdAt: b.review!.createdAt.toISOString(),
        user: b.review!.user,
      }));

    return {
      props: {
        business: {
          id: business.id,
          name: business.name,
          slug: business.slug,
          suburb: business.suburb ?? null,
          city: business.city ?? null,
          state: business.state ?? null,
          bio: business.bio ?? null,
          instagramHandle: business.instagramHandle ?? null,
          avgRating: business.avgRating ?? null,
          services: business.services.map((s) => ({
            id: s.id,
            name: s.name,
            price: s.price,
            originalPrice: s.originalPrice ?? null,
            durationMin: s.durationMin,
            category: s.category ?? null,
            description: s.description ?? null,
          })),
          reviews,
        },
      },
    };
  } catch (err) {
    console.error('[getServerSideProps /businesses/[slug]]', err);
    return { props: { business: null } };
  }
};
