// pages/my-bookings.tsx
import { useSession, signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import Head from 'next/head';

interface Booking {
  id: string;
  service: { name: string; durationMin: number };
  startTime: string;
  status: string;
}

export default function MyBookings() {
  const { data: session, status } = useSession();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch User's Bookings
  useEffect(() => {
    if (status === "authenticated") {
      fetch('/api/user/bookings') // TODO: Create this endpoint
        .then(res => res.json())
        .then(data => {
          setBookings(data);
          setLoading(false);
        })
        .catch(console.error);
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status]);

  if (status === "loading") return <div className="p-8 text-center">Loading session...</div>;

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="mb-4">You must be logged in to view bookings.</p>
        <button onClick={() => signIn()} className="bg-blue-600 text-white px-4 py-2 rounded">Sign In</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Head><title>My Bookings | Ares</title></Head>
      
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">My Bookings</h1>

        {loading ? <p>Loading bookings...</p> : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {bookings.length === 0 && (
                <li className="p-6 text-center text-gray-500">No bookings found.</li>
              )}
              
              {bookings.map((booking) => (
                <li key={booking.id} className="px-6 py-4 hover:bg-gray-50 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-indigo-600 truncate">{booking.service.name}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(booking.startTime).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' : 
                        booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-gray-100 text-gray-800'}`}>
                      {booking.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
