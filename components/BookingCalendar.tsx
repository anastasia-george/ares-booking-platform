// components/BookingCalendar.tsx
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';

// Dynamic import — Stripe must not be rendered server-side.
const StripeCheckout = dynamic(() => import('./StripeCheckout'), { ssr: false });

type Step = 'select' | 'paying' | 'success';

interface PendingPayment {
  bookingId: string;
  clientSecret: string | null;
  slotTime: string;
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
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [slots, setSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>('select');
  const [pending, setPending] = useState<PendingPayment | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);

  // --------------------------------------------------------------------
  // 1. Fetch available slots when date / service changes
  // --------------------------------------------------------------------
  useEffect(() => {
    if (!businessId || !durationMin) return;

    async function fetchSlots() {
      setLoading(true);
      setError(null);
      try {
        const qs = new URLSearchParams({
          businessId,
          date: selectedDate.toISOString().slice(0, 10),
          durationMin: String(durationMin),
          serviceId,
        }).toString();
        const res = await fetch(`/api/availability?${qs}`);
        if (!res.ok) throw new Error('Failed to load slots');
        const data = await res.json();
        setSlots(data.slots ?? []);
      } catch (err: any) {
        setError(err.message ?? 'Could not load availability.');
      } finally {
        setLoading(false);
      }
    }

    fetchSlots();
  }, [selectedDate, businessId, durationMin, serviceId]);

  // --------------------------------------------------------------------
  // 2. Handle slot selection → create booking → get clientSecret
  // --------------------------------------------------------------------
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
        // Deposit required — show Stripe payment form
        setPending({ bookingId: booking.id, clientSecret, slotTime });
        setStep('paying');
      } else {
        // No deposit — booking confirmed immediately
        setPending({ bookingId: booking.id, clientSecret: null, slotTime });
        setStep('success');
        setSlots((prev) => prev.filter((s) => s !== slotTime));
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  // --------------------------------------------------------------------
  // 3. Stripe payment completed
  // --------------------------------------------------------------------
  const handlePaymentSuccess = () => {
    setStep('success');
    setSlots((prev) => prev.filter((s) => s !== pending?.slotTime));
  };

  // --------------------------------------------------------------------
  // 4. User cancelled payment — cancel the PENDING_PAYMENT booking
  // --------------------------------------------------------------------
  const handlePaymentCancel = async () => {
    if (pending?.bookingId) {
      await fetch(`/api/bookings/${pending.bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED_BY_USER' }),
      }).catch(() => { /* best-effort */ });
    }
    setPending(null);
    setStep('select');
  };

  // --------------------------------------------------------------------
  // Render: success
  // --------------------------------------------------------------------
  if (step === 'success' && pending) {
    return (
      <div className="p-4 border rounded shadow-md max-w-md mx-auto text-center">
        <div className="text-green-500 text-5xl mb-3">✓</div>
        <h2 className="text-lg font-bold mb-2">Booking Confirmed!</h2>
        <p className="text-gray-600 text-sm mb-4">
          {new Date(pending.slotTime).toLocaleString()} — a confirmation email
          has been sent to {session?.user?.email}.
        </p>
        <button
          onClick={() => { setStep('select'); setPending(null); }}
          className="text-indigo-600 underline text-sm"
        >
          Book another appointment
        </button>
      </div>
    );
  }

  // --------------------------------------------------------------------
  // Render: Stripe payment
  // --------------------------------------------------------------------
  if (step === 'paying' && pending?.clientSecret) {
    return (
      <div className="p-4 border rounded shadow-md max-w-md mx-auto">
        <h2 className="text-lg font-bold mb-1">Complete Payment</h2>
        <p className="text-sm text-gray-500 mb-1">
          {new Date(pending.slotTime).toLocaleString()}
        </p>
        <p className="text-xs text-gray-400 mb-4">
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

  // --------------------------------------------------------------------
  // Render: slot selection
  // --------------------------------------------------------------------
  return (
    <div className="p-4 border rounded shadow-md max-w-md mx-auto">
      <h2 className="text-lg font-bold mb-4">Select a Time</h2>
      <input
        type="date"
        value={selectedDate.toISOString().slice(0, 10)}
        min={new Date().toISOString().slice(0, 10)}
        onChange={(e) => setSelectedDate(new Date(e.target.value + 'T12:00:00'))}
        className="mb-4 p-2 border rounded w-full"
      />

      {loading && <p className="text-gray-500 text-sm">Checking availability…</p>}
      {error && (
        <p className="text-red-500 text-sm rounded bg-red-50 p-2 mb-2">{error}</p>
      )}
      {bookingLoading && (
        <p className="text-gray-500 text-sm">Creating your booking…</p>
      )}

      <div className="grid grid-cols-3 gap-2 mt-2">
        {!loading && slots.length === 0 && !error && (
          <p className="col-span-3 text-center text-gray-500 text-sm py-4">
            No slots available on this date.
          </p>
        )}
        {slots.map((slot) => (
          <button
            key={slot}
            onClick={() => handleBookSlot(slot)}
            disabled={bookingLoading}
            className="p-2 bg-blue-100 hover:bg-blue-600 hover:text-white rounded transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {new Date(slot).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </button>
        ))}
      </div>
    </div>
  );
}
