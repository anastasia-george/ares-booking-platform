// pages/index.tsx
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import BookingCalendar from '../components/BookingCalendar';
import { useSession, signIn, signOut } from 'next-auth/react';
import prisma from '../lib/prisma';

interface BusinessInfo {
  id: string;
  name: string;
  description: string | null;
}

interface ServiceInfo {
  id: string;
  name: string;
  durationMin: number;
  price: number;
}

interface Props {
  business: BusinessInfo | null;
  service: ServiceInfo | null;
}

export default function Home({ business, service }: Props) {
  const { data: session } = useSession();

  if (!business || !service) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">
          No active business found. Run <code>npm run seed</code> to seed the database.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Head>
        <title>{business.name} | Ares Booking</title>
        <meta
          name="description"
          content={business.description ?? `Book an appointment with ${business.name}.`}
        />
      </Head>

      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">{business.name}</h1>
          {business.description && (
            <p className="text-lg text-gray-600">{business.description}</p>
          )}
          <p className="text-sm text-gray-400 mt-1">
            {service.name} &middot; {service.durationMin} min &middot; ${(service.price / 100).toFixed(2)}
          </p>
        </div>

        {/* Not signed in */}
        {!session && (
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
            <p className="text-gray-500 mb-4">Sign in to book an appointment.</p>
            <button
              onClick={() => signIn()}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Sign In / Sign Up
            </button>
          </div>
        )}

        {/* Signed in */}
        {session && (
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="flex justify-between items-center mb-6">
              <p className="text-sm text-gray-700">
                Welcome, <strong>{session.user?.email}</strong>
              </p>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="text-xs text-red-600 hover:text-red-800 underline"
              >
                Sign Out
              </button>
            </div>
            <BookingCalendar
              businessId={business.id}
              serviceId={service.id}
              durationMin={service.durationMin}
            />
          </div>
        )}

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Powered by Ares Booking Platform</p>
        </div>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  try {
    const business = await prisma.business.findFirst({
      where: { verified: true },
      include: {
        services: {
          where: { isActive: true },
          orderBy: { price: 'asc' },
          take: 1,
        },
      },
    });

    if (!business) {
      return { props: { business: null, service: null } };
    }

    const firstService = business.services[0] ?? null;

    return {
      props: {
        business: {
          id: business.id,
          name: business.name,
          description: business.description ?? null,
        },
        service: firstService
          ? {
              id: firstService.id,
              name: firstService.name,
              durationMin: firstService.durationMin,
              price: firstService.price,
            }
          : null,
      },
    };
  } catch (err) {
    console.error('[getServerSideProps /]', err);
    return { props: { business: null, service: null } };
  }
};
