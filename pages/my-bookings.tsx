// pages/my-bookings.tsx
import { useSession, signIn } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';

interface Booking {
  id: string;
  service: { name: string; durationMin: number; price: number };
  business: { name: string; slug: string };
  startTime: string;
  status: string;
  review: { id: string } | null;
}

interface ReviewForm {
  bookingId: string;
  rating: number;
  comment: string;
}

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: 'bg-green-100 text-green-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
  CANCELLED_BY_USER: 'bg-gray-100 text-gray-500',
  CANCELLED_BY_BUSINESS: 'bg-gray-100 text-gray-500',
  NO_SHOW: 'bg-red-100 text-red-700',
  PENDING_PAYMENT: 'bg-orange-100 text-orange-700',
};

export default function MyBookings() {
  const { data: session, status } = useSession();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewForm, setReviewForm] = useState<ReviewForm | null>(null);
  const [reviewSaving, setReviewSaving] = useState(false);
  const [reviewError, setReviewError] = useState('');

  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/user/bookings')
        .then((res) => res.json())
        .then((data) => { setBookings(Array.isArray(data) ? data : []); setLoading(false); })
        .catch(() => setLoading(false));
    } else if (status === 'unauthenticated') {
      setLoading(false);
    }
  }, [status]);

  const submitReview = async () => {
    if (!reviewForm || reviewForm.rating === 0) return;
    setReviewSaving(true);
    setReviewError('');
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewForm),
      });
      if (!res.ok) {
        const d = await res.json();
        setReviewError(d.error ?? 'Failed to submit');
        return;
      }
      setBookings((prev) =>
        prev.map((b) =>
          b.id === reviewForm.bookingId ? { ...b, review: { id: 'submitted' } } : b
        )
      );
      setReviewForm(null);
    } catch {
      setReviewError('Network error');
    } finally {
      setReviewSaving(false);
    }
  };

  if (status === 'loading') {
    return <div className="p-8 text-center text-gray-500">Loading…</div>;
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-gray-600">Sign in to view your bookings.</p>
        <button
          onClick={() => signIn()}
          className="px-5 py-2 bg-pink-500 text-white rounded-lg font-medium"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <Head><title>My Bookings | ModelCall</title></Head>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Bookings</h1>

        {loading ? (
          <p className="text-gray-500 text-center py-12">Loading bookings…</p>
        ) : bookings.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 mb-4">No bookings yet.</p>
            <Link href="/" className="text-pink-500 hover:underline text-sm">Browse model calls →</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div key={booking.id} className="bg-white rounded-xl border p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/businesses/${booking.business.slug}`}
                      className="font-semibold text-gray-900 hover:text-pink-500 transition"
                    >
                      {booking.business.name}
                    </Link>
                    <p className="text-sm text-gray-600 mt-0.5">
                      {booking.service.name} · {booking.service.durationMin} min
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(booking.startTime).toLocaleString('en-AU', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ${
                      STATUS_COLORS[booking.status] ?? 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {booking.status.replace(/_/g, ' ')}
                  </span>
                </div>

                {/* Review prompt for completed bookings */}
                {booking.status === 'COMPLETED' && !booking.review && (
                  reviewForm?.bookingId === booking.id ? (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm font-medium text-gray-700 mb-2">Leave a review</p>
                      <div className="flex gap-1 mb-3">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() =>
                              setReviewForm((f) => (f ? { ...f, rating: star } : null))
                            }
                            className={`text-2xl ${
                              reviewForm.rating >= star ? 'text-amber-400' : 'text-gray-300'
                            }`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                      <textarea
                        value={reviewForm.comment}
                        onChange={(e) =>
                          setReviewForm((f) => (f ? { ...f, comment: e.target.value } : null))
                        }
                        rows={2}
                        placeholder="Share your experience (optional)"
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 mb-2"
                      />
                      {reviewError && (
                        <p className="text-xs text-red-500 mb-2">{reviewError}</p>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={submitReview}
                          disabled={reviewSaving || reviewForm.rating === 0}
                          className="px-4 py-1.5 bg-pink-500 hover:bg-pink-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition"
                        >
                          {reviewSaving ? 'Submitting…' : 'Submit Review'}
                        </button>
                        <button
                          onClick={() => { setReviewForm(null); setReviewError(''); }}
                          className="px-4 py-1.5 text-gray-500 hover:text-gray-700 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() =>
                        setReviewForm({ bookingId: booking.id, rating: 0, comment: '' })
                      }
                      className="mt-3 text-sm text-pink-500 hover:underline"
                    >
                      + Leave a review
                    </button>
                  )
                )}
                {booking.status === 'COMPLETED' && booking.review && (
                  <p className="mt-3 text-xs text-green-600">✓ Review submitted</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
