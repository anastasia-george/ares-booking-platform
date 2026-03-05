// pages/api/bookings/[id].ts
import { NextApiRequest, NextApiResponse } from 'next';
import { BookingEngine } from '../../booking-engine';
import { PaymentManager } from '../../stripe-payments';
import { PrismaClient, BookingStatus } from '@prisma/client';

const prisma = new PrismaClient();
const bookingEngine = new BookingEngine();
const paymentManager = new PaymentManager();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  // 1. GET Single Booking
  if (req.method === 'GET') {
    const booking = await prisma.booking.findUnique({
      where: { id: id as string },
      include: {
        user: true,
        service: true
      }
    });

    if (!booking) return res.status(404).json({ error: 'Not Found' });
    return res.status(200).json(booking);
  }

  // 2. PATCH (Update Status)
  if (req.method === 'PATCH') {
    const { status, cancellationReason, isBusiness } = req.body;

    try {
      // A. CANCELLATION
      if (status === 'CANCELLED_BY_USER' || status === 'CANCELLED_BY_BUSINESS') {
        // 1. Release hold
        await paymentManager.cancelHold(id as string);
        
        // 2. Update status & log
        const updated = await bookingEngine.cancelBooking(
          id as string, 
          cancellationReason || 'No reason provided', 
          isBusiness || false
        );
        return res.status(200).json(updated);
      }

      // B. COMPLETION (Service Done)
      if (status === 'COMPLETED') {
        // 1. Capture payment
        await paymentManager.capturePayment(id as string);
        
        // 2. Update status (handled inside capturePayment mostly, but ensure consistency)
        const updated = await prisma.booking.update({
          where: { id: id as string },
          data: { status: BookingStatus.COMPLETED }
        });
        return res.status(200).json(updated);
      }

      // C. NO-SHOW
      if (status === 'NO_SHOW') {
        // 1. Capture fee (e.g. 50%)
        // TODO: Fetch policy for correct %
        await paymentManager.chargeNoShowFee(id as string, 50);
        
        // 2. Mark No-Show
        const updated = await bookingEngine.markNoShow(id as string, 'admin-id'); // TODO: Auth
        return res.status(200).json(updated);
      }

      return res.status(400).json({ error: 'Invalid Status Transition' });

    } catch (error: any) {
      console.error(error);
      return res.status(500).json({ error: error.message || 'Update failed' });
    }
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
}
