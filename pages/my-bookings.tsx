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

const STATUS_META: Record<string, { label: string; bar: string; badge: string; text: string }> = {
  CONFIRMED:            { label: 'Confirmed',           bar: '#0D9488', badge: '#F0FDFA', text: '#0D9488' },
  PENDING:              { label: 'Pending',              bar: '#F59E0B', badge: '#FFFBEB', text: '#B45309' },
  COMPLETED:            { label: 'Completed',            bar: '#6366F1', badge: '#EEF2FF', text: '#4338CA' },
  CANCELLED_BY_USER:    { label: 'Cancelled by you',    bar: '#94A3B8', badge: '#F1F5F9', text: '#64748B' },
  CANCELLED_BY_BUSINESS:{ label: 'Cancelled',           bar: '#94A3B8', badge: '#F1F5F9', text: '#64748B' },
  NO_SHOW:              { label: 'No show',              bar: '#EF4444', badge: '#FEF2F2', text: '#DC2626' },
  PENDING_PAYMENT:      { label: 'Payment pending',     bar: '#F97316', badge: '#FFF7ED', text: '#C2410C' },
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
    setReviewSaving(true); setReviewError('');
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewForm),
      });
      if (!res.ok) { const d = await res.json(); setReviewError(d.error ?? 'Failed'); return; }
      setBookings((prev) => prev.map((b) => b.id === reviewForm.bookingId ? { ...b, review: { id: 'submitted' } } : b));
      setReviewForm(null);
    } catch { setReviewError('Network error'); }
    finally { setReviewSaving(false); }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F8FAFC' }}>
        <div className="flex gap-2">
          {[0,1,2].map(i => (
            <div key={i} className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#0D9488', animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-5 px-4" style={{ backgroundColor: '#F8FAFC' }}>
        <div className="text-5xl">🔒</div>
        <h1 className="text-xl font-extrabold" style={{ color: '#0F172A' }}>Sign in to view your bookings</h1>
        <button onClick={() => signIn()}
          className="px-8 py-3.5 rounded-xl font-bold text-sm text-white"
          style={{ background: 'linear-gradient(135deg,#0D9488,#065F46)' }}>
          Sign In
        </button>
      </div>
    );
  }

  return (
    <>
      <Head><title>My Bookings | Model Call</title></Head>

      {/* Page hero */}
      <div className="relative overflow-hidden" style={{ backgroundColor: '#0F172A' }}>
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-10 blur-3xl" style={{ backgroundColor: '#0D9488' }} />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 py-12">
          <h1 className="text-3xl font-extrabold text-white">My Bookings</h1>
          <p className="mt-1 text-sm" style={{ color: '#64748B' }}>
            {session.user?.email}
          </p>
        </div>
      </div>

      <div className="py-10 px-4" style={{ backgroundColor: '#F8FAFC', minHeight: '60vh' }}>
        <div className="max-w-3xl mx-auto">
          {loading ? (
            <div className="text-center py-20" style={{ color: '#94A3B8' }}>Loading your bookings…</div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-24">
              <div className="text-6xl mb-5">📅</div>
              <h2 className="text-xl font-extrabold mb-2" style={{ color: '#0F172A' }}>No bookings yet</h2>
              <p className="text-sm mb-8" style={{ color: '#64748B' }}>Find a free or discounted treatment near you and claim your first spot.</p>
              <Link href="/"
                className="inline-block px-8 py-3.5 rounded-xl font-bold text-sm text-white"
                style={{ background: 'linear-gradient(135deg,#0D9488,#065F46)' }}>
                Browse treatments
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => {
                const meta = STATUS_META[booking.status] ?? { label: booking.status.replace(/_/g,' '), bar: '#94A3B8', badge: '#F1F5F9', text: '#64748B' };
                const isFree = booking.service.price === 0;
                return (
                  <div key={booking.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    {/* Status color bar */}
                    <div className="h-1" style={{ backgroundColor: meta.bar }} />
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <Link href={`/businesses/${booking.business.slug}`}
                            className="font-bold text-base hover:underline"
                            style={{ color: '#0F172A' }}>
                            {booking.business.name}
                          </Link>
                          <p className="text-sm mt-0.5 truncate" style={{ color: '#64748B' }}>
                            {booking.service.name} &middot; {booking.service.durationMin} min
                          </p>
                          <div className="flex items-center gap-3 mt-2">
                            <p className="text-xs font-medium" style={{ color: '#94A3B8' }}>
                              📅 {new Date(booking.startTime).toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' })}
                            </p>
                            <span className="text-sm font-extrabold" style={{ color: isFree ? '#0D9488' : '#0F172A' }}>
                              {isFree ? 'FREE' : `$${(booking.service.price / 100).toFixed(0)}`}
                            </span>
                          </div>
                        </div>
                        <span className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-full"
                          style={{ backgroundColor: meta.badge, color: meta.text }}>
                          {meta.label}
                        </span>
                      </div>

                      {/* Review */}
                      {booking.status === 'COMPLETED' && !booking.review && (
                        reviewForm?.bookingId === booking.id ? (
                          <div className="mt-5 pt-4 border-t border-gray-100">
                            <p className="text-sm font-bold mb-3" style={{ color: '#0F172A' }}>How was your experience?</p>
                            <div className="flex gap-2 mb-3">
                              {[1,2,3,4,5].map((star) => (
                                <button key={star}
                                  onClick={() => setReviewForm((f) => f ? { ...f, rating: star } : null)}
                                  className="text-3xl transition-transform hover:scale-110"
                                  style={{ color: reviewForm.rating >= star ? '#F59E0B' : '#E2E8F0' }}>
                                  ★
                                </button>
                              ))}
                            </div>
                            <textarea
                              value={reviewForm.comment}
                              onChange={(e) => setReviewForm((f) => f ? { ...f, comment: e.target.value } : null)}
                              rows={2}
                              placeholder="Tell others about your experience (optional)"
                              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm mb-3 focus:outline-none"
                              style={{ backgroundColor: '#F8FAFC' }}
                            />
                            {reviewError && <p className="text-xs text-red-500 mb-3">{reviewError}</p>}
                            <div className="flex gap-2">
                              <button onClick={submitReview}
                                disabled={reviewSaving || reviewForm.rating === 0}
                                className="px-5 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-40"
                                style={{ backgroundColor: '#0D9488' }}>
                                {reviewSaving ? 'Submitting…' : 'Submit Review'}
                              </button>
                              <button onClick={() => { setReviewForm(null); setReviewError(''); }}
                                className="px-5 py-2 rounded-xl text-sm font-medium"
                                style={{ color: '#64748B' }}>Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setReviewForm({ bookingId: booking.id, rating: 0, comment: '' })}
                            className="mt-4 inline-flex items-center gap-1 text-sm font-semibold"
                            style={{ color: '#0D9488' }}>
                            ★ Leave a review
                          </button>
                        )
                      )}
                      {booking.status === 'COMPLETED' && booking.review && (
                        <p className="mt-3 text-xs font-semibold" style={{ color: '#0D9488' }}>✓ Review submitted, thank you!</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
