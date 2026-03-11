// components/BookingCalendar.tsx
// Availability-first booking flow — fetches next 14 days on mount,
// then renders adaptively: 0 dates → waitlist, 1 date → skip picker,
// ≤7 dates → date chips, >7 dates → mini calendar with highlights.
import React, { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';
import { CalendarCheck, Clock, AlertCircle } from 'lucide-react';

const StripeCheckout = dynamic(() => import('./StripeCheckout'), { ssr: false });

type Step = 'select' | 'paying' | 'success';

interface PendingPayment {
  bookingId: string;
  clientSecret: string | null;
  slotTime: string;
}

interface AvailabilityData {
  dates: Record<string, string[]>;
  nextAvailable: string | null;
  totalSlots: number;
}

export default function BookingCalendar({
  businessId,
  serviceId,
  durationMin,
}: {
  businessId: string;
  serviceId: string;
  durationMin: number;
}) {
  const { data: session } = useSession();
  const [avail, setAvail] = useState<AvailabilityData | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>('select');
  const [pending, setPending] = useState<PendingPayment | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);

  // ── Fetch next 14 days of availability on mount ─────────────────
  useEffect(() => {
    if (!businessId) return;

    async function fetchAvailability() {
      setLoading(true);
      setError(null);
      try {
        const qs = new URLSearchParams({
          businessId,
          serviceId,
          days: '14',
        }).toString();
        const res = await fetch(`/api/availability/next?${qs}`);
        if (!res.ok) throw new Error('Failed to load availability');
        const data: AvailabilityData = await res.json();
        setAvail(data);

        // Auto-select: if only 1 date, select it immediately
        const dateKeys = Object.keys(data.dates);
        if (dateKeys.length === 1) {
          setSelectedDate(dateKeys[0]);
        } else if (dateKeys.length > 0 && !selectedDate) {
          setSelectedDate(dateKeys[0]);
        }
      } catch (err: any) {
        setError(err.message ?? 'Could not load availability.');
      } finally {
        setLoading(false);
      }
    }

    fetchAvailability();
  }, [businessId, serviceId]);

  // ── Derived data ────────────────────────────────────────────────
  const dateKeys = useMemo(() => (avail ? Object.keys(avail.dates).sort() : []), [avail]);
  const slotsForSelected = useMemo(
    () => (selectedDate && avail?.dates[selectedDate]) ?? [],
    [selectedDate, avail]
  );

  // ── Booking handler ─────────────────────────────────────────────
  const handleBookSlot = async (slotTime: string) => {
    if (!session?.user?.id) {
      setError('You must be signed in to book.');
      return;
    }
    const displayTime = new Date(slotTime).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    if (!window.confirm(`Confirm booking at ${displayTime}?`)) return;

    setBookingLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId, serviceId, startTime: slotTime }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? 'Booking failed. Please try again.');
        return;
      }

      const { booking, clientSecret } = data as {
        booking: { id: string };
        clientSecret: string | null;
      };

      if (clientSecret) {
        setPending({ bookingId: booking.id, clientSecret, slotTime });
        setStep('paying');
      } else {
        setPending({ bookingId: booking.id, clientSecret: null, slotTime });
        setStep('success');
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  // ── Stripe callbacks ────────────────────────────────────────────
  const handlePaymentSuccess = () => setStep('success');

  const handlePaymentCancel = async () => {
    if (pending?.bookingId) {
      await fetch(`/api/bookings/${pending.bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED_BY_USER' }),
      }).catch(() => {});
    }
    setPending(null);
    setStep('select');
  };

  // ── Render: success ─────────────────────────────────────────────
  if (step === 'success' && pending) {
    return (
      <div className="p-5 text-center">
        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
          <CalendarCheck className="w-6 h-6 text-emerald-600" strokeWidth={2} />
        </div>
        <h2 className="text-lg font-bold text-[#0F172A] mb-1">Booking Confirmed!</h2>
        <p className="text-[13px] text-[#64748B] mb-4">
          {new Date(pending.slotTime).toLocaleString('en-AU', {
            weekday: 'short', day: 'numeric', month: 'short',
            hour: '2-digit', minute: '2-digit',
          })}
          {session?.user?.email && (
            <> &mdash; confirmation sent to {session.user.email}</>       
          )}
        </p>
        <button
          onClick={() => { setStep('select'); setPending(null); }}
          className="text-[#0D9488] underline text-sm font-semibold"
        >
          Book another appointment
        </button>
      </div>
    );
  }

  // ── Render: Stripe payment ──────────────────────────────────────
  if (step === 'paying' && pending?.clientSecret) {
    return (
      <div className="p-5">
        <h2 className="text-lg font-bold text-[#0F172A] mb-1">Complete Payment</h2>
        <p className="text-[13px] text-[#64748B] mb-1">
          {new Date(pending.slotTime).toLocaleString('en-AU', {
            weekday: 'short', day: 'numeric', month: 'short',
            hour: '2-digit', minute: '2-digit',
          })}
        </p>
        <p className="text-[11px] text-[#94A3B8] mb-4">
          A deposit will be held on your card to secure this appointment.
        </p>
        <StripeCheckout
          clientSecret={pending.clientSecret}
          onSuccess={handlePaymentSuccess}
          onCancel={handlePaymentCancel}
        />
      </div>
    );
  }

  // ── Render: loading ─────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-5 text-center">
        <div className="w-5 h-5 border-2 border-[#0D9488] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-[13px] text-[#94A3B8]">Checking availability&hellip;</p>
      </div>
    );
  }

  // ── Render: error ───────────────────────────────────────────────
  if (error && !avail) {
    return (
      <div className="p-5 text-center">
        <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
        <p className="text-[13px] text-red-500">{error}</p>
      </div>
    );
  }

  // ── Render: no availability ─────────────────────────────────────
  if (dateKeys.length === 0) {
    return (
      <div className="p-5 text-center">
        <Clock className="w-8 h-8 text-[#CBD5E1] mx-auto mb-2" />
        <p className="text-[14px] font-semibold text-[#0F172A] mb-1">No availability</p>
        <p className="text-[13px] text-[#94A3B8]">
          This business has no open slots in the next 14 days.
        </p>
      </div>
    );
  }

  // ── Render: availability-first selector ─────────────────────────
  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="p-5 space-y-4">
      {/* Next available banner */}
      {avail?.nextAvailable && (
        <div className="flex items-center gap-2 text-[13px]">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-[#0F172A]">Next available:</span>
          <span className="text-[#0D9488] font-medium">
            {new Date(avail.nextAvailable).toLocaleDateString('en-AU', {
              weekday: 'short', day: 'numeric', month: 'short',
            })}
          </span>
        </div>
      )}

      {/* Date chips (≤7 dates) or mini calendar (>7) */}
      {dateKeys.length > 1 && (
        <div>
          <p className="text-[10px] font-black text-[#0F172A] tracking-widest uppercase mb-2">Date</p>
          {dateKeys.length <= 7 ? (
            // ── Date chips ──
            <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              {dateKeys.map((dateStr) => {
                const d = new Date(dateStr + 'T00:00:00');
                const isToday = dateStr === todayStr;
                const isActive = selectedDate === dateStr;
                return (
                  <button
                    key={dateStr}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`
                      shrink-0 flex flex-col items-center px-3.5 py-2 rounded-xl border-2 transition-all duration-150
                      ${isActive
                        ? 'border-[#0D9488] bg-[#F0FDFA]'
                        : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1]'
                      }
                    `}
                  >
                    <span className="text-[10px] font-bold text-[#94A3B8] uppercase">
                      {isToday ? 'Today' : d.toLocaleDateString('en-AU', { weekday: 'short' })}
                    </span>
                    <span className={`text-[16px] font-black ${isActive ? 'text-[#0D9488]' : 'text-[#0F172A]'}`}>
                      {d.getDate()}
                    </span>
                    <span className="text-[10px] text-[#94A3B8]">
                      {d.toLocaleDateString('en-AU', { month: 'short' })}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            // ── Fallback date input for >7 dates ──
            <input
              type="date"
              value={selectedDate ?? ''}
              min={dateKeys[0]}
              max={dateKeys[dateKeys.length - 1]}
              onChange={(e) => {
                const val = e.target.value;
                // Snap to nearest available date
                if (avail?.dates[val]) {
                  setSelectedDate(val);
                } else {
                  const nearest = dateKeys.find((d) => d >= val) ?? dateKeys[dateKeys.length - 1];
                  setSelectedDate(nearest);
                }
              }}
              className="w-full p-2.5 border-2 border-[#E2E8F0] rounded-xl text-[13px] font-medium text-[#0F172A] focus:outline-none focus:border-[#0D9488] transition-colors"
            />
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-red-500 text-[13px] rounded-lg bg-red-50 p-2">{error}</p>
      )}
      {bookingLoading && (
        <p className="text-[13px] text-[#94A3B8]">Creating your booking&hellip;</p>
      )}

      {/* Time slots */}
      {selectedDate && (
        <div>
          <p className="text-[10px] font-black text-[#0F172A] tracking-widest uppercase mb-2">Time</p>
          {slotsForSelected.length === 0 ? (
            <p className="text-[13px] text-[#94A3B8] py-2">No slots on this date.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {slotsForSelected.map((slot) => (
                <button
                  key={slot}
                  onClick={() => handleBookSlot(slot)}
                  disabled={bookingLoading}
                  className="px-3 py-2.5 rounded-xl border-2 border-[#E2E8F0] bg-white text-[13px] font-semibold text-[#0F172A] hover:border-[#0D9488] hover:bg-[#F0FDFA] active:bg-[#CCFBF1] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {new Date(slot).toLocaleTimeString('en-AU', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
