// components/BusinessDashboard.tsx
import React, { useState, useEffect } from 'react';

interface Dispute {
  id: string;
  status: string;
  reason: string;
}

interface Booking {
  id: string;
  user: { name: string | null; email: string };
  service: { name: string; durationMin: number };
  startTime: string;
  status: string;
  paymentStatus: string | null;
  dispute: Dispute | null;
}

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: 'bg-green-100 text-green-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  PENDING_PAYMENT: 'bg-orange-100 text-orange-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
  NO_SHOW: 'bg-red-100 text-red-800',
  CANCELLED_BY_USER: 'bg-gray-100 text-gray-600',
  CANCELLED_BY_BUSINESS: 'bg-gray-100 text-gray-600',
  DISPUTED: 'bg-purple-100 text-purple-800',
  REFUNDED: 'bg-gray-100 text-gray-500',
};

export default function BusinessDashboard({ businessId }: { businessId: string }) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [actionError, setActionError] = useState<Record<string, string>>({});

  // ------------------------------------------------------------------
  // 1. Fetch bookings
  // ------------------------------------------------------------------
  useEffect(() => {
    async function fetchBookings() {
      setLoading(true);
      setFetchError(null);
      try {
        const res = await fetch(`/api/business/${businessId}/bookings`);
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message ?? `HTTP ${res.status}`);
        }
        const data = await res.json();
        setBookings(data);
      } catch (err: any) {
        setFetchError(err.message ?? 'Failed to load bookings.');
      } finally {
        setLoading(false);
      }
    }
    fetchBookings();
  }, [businessId]);

  // ------------------------------------------------------------------
  // 2. Handle status update
  // ------------------------------------------------------------------
  const updateStatus = async (bookingId: string, newStatus: string) => {
    if (!window.confirm(`Mark this booking as ${newStatus}?`)) return;

    setActionLoading((prev) => ({ ...prev, [bookingId]: true }));
    setActionError((prev) => ({ ...prev, [bookingId]: '' }));

    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? 'Update failed');
      }

      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId ? { ...b, status: newStatus } : b
        )
      );
    } catch (err: any) {
      setActionError((prev) => ({
        ...prev,
        [bookingId]: err.message ?? 'Update failed',
      }));
    } finally {
      setActionLoading((prev) => ({ ...prev, [bookingId]: false }));
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading Dashboard…</div>;
  }

  if (fetchError) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 mb-2">Failed to load bookings</p>
        <p className="text-sm text-gray-500">{fetchError}</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Business Dashboard</h1>

      {bookings.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No bookings yet.</p>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <div className="text-sm font-medium text-gray-900">{booking.user.name ?? '—'}</div>
                    <div className="text-xs text-gray-500">{booking.user.email}</div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500">
                    {booking.service.name}
                    <span className="text-xs text-gray-400 ml-1">({booking.service.durationMin}m)</span>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap">
                    {new Date(booking.startTime).toLocaleString()}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                        STATUS_COLORS[booking.status] ?? 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {booking.status}
                    </span>
                    {booking.dispute && (
                      <span className="ml-1 px-1.5 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">
                        dispute: {booking.dispute.status}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-xs text-gray-500">
                    {booking.paymentStatus ?? '—'}
                  </td>
                  <td className="px-4 py-4 text-sm">
                    {actionLoading[booking.id] ? (
                      <span className="text-gray-400 text-xs">Updating…</span>
                    ) : (
                      <div className="flex gap-2">
                        {booking.status === 'CONFIRMED' && (
                          <>
                            <button
                              onClick={() => updateStatus(booking.id, 'COMPLETED')}
                              className="text-indigo-600 hover:text-indigo-900 text-xs font-medium"
                            >
                              Complete
                            </button>
                            <button
                              onClick={() => updateStatus(booking.id, 'NO_SHOW')}
                              className="text-red-600 hover:text-red-900 text-xs font-medium"
                            >
                              No-Show
                            </button>
                          </>
                        )}
                        {booking.status === 'PENDING' && (
                          <button
                            onClick={() => updateStatus(booking.id, 'CONFIRMED')}
                            className="text-green-600 hover:text-green-900 text-xs font-medium"
                          >
                            Confirm
                          </button>
                        )}
                      </div>
                    )}
                    {actionError[booking.id] && (
                      <span className="text-red-500 text-xs block mt-1">{actionError[booking.id]}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
