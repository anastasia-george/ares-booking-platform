// pages/api/bookings/index.ts
// POST /api/bookings
// Creates a booking and returns a Stripe clientSecret for deposit payment.
// Flow: Create booking (PENDING_PAYMENT) -> frontend collects card -> Stripe webhook confirms payment -> CONFIRMED
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/auth';
import { BookingEngine } from '../../../booking-engine';
import { AvailabilityManager } from '../../../business-availability';
import { TrustSafetyManager } from '../../../trust-safety';
import { PaymentManager } from '../../../stripe-payments';
import { getPolicy } from '../../../business-policy';
import { checkBookingEligibility } from '../../../lib/reputation';

const bookingEngine = new BookingEngine();
const availabilityManager = new AvailabilityManager();
const trustSafetyManager = new TrustSafetyManager();
const paymentManager = new PaymentManager();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'You must be logged in to book.' });
  }

  const userId = session.user.id;

  try {
    const { businessId, serviceId, startTime, notes } = req.body;

    if (!businessId || !serviceId || !startTime) {
      return res.status(400).json({ error: 'MISSING_FIELDS', message: 'businessId, serviceId, and startTime are required.' });
    }

    // 1. Reputation check — hard block if score < 20
    const eligibility = await checkBookingEligibility(userId);
    if (!eligibility.allowed) {
      return res.status(403).json({ error: 'REPUTATION_BLOCKED', message: eligibility.reason });
    }

    // 2. Rate limit — max 5 pending bookings
    await trustSafetyManager.checkRateLimit(userId);

    // 3. Business must be verified
    await trustSafetyManager.requireVerifiedBusiness(businessId);

    // 4. Availability check
    const startDateTime = new Date(startTime);
    if (isNaN(startDateTime.getTime())) {
      return res.status(400).json({ error: 'INVALID_DATE', message: 'startTime is not a valid ISO date.' });
    }

    const isOpen = await availabilityManager.isBusinessOpen(businessId, startDateTime);
    if (!isOpen) {
      return res.status(400).json({ error: 'BUSINESS_CLOSED', message: 'The business is closed at that time.' });
    }

    // 5. Create booking (atomically checks for double-booking, fetches price, applies policy)
    const booking = await bookingEngine.createBooking(userId, businessId, serviceId, startDateTime, notes);

    // 6. Create Stripe deposit hold (if deposit required)
    const policy = await getPolicy(businessId);
    let clientSecret: string | null = null;

    if (policy.depositRequired) {
      const depositCents = Math.round(booking.price * (policy.depositPercent / 100));
      clientSecret = await paymentManager.createPaymentHold(userId, depositCents, booking.id);
    } else {
      // No deposit required — auto-confirm immediately
      await bookingEngine.confirmAfterPayment(booking.id, 'NO_DEPOSIT', 0);
    }

    return res.status(201).json({ booking, clientSecret });

  } catch (error: any) {
    console.error('[POST /api/bookings]', error);

    const msg = error.message ?? '';
    if (msg.includes('SLOT_UNAVAILABLE'))
      return res.status(409).json({ error: 'SLOT_UNAVAILABLE', message: 'This time slot is already booked.' });
    if (msg.includes('RATE_LIMIT_EXCEEDED'))
      return res.status(429).json({ error: 'RATE_LIMIT', message: msg });
    if (msg.includes('LEAD_TIME_VIOLATION'))
      return res.status(400).json({ error: 'LEAD_TIME_VIOLATION', message: msg });
    if (msg.includes('ADVANCE_LIMIT_VIOLATION'))
      return res.status(400).json({ error: 'ADVANCE_LIMIT_VIOLATION', message: msg });
    if (msg.includes('SERVICE_NOT_FOUND') || msg.includes('SERVICE_INACTIVE'))
      return res.status(400).json({ error: 'INVALID_SERVICE', message: msg });
    if (msg.includes('UNVERIFIED_BUSINESS'))
      return res.status(400).json({ error: 'UNVERIFIED_BUSINESS', message: msg });

    return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong.' });
  }
}
