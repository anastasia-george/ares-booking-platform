// stripe-payments.ts
import Stripe from 'stripe';
import { PrismaClient, BookingStatus } from '@prisma/client';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2022-11-15' });

export class PaymentManager {

  /**
   * 1. CREATE HOLD
   * Authorize a charge but don't capture it yet (Holding Fee).
   * This is called BEFORE the booking is confirmed.
   */
  async createPaymentHold(userId: string, amountCents: number, bookingId: string): Promise<string> {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'aud',
      payment_method_types: ['card'],
      capture_method: 'manual', // Hold only
      metadata: { bookingId, userId }
    });

    // Save intent ID to booking
    await prisma.booking.update({
      where: { id: bookingId },
      data: { 
        paymentId: paymentIntent.id,
        paymentStatus: 'authorized'
      }
    });

    return paymentIntent.client_secret!;
  }

  /**
   * 2. CAPTURE PAYMENT (Post-Service)
   * Capture the held amount after the service is complete.
   */
  async capturePayment(bookingId: string): Promise<void> {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking || !booking.paymentId) throw new Error("No payment to capture");

    await stripe.paymentIntents.capture(booking.paymentId);

    await prisma.booking.update({
      where: { id: bookingId },
      data: { paymentStatus: 'paid', status: BookingStatus.COMPLETED }
    });
  }

  /**
   * 3. CHARGE NO-SHOW FEE
   * If user no-shows, capture the deposit amount (partial or full).
   */
  async chargeNoShowFee(bookingId: string, feePercent: number): Promise<void> {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking || !booking.paymentId) throw new Error("No payment to charge");

    const amountToCapture = Math.round(booking.price * (feePercent / 100));

    if (amountToCapture > 0) {
      await stripe.paymentIntents.capture(booking.paymentId, {
        amount_to_capture: amountToCapture
      });
    } else {
      await stripe.paymentIntents.cancel(booking.paymentId); // Release hold if 0 fee
    }

    await prisma.booking.update({
      where: { id: bookingId },
      data: { 
        paymentStatus: 'charged_no_show',
        status: BookingStatus.NO_SHOW 
      }
    });
  }

  /**
   * 4. REFUND / CANCEL HOLD
   * Release the hold if user cancels within policy window.
   */
  async cancelHold(bookingId: string): Promise<void> {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking || !booking.paymentId) return;

    await stripe.paymentIntents.cancel(booking.paymentId);

    await prisma.booking.update({
      where: { id: bookingId },
      data: { paymentStatus: 'refunded' }
    });
  }
}
