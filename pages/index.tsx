// pages/index.tsx
import Head from 'next/head';
import BookingCalendar from '../components/BookingCalendar';
import { useSession, signIn, signOut } from "next-auth/react";

export default function Home() {
  const { data: session } = useSession();

  // Hardcoded for MVP Demo (use the seeded Business ID)
  const businessId = "e2a2f459-8f8d-41b4-8839-810a31434c9a";
  const serviceId = "srv_123"; 
  const durationMin = 30;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Head>
        <title>Ares Booking Platform</title>
        <meta name="description" content="Book your next appointment with ease." />
      </Head>

      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
            Ares Demo Salon
          </h1>
          <p className="text-lg text-gray-600">
            Book your 30-min consultation below.
          </p>
        </div>

        {/* 1. If Logged Out: Show Sign In Button */}
        {!session && (
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
            <p className="text-gray-500 mb-4">You must be logged in to book.</p>
            <button
              onClick={() => signIn()}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Sign In / Sign Up
            </button>
          </div>
        )}

        {/* 2. If Logged In: Show Calendar & Logout */}
        {session && (
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="flex justify-between items-center mb-6">
              <p className="text-sm text-gray-700">
                Welcome, <strong>{session.user?.email}</strong>!
              </p>
              <button 
                onClick={() => signOut()}
                className="text-xs text-red-600 hover:text-red-800 underline"
              >
                Sign Out
              </button>
            </div>

            <BookingCalendar 
              businessId={businessId} 
              serviceId={serviceId} 
              durationMin={durationMin} 
            />
          </div>
        )}

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Powered by Ares Booking Platform 🛡️</p>
        </div>
      </div>
    </div>
  );
}
