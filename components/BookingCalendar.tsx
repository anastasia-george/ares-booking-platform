// components/BookingCalendar.tsx
import React, { useState, useEffect } from 'react';

interface Slot {
  date: string; // ISO String
  available: boolean;
}

export default function BookingCalendar({ businessId, serviceId, durationMin }: { businessId: string, serviceId: string, durationMin: number }) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [slots, setSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch Slots when Date/Service Changes
  useEffect(() => {
    async function fetchSlots() {
      setLoading(true);
      setError(null);
      try {
        const isoDate = selectedDate.toISOString().slice(0, 10);
        const res = await fetch(`/api/availability?businessId=${businessId}&date=${isoDate}&durationMin=${durationMin}`);
        
        if (!res.ok) throw new Error('Failed to load slots');
        
        const data = await res.json();
        setSlots(data.slots || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    if (businessId && durationMin) {
      fetchSlots();
    }
  }, [selectedDate, businessId, durationMin]);

  // 2. Handle Booking Confirmation
  const handleBookSlot = async (slotTime: string) => {
    if (!window.confirm(`Confirm booking for ${new Date(slotTime).toLocaleTimeString()}?`)) return;

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          serviceId,
          startTime: slotTime,
          durationMin,
          userId: 'test-user-id' // TODO: Get from Auth Context
        })
      });

      if (!res.ok) {
        const err = await res.json();
        alert(`Booking Failed: ${err.message}`);
        return;
      }

      const booking = await res.json();
      alert(`Success! Booking ID: ${booking.id}`);
      // Refresh slots
      setSlots((prev) => prev.filter((s) => s !== slotTime));

    } catch (err) {
      alert('Network Error');
    }
  };

  return (
    <div className="p-4 border rounded shadow-md max-w-md mx-auto">
      <h2 className="text-lg font-bold mb-4">Select a Time</h2>
      
      {/* Date Picker (Simple) */}
      <input 
        type="date" 
        value={selectedDate.toISOString().slice(0, 10)}
        onChange={(e) => setSelectedDate(new Date(e.target.value))}
        className="mb-4 p-2 border rounded w-full"
      />

      {/* Loading State */}
      {loading && <p className="text-gray-500">Checking availability...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {/* Slots Grid */}
      <div className="grid grid-cols-3 gap-2">
        {!loading && slots.length === 0 && <p className="col-span-3 text-center text-gray-500">No slots available.</p>}
        
        {slots.map((slot) => (
          <button
            key={slot}
            onClick={() => handleBookSlot(slot)}
            className="p-2 bg-blue-100 hover:bg-blue-600 hover:text-white rounded transition text-sm"
          >
            {new Date(slot).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </button>
        ))}
      </div>
    </div>
  );
}
