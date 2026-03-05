// pages/api/bookings/index.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { BookingEngine } from '../../../booking-engine';
import { AvailabilityManager } from '../../../business-availability';
import { TrustSafetyManager } from '../../../trust-safety';

// Instantiate our managers
const bookingEngine = new BookingEngine();
const availabilityManager = new AvailabilityManager();
const trustSafetyManager = new TrustSafetyManager();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // 1. AUTHENTICATION (New Step)
  const session = await getServerSession(req, res, authOptions);
  
  if (!session || !session.user || !session.user.id) {
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'You must be logged in to book.' });
  }

  const userId = session.user.id; // Get ID securely from session

  try {
    const { businessId, serviceId, startTime, durationMin } = req.body;

    // 2. Safety Check: Rate Limit
    await trustSafetyManager.checkRateLimit(userId);

    // 3. Availability Check: Is Business Open?
    const startDateTime = new Date(startTime);
    const isOpen = await availabilityManager.isBusinessOpen(businessId, startDateTime);
    
    if (!isOpen) {
      return res.status(400).json({ 
        error: 'BUSINESS_CLOSED', 
        message: 'The business is closed at this time.' 
      });
    }

    // 4. Create Booking (Atomic Transaction)
    const booking = await bookingEngine.createBooking(
      userId,
      businessId,
      serviceId,
      startDateTime,
      durationMin
    );

    // 5. Success Response
    return res.status(201).json(booking);

  } catch (error: any) {
    console.error(error);
    
    // Handle specific errors
    if (error.message.includes('SLOT_UNAVAILABLE')) {
      return res.status(409).json({ error: 'SLOT_UNAVAILABLE', message: 'This slot is already booked.' });
    }
    if (error.message.includes('RATE_LIMIT')) {
      return res.status(429).json({ error: 'RATE_LIMIT', message: 'Too many pending bookings.' });
    }

    return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong.' });
  }
}
